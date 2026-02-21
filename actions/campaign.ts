"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet, updateObjectStatus, getAdSetsForCampaign, getAdsForAdSet } from "@/lib/meta/api";
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

export async function createSmartCampaignAction(formData: { objective: string, goal: string, budget: string }) {
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

        // Sanitize optimization goal - Force safe goals if no pixel is defined
        // OFFSITE_CONVERSIONS requires a promoted_object (pixel), which we don't have yet in this wizard
        let optimization_goal = aiTargeting.optimization_goal || 'REACH';
        if (optimization_goal === 'OFFSITE_CONVERSIONS') {
            optimization_goal = 'LINK_CLICKS';
        }

        const targeting: any = {
            geo_locations: { countries: ['BR'] },
            age_min: Math.max(18, aiTargeting.age_min || 18),
            age_max: Math.min(65, aiTargeting.age_max || 65),
            genders: aiTargeting.genders || [1, 2],
            publisher_platforms: ['facebook', 'instagram'],
        };

        // Only add interests if we have them, and format them correctly
        // DISABLED FOR DEBUGGING: Many Meta API versions reject {name: "..."} without IDs
        /*
        if (aiTargeting.interests && aiTargeting.interests.length > 0) {
            targeting.flexible_spec = [
                {
                    interests: aiTargeting.interests.map((interestName: string) => ({ name: interestName }))
                }
            ];
        }
        */

        const adSetParams = {
            name: `AI Optimized: ${formData.goal.substring(0, 20)}...`,
            billing_event: 'IMPRESSIONS' as const,
            daily_budget: Math.max(500, parseInt(formData.budget) * 100), // Min 500 cents (R$ 5)
            targeting,
            optimization_goal: optimization_goal,
        };

        await createAdSet(adAccountId, campaign.id, adSetParams, accessToken);

        await createLog({
            action_type: 'OTHER',
            description: `Campanha "${formData.goal.substring(0, 20)}..." criada com sucesso.`,
            target_id: campaign.id,
            target_name: `Smart AI: ${formData.goal.substring(0, 20)}...`,
            agent: 'STRATEGIST',
            status: 'SUCCESS',
            metadata: { objective: formData.objective, budget: formData.budget }
        });

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error("Smart campaign creation error details:", error);

        const errorMessage = error.message || "Erro desconhecido";

        await createLog({
            action_type: 'OTHER',
            description: `Falha ao criar campanha inteligente.`,
            target_id: 'NEW_CAMPAIGN',
            target_name: formData.goal.substring(0, 30),
            agent: 'STRATEGIST',
            status: 'FAILED',
            metadata: { error: errorMessage, stack: error.stack }
        });

        return {
            success: false,
            error: `###VER-300### Erro Meta Ads: ${errorMessage} [safeObj=${formData.objective}]`
        };
    }
}
