"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet, createAdCreative, createAd, getPages, uploadAdImage, uploadAdVideo, updateObjectStatus, getAdSetsForCampaign, getAdsForAdSet } from "@/lib/meta/api";
import { parseTargetingFromGoal } from "@/lib/ai/openai";
import { createLog } from "@/lib/data/logs";

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

        const pageResult = await getPages(accessToken, adAccountId);
        return { success: true, data: pageResult.pages };
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

        const targeting: any = {
            geo_locations: { countries: ['BR'] },
            age_min: Math.max(18, aiTargeting.age_min || 18),
            age_max: Math.min(65, aiTargeting.age_max || 65),
            genders: aiTargeting.genders || [1, 2],
            publisher_platforms: ['facebook', 'instagram'],
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
        const linkUrl = formData.linkUrl?.trim() || aiTargeting.link_url || 'https://www.facebook.com/';

        const adsToCreate = uploadedMedia.length > 0
            ? uploadedMedia
            : [{ ref: null, type: 'IMAGE' as const }];

        const adResults = await Promise.all(adsToCreate.map(async (mediaItem, idx) => {
            const suffix = idx > 0 ? ` v${idx + 1}` : '';
            let objectStorySpec: any = { page_id: pageId };

            if (mediaItem.type === 'VIDEO' && mediaItem.ref) {
                objectStorySpec.video_data = {
                    video_id: mediaItem.ref,
                    message: primaryText,
                    call_to_action: {
                        type: 'LEARN_MORE',
                        value: { link: linkUrl }
                    }
                };
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

            const creativeResult = await createAdCreative(
                adAccountId,
                `Creative ${formData.goal.substring(0, 15)}${suffix}`,
                objectStorySpec,
                accessToken,
                instagramId,
                (bestPage as any).alternative_instagram_ids
            );

            await createAd(
                adAccountId,
                adSet.id,
                creativeResult.id,
                `Ad ${formData.goal.substring(0, 20)}${suffix}`,
                accessToken,
                'PAUSED'
            );

            return creativeResult;
        }));

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error("Smart campaign creation error:", error);
        return { success: false, error: error.message || "Erro desconhecido" };
    }
}
