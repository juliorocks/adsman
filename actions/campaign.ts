
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { createCampaign, createAdSet } from "@/lib/meta/api";

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
            `Smart: ${formData.goal.substring(0, 30)}...`,
            formData.objective,
            accessToken
        );

        // 2. Simple AdSet creation logic (mocked audience based on keywords in goal)
        // In a real scenario, we'd use LLM to parse formData.goal into interests/geo
        const adSetParams = {
            name: `Smart AdSet for ${campaign.id}`,
            billing_event: 'IMPRESSIONS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            daily_budget: parseInt(formData.budget) * 100, // In cents
            targeting: {
                geo_locations: { countries: ['BR'] },
                age_min: 18,
                age_max: 65,
                // Placeholder for real AI interests parsing
            },
            optimization_goal: 'REACH',
        };

        await createAdSet(integration.ad_account_id, campaign.id, adSetParams, accessToken);

        revalidatePath("/dashboard");
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error("Smart campaign creation error:", error);
        return { success: false, error: error.message };
    }
}
