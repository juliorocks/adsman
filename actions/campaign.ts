"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet, createAdCreative, createAd, getPages, uploadAdImage, updateObjectStatus, getAdSetsForCampaign, getAdsForAdSet } from "@/lib/meta/api";
import { parseTargetingFromGoal } from "@/lib/ai/openai";
import { createLog } from "@/lib/data/logs";

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

export async function createSmartCampaignAction(formData: { objective: string, goal: string, budget: string, linkUrl?: string, images?: string[] }) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        // Sanitize objective: OUTCOME_SALES requires a pixel/catalog (promoted_object)
        // Since we don't have pixel setup in this wizard yet, fallback to OUTCOME_TRAFFIC
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

        // 2. AI-Powered AdSet parameters parsing
        const aiTargeting = await parseTargetingFromGoal(formData.goal);

        // Sanitize optimization goal for OUTCOME_TRAFFIC campaigns
        let optimization_goal = 'LINK_CLICKS'; // Safe default for traffic campaigns
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

        // Schedule: start tomorrow, run for 30 days
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

        // 3. Get a Facebook Page to use for the ad creative
        const pageResult = await getPages(accessToken, adAccountId);
        const pages = pageResult.pages;
        const pageDebug = pageResult.debug;

        if (!pages || pages.length === 0) {
            throw new Error(`Nenhuma Página do Facebook encontrada (Debug: ${pageDebug}). Vincule uma página à sua conta de anúncios no Meta Business Suite.`);
        }

        // Prioritize pages that match the Ad Account Name (to avoid client leak)
        const adAccountNameMatch = pageDebug.match(/_account_(.*?)_/);
        const adAccountName = adAccountNameMatch ? adAccountNameMatch[1] : "";

        let bestPage = pages.find(p =>
            adAccountName && (
                p.name.toLowerCase().includes(adAccountName.toLowerCase()) ||
                adAccountName.toLowerCase().includes(p.name.toLowerCase())
            )
        );

        // Fallback 1: First page with IG
        if (!bestPage) {
            bestPage = pages.find(p => (p as any).connected_instagram_account?.id);
        }

        // Fallback 2: Just the first page
        if (!bestPage) {
            bestPage = pages[0];
        }

        const pageId = bestPage.id;
        const instagramId = (bestPage as any).connected_instagram_account?.id;

        console.log(`Campaign Creation Debug - AdAcc: ${adAccountName}, Selected Page: ${bestPage.name} (${pageId}), IG: ${instagramId || 'NOT FOUND'}, Det: ${pageDebug}`);

        // 4. Upload all images in parallel
        const igStatus = instagramId ? `ig_found_${instagramId}` : `ig_missing_${pageDebug}`;
        let uploadStatus = 'no_images_provided';
        const uploadedImages: { hash: string; index: number }[] = [];

        if (formData.images && formData.images.length > 0) {
            uploadStatus = `received_${formData.images.length}_images`;
            const uploadPromises = formData.images.map(async (imgData, i) => {
                if (!imgData || imgData.length === 0) return null;
                try {
                    const result = await uploadAdImage(adAccountId, imgData, accessToken);
                    return { hash: result.hash, index: i };
                } catch (err: any) {
                    console.error(`Upload error image ${i}:`, err.message);
                    return null;
                }
            });

            const results = await Promise.all(uploadPromises);
            results.forEach(r => { if (r) uploadedImages.push(r); });
            uploadStatus = `uploaded_${uploadedImages.length}_of_${formData.images.length}`;
        }

        const imageDebug = `${igStatus} | ${uploadStatus}`;

        // 5. Create Ad Creatives + Ads
        // Robust sanitization for titles and text
        const sanitize = (text: string, limit: number) => {
            return text
                .replace(/[^\w\sÀ-ÿ,.!?-]/gi, '') // Keep only letters, numbers, basic punctuation
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, limit);
        };

        const headline = sanitize(aiTargeting.headline || formData.goal, 40);
        const primaryText = formData.goal.substring(0, 1000); // More lenient for body text
        const linkUrl = formData.linkUrl?.trim() || aiTargeting.link_url || 'https://www.facebook.com/';

        const adsToCreate = uploadedImages.length > 0
            ? uploadedImages.map((img, idx) => ({ imageHash: img.hash, label: idx + 1 }))
            : [{ imageHash: null as string | null, label: 0 }];

        // Process ad variations in parallel
        const results = await Promise.all(adsToCreate.map(async (adVariation) => {
            const suffix = adVariation.label > 0 ? ` v${adVariation.label}` : '';

            const linkData: any = {
                message: primaryText,
                link: linkUrl,
                name: headline,
                call_to_action: {
                    type: 'LEARN_MORE',
                    value: { link: linkUrl }
                }
            };

            if (adVariation.imageHash) {
                linkData.image_hash = adVariation.imageHash;
            }

            const creativeResult = await createAdCreative(
                adAccountId,
                sanitize(`Creative ${formData.goal.substring(0, 15)}${suffix}`, 60),
                { page_id: pageId, link_data: linkData },
                accessToken,
                instagramId
            );

            await createAd(
                adAccountId,
                adSet.id,
                creativeResult.id,
                sanitize(`Ad ${formData.goal.substring(0, 20)}${suffix}`, 60),
                accessToken,
                'PAUSED'
            );

            return creativeResult;
        }));

        const anyIgFallback = results.some(r => r.ig_linked === false && instagramId);
        const finalImageDebug = anyIgFallback ? `${imageDebug} | ig_fallback` : imageDebug;

        await createLog({
            action_type: 'OTHER',
            description: `Campanha "${formData.goal.substring(0, 20)}..." criada com sucesso (${adsToCreate.length} variações).`,
            target_id: campaign.id,
            target_name: `Smart AI: ${formData.goal.substring(0, 20)}...`,
            agent: 'STRATEGIST',
            status: 'SUCCESS',
            metadata: { objective: formData.objective, budget: formData.budget, pageId, imageDebug: finalImageDebug }
        });

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id, imageDebug: finalImageDebug };
    } catch (error: any) {
        console.error("Smart campaign creation error details:", error);

        const errorMessage = error.message || "Erro desconhecido";
        const accessToken = decrypt(integration.access_token_ref);
        const adAccountId = integration.ad_account_id.startsWith('act_')
            ? integration.ad_account_id
            : `act_${integration.ad_account_id}`;

        let safeObjective = formData.objective;
        if (safeObjective === 'OUTCOME_SALES' || safeObjective === 'OUTCOME_LEADS') {
            safeObjective = 'OUTCOME_TRAFFIC';
        }

        // Full debug info
        const debugInfo = {
            sentObjective: safeObjective,
            originalObjective: formData.objective,
            adAccount: adAccountId,
            tokenLen: accessToken ? accessToken.length : 0,
            tokenStart: accessToken ? accessToken.substring(0, 10) + '...' : 'EMPTY',
        };

        await createLog({
            action_type: 'OTHER',
            description: `Falha ao criar campanha inteligente.`,
            target_id: 'NEW_CAMPAIGN',
            target_name: formData.goal.substring(0, 30),
            agent: 'STRATEGIST',
            status: 'FAILED',
            metadata: { error: errorMessage, debug: debugInfo }
        });

        return {
            success: false,
            error: `###VER-400### ${errorMessage} | obj=${safeObjective} | acct=${adAccountId} | tkn=${accessToken ? accessToken.length : 0}chars`
        };
    }
}
