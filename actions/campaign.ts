"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet, updateObjectStatus } from "@/lib/meta/api";
import { parseTargetingFromGoal } from "@/lib/ai/openai";
import { createLog } from "@/lib/data/logs";

export async function toggleCampaignStatus(id: string, status: 'ACTIVE' | 'PAUSED', name: string) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);

        await updateObjectStatus(id, status, accessToken);

        await createLog({
            action_type: status === 'ACTIVE' ? 'ACTIVATE' : 'PAUSE',
            description: `Campanha "${name}" foi ${status === 'ACTIVE' ? 'ativada' : 'pausada'}.`,
            target_id: id,
            target_name: name,
            agent: 'USER',
            status: 'SUCCESS'
        });

        revalidatePath("/dashboard/campaigns");
        return { success: true };
    } catch (error: any) {
        console.error("Toggle campaign status error:", error);
        await createLog({
            action_type: status === 'ACTIVE' ? 'ACTIVATE' : 'PAUSE',
            description: `Erro ao alterar status da campanha "${name}".`,
            target_id: id,
            target_name: name,
            agent: 'USER',
            status: 'FAILED',
            metadata: { error: error.message }
        });
        return { success: false, error: error.message };
    }
}

export async function createSmartCampaignAction(formData: { objective: string, goal: string, budget: string }) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        throw new Error("No Meta integration found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);

        // 1. Create Campaign
        const campaign = await createCampaign(
            integration.ad_account_id,
            `Smart AI: ${formData.goal.substring(0, 30)}...`,
            formData.objective,
            accessToken
        );

        // 2. AI-Powered AdSet parameters parsing
        const aiTargeting = await parseTargetingFromGoal(formData.goal);

        const adSetParams = {
            name: `AI Optimized: ${formData.goal.substring(0, 20)}...`,
            billing_event: 'IMPRESSIONS' as const,
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP' as const,
            daily_budget: parseInt(formData.budget) * 100, // In cents
            targeting: {
                geo_locations: { countries: ['BR'] },
                age_min: aiTargeting.age_min,
                age_max: aiTargeting.age_max,
                publisher_platforms: ['facebook', 'instagram'],
                flexible_spec: [
                    {
                        interests: aiTargeting.interests.map((interestName: string) => ({ id: null, name: interestName }))
                    }
                ]
            },
            optimization_goal: aiTargeting.optimization_goal || 'REACH',
        };

        await createAdSet(integration.ad_account_id, campaign.id, adSetParams, accessToken);

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error("Smart campaign creation error:", error);
        return { success: false, error: error.message };
    }
}
