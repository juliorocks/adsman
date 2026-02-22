"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet, createAdCreative, createAd, getPages, uploadAdImage, uploadAdVideo, updateObjectStatus, getAdSetsForCampaign, getAdsForAdSet, uploadAdImageFromUrl, uploadAdVideoFromUrl } from "@/lib/meta/api";
import { parseTargetingFromGoal } from "@/lib/ai/openai";
import { createLog } from "@/lib/data/logs";
import { getGoogleAccessToken } from "@/actions/google-drive";
import { downloadDriveFile } from "@/lib/google/drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { META_GRAPH_URL, META_API_VERSION, waitForVideoReady } from "@/lib/meta/api";

export async function getFacebookPagesAction() {
    try {
        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
            throw new Error("No Meta integration found");
        }
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        const accountRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}?fields=name&access_token=${accessToken}`);
        const accountData = await accountRes.json();
        const accountName = accountData.name || adAccountId;

        const pageResult = await getPages(accessToken, adAccountId);
        return {
            success: true,
            data: pageResult.pages,
            accountName,
            accountId: adAccountId,
            preferredPageId: (integration as any).preferred_page_id,
            preferredInstagramId: (integration as any).preferred_instagram_id
        };
    } catch (error: any) {
        console.error("getFacebookPagesAction error:", error);
        return { success: false, error: error.message };
    }
}

export async function updatePreferredIdentityAction(pageId: string, instagramId?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { error } = await supabase
            .from('integrations')
            .update({
                preferred_page_id: pageId,
                preferred_instagram_id: instagramId
            })
            .eq('user_id', user.id)
            .eq('platform', 'meta');

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCampaignAdSetsAction(campaignId: string) {
    try {
        // DEBUG: Mock response to test server action connectivity
        return {
            success: true,
            data: [{ id: "debug-123", name: "Conjunto de Teste (DEBUG)", status: "PAUSED", billing_event: "DEBUG_EVENT", daily_budget: 1000 }]
        };

        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref) return { success: false, error: "Integração não encontrada ou sem token" };

        const accessToken = decrypt(integration.access_token_ref);
        const data = await getAdSetsForCampaign(campaignId, accessToken);
        return { success: true, data };
    } catch (error: any) {
        console.error("getCampaignAdSetsAction Error:", error);
        return { success: false, error: `Erro no servidor: ${error.message}` };
    }
}

export async function getAdSetAdsAction(adSetId: string) {
    try {
        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref) return { success: false, error: "Integração não encontrada ou sem token" };

        const accessToken = decrypt(integration.access_token_ref);
        const data = await getAdsForAdSet(adSetId, accessToken);
        return { success: true, data };
    } catch (error: any) {
        console.error("getAdSetAdsAction Error:", error);
        return { success: false, error: `Erro no servidor: ${error.message}` };
    }
}

export async function toggleStatusAction(id: string, type: 'CAMPAIGN' | 'ADSET' | 'AD', status: 'ACTIVE' | 'PAUSED', name: string) {
    const typeLabel = type === 'CAMPAIGN' ? 'Campanha' : type === 'ADSET' ? 'Conjunto' : 'Anúncio';

    try {
        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref) {
            return { success: false, error: "Integração Meta não encontrada. Verifique suas configurações." };
        }

        let accessToken: string;
        try {
            accessToken = decrypt(integration.access_token_ref);
        } catch (decryptError: any) {
            console.error("Decrypt error in toggleStatusAction:", decryptError);
            return { success: false, error: "Erro ao descriptografar token. Reconecte sua conta Meta." };
        }

        await updateObjectStatus(id, status, accessToken);

        try {
            await createLog({
                action_type: status === 'ACTIVE' ? 'ACTIVATE' : 'PAUSE',
                description: `${typeLabel} "${name}" foi ${status === 'ACTIVE' ? 'ativado(a)' : 'pausado(a)'}.`,
                target_id: id,
                target_name: name,
                agent: 'USER',
                status: 'SUCCESS'
            });
        } catch (logError) {
            console.error("Failed to create log:", logError);
        }

        revalidatePath("/dashboard/campaigns");
        return { success: true };
    } catch (error: any) {
        console.error(`Toggle ${type} status error:`, error);

        // Attempt to log failure if possible, but don't crash if logging fails
        try {
            await createLog({
                action_type: status === 'ACTIVE' ? 'ACTIVATE' : 'PAUSE',
                description: `Erro ao alterar status de ${typeLabel} "${name}".`,
                target_id: id,
                target_name: name,
                agent: 'USER',
                status: 'FAILED',
                metadata: { error: error.message }
            });
        } catch (ignore) { }

        return { success: false, error: `###VER-107### ${error.message || "Erro desconhecido ao alterar status."}` };
    }
}

export async function toggleCampaignStatus(id: string, status: 'ACTIVE' | 'PAUSED', name: string) {
    return toggleStatusAction(id, 'CAMPAIGN', status, name);
}

export async function uploadMediaAction(item: { type: 'IMAGE' | 'VIDEO', data: string }) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        if (item.type === 'VIDEO') {
            const result = await uploadAdVideo(adAccountId, item.data, accessToken);
            return { success: true, ref: result.id, type: 'VIDEO' };
        } else {
            const result = await uploadAdImage(adAccountId, item.data, accessToken);
            return { success: true, ref: result.hash, type: 'IMAGE' };
        }
    } catch (error: any) {
        console.error("Upload Media Action error:", error);
        return { success: false, error: error.message };
    }
}

export async function uploadMediaFromUrlAction(item: { type: 'IMAGE' | 'VIDEO', url: string, fileId?: string }) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        let base64 = "";

        // 1. Fetch the file on the server
        if (item.fileId && (item.url.includes('google.com') || item.url.includes('googleapis.com'))) {
            // Specialized Google Drive download
            console.log(`GAGE: Cloud Import using Drive API for fileId: ${item.fileId}`);
            const googleToken = await getGoogleAccessToken();
            if (!googleToken) throw new Error("Google Drive não conectado para baixar o arquivo.");

            const buffer = await downloadDriveFile(googleToken, item.fileId);
            base64 = buffer.toString('base64');
        } else {
            // General URL fetch
            const response = await fetch(item.url);
            if (!response.ok) throw new Error(`Failed to fetch media from URL: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();
            base64 = Buffer.from(arrayBuffer).toString('base64');
        }

        // 2. Upload to Meta as bytes
        if (item.type === 'VIDEO') {
            const result = await uploadAdVideo(adAccountId, base64, accessToken);
            return { success: true, ref: result.id, type: 'VIDEO' };
        } else {
            const result = await uploadAdImage(adAccountId, base64, accessToken);
            return { success: true, ref: result.hash, type: 'IMAGE' };
        }
    } catch (error: any) {
        console.error("Upload Media From URL Action error:", error);
        return { success: false, error: error.message };
    }
}

export async function createSmartCampaignAction(formData: {
    objective: string,
    goal: string,
    budget: string,
    linkUrl?: string,
    pageId?: string,
    instagramId?: string,
    mediaReferences?: { type: 'IMAGE' | 'VIDEO', ref: string }[]
}) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        // IDENTITY SELECTION: Priority: 1. Passed in formData, 2. Preferred in DB, 3. Discovery Fallback
        let pageId = formData.pageId || (integration as any).preferred_page_id;
        let instagramId = formData.instagramId || (integration as any).preferred_instagram_id;
        let bestPage: any = null;

        // Fetch all pages to ensure we have the full object (needed for alternative_instagram_ids matching)
        const pageResult = await getPages(accessToken, adAccountId);
        const pages = pageResult.pages;

        if (pageId) {
            bestPage = pages.find((p: any) => p.id === pageId);
        }

        if (!pageId || !bestPage) {
            if (!pages || pages.length === 0) throw new Error("Nenhuma Página do Facebook encontrada.");
            bestPage = pages[0];
            pageId = bestPage.id;
            instagramId = (bestPage as any).connected_instagram_account?.id;
            console.warn("WARNING: No identity selected or found, falling back to first page:", bestPage.name);
        }

        let safeObjective = formData.objective;
        if (safeObjective === 'OUTCOME_SALES' || safeObjective === 'OUTCOME_LEADS') {
            safeObjective = 'OUTCOME_TRAFFIC';
        }

        // 1. Create Campaign
        const campaign = await createCampaign(
            adAccountId,
            `Smart AI: ${formData.goal.substring(0, 30)}...`,
            safeObjective,
            accessToken
        );

        // 2. AI-Powered AdSet parameters Parsing
        const aiTargeting = await parseTargetingFromGoal(formData.goal);

        let optimization_goal = 'LINK_CLICKS';
        if (safeObjective === 'OUTCOME_AWARENESS') {
            optimization_goal = 'REACH';
        }

        const publisher_platforms = ['facebook'];
        if (instagramId) {
            publisher_platforms.push('instagram');
            console.log(`GAGE: Targeting both FB and IG (IG ID: ${instagramId})`);
        } else {
            console.warn("GAGE: No Instagram ID found, targeting Facebook Only.");
        }

        const targeting: any = {
            geo_locations: { countries: ['BR'] },
            age_min: Math.max(18, aiTargeting.age_min || 18),
            age_max: Math.min(65, aiTargeting.age_max || 65),
            genders: aiTargeting.genders || [1, 2],
            publisher_platforms,
            targeting_automation: { advantage_audience: 0 },
        };

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setDate(endTime.getDate() + 30);

        const adSetParams = {
            name: `AI Optimized: ${formData.goal.substring(0, 20)}...`,
            billing_event: 'IMPRESSIONS' as const,
            daily_budget: Math.max(500, parseInt(formData.budget) * 100),
            targeting,
            optimization_goal: optimization_goal,
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
        };

        const adSet = await createAdSet(adAccountId, campaign.id, adSetParams, accessToken);

        // 3. Media references are now passed pre-uploaded

        // 4. Media references are now passed pre-uploaded
        const uploadedMedia = formData.mediaReferences || [];

        // 5. Create Ad Creatives + Ads
        const headline = (aiTargeting.headline || formData.goal).substring(0, 40);
        const primaryText = formData.goal.substring(0, 1000);

        // Safety: Ensure linkUrl has a protocol
        let linkUrl = (formData.linkUrl?.trim() || aiTargeting.link_url || 'https://www.facebook.com/').trim();
        if (linkUrl && !linkUrl.startsWith('http')) {
            linkUrl = `https://${linkUrl}`;
        }

        console.log(`GAGE: Building creatives for Page: ${pageId}, Link: ${linkUrl}`);

        const adsToCreate = uploadedMedia.length > 0
            ? uploadedMedia
            : [{ ref: null, type: 'IMAGE' as const }];

        // We'll process them one by one to handle potential AdSet-level fallbacks
        const creativeResults = [];
        let isFbOnlyNow = false;

        for (let i = 0; i < adsToCreate.length; i++) {
            const mediaItem = adsToCreate[i];
            const idx = i;
            const suffix = idx > 0 ? ` v${idx + 1}` : '';
            let objectStorySpec: any = { page_id: pageId };

            if (mediaItem.type === 'VIDEO' && mediaItem.ref) {
                // EXPLICIT FIX: Wait for Meta to process the video so a thumbnail is generated
                console.log(`GAGE: Video ad detected. Checking processing status for ${mediaItem.ref}...`);
                const thumbUrl = await waitForVideoReady(mediaItem.ref, accessToken);

                objectStorySpec.video_data = {
                    video_id: mediaItem.ref,
                    message: primaryText,
                    title: headline, // V21.0: Title is often required for video ads with CTA
                    call_to_action: {
                        type: 'LEARN_MORE',
                        value: { link: linkUrl }
                    }
                };

                if (thumbUrl) {
                    objectStorySpec.video_data.image_url = thumbUrl;
                    console.log(`GAGE: Thumbnail attached manually to creative: ${thumbUrl}`);
                }
            } else {
                const linkData: any = {
                    message: primaryText,
                    link: linkUrl,
                    name: headline,
                    call_to_action: {
                        type: 'LEARN_MORE',
                        value: { link: linkUrl }
                    }
                };
                if (mediaItem.ref) linkData.image_hash = mediaItem.ref;
                objectStorySpec.link_data = linkData;
            }

            try {
                console.log(`GAGE: Creating creative ${idx + 1}/${adsToCreate.length} (IG ID: ${isFbOnlyNow ? 'STRIPPED' : (instagramId || 'None')})`);
                const creativeResult = await createAdCreative(
                    adAccountId,
                    `Creative ${formData.goal.substring(0, 15)}${suffix}`,
                    objectStorySpec,
                    accessToken,
                    isFbOnlyNow ? undefined : instagramId,
                    isFbOnlyNow ? [] : (bestPage as any).alternative_instagram_ids
                );

                await createAd(
                    adAccountId,
                    adSet.id,
                    creativeResult.id,
                    `Ad ${formData.goal.substring(0, 20)}${suffix}`,
                    accessToken,
                    'PAUSED'
                );
                creativeResults.push(creativeResult);

            } catch (err: any) {
                console.warn(`GAGE: Creative ${idx + 1} failed: ${err.message}`);

                const isIdentityError = err.message.includes('1443226') || err.message.includes('identity') || err.message.includes('Identity');

                if (isIdentityError && !isFbOnlyNow) {
                    console.log("GAGE_CORE_FALLBACK: Instagram Identity Rejected. Forcing AdSet to Facebook-Only...");
                    isFbOnlyNow = true;

                    // UPDATE ADSET TO FB-ONLY
                    const fbOnlyTargeting = {
                        ...targeting,
                        publisher_platforms: ['facebook']
                    };

                    const updateRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adSet.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targeting: fbOnlyTargeting,
                            access_token: accessToken
                        })
                    });
                    const updateData = await updateRes.json();

                    if (updateData.error) {
                        console.error("GAGE_ERROR: Failed to downgrade AdSet to FB-only:", updateData.error);
                    } else {
                        console.log("GAGE_SUCCESS: AdSet downgraded to FB-only. Retrying creative...");
                        // Give Meta a second to propagate the AdSet change
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }

                    // RETRY with no instagramId
                    const retryCreative = await createAdCreative(
                        adAccountId,
                        `Creative ${formData.goal.substring(0, 15)}${suffix}`,
                        objectStorySpec,
                        accessToken,
                        undefined,
                        []
                    );

                    await createAd(
                        adAccountId,
                        adSet.id,
                        retryCreative.id,
                        `Ad ${formData.goal.substring(0, 20)}${suffix}`,
                        accessToken,
                        'PAUSED'
                    );
                    creativeResults.push(retryCreative);
                } else {
                    throw err;
                }
            }
        }

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error("Smart campaign creation error:", error);
        return { success: false, error: error.message || "Erro desconhecido" };
    }
}
