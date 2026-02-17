
"use server";

import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { getCampaigns, getInsights } from "@/lib/meta/api";
import { revalidatePath } from "next/cache";

export async function syncAccountData() {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return { error: "No active integration found" };
    }

    try {
        const supabase = await createClient();
        const accessToken = decrypt(integration.access_token_ref);

        // 1. Fetch Campaigns from Meta
        const campaigns = await getCampaigns(integration.ad_account_id, accessToken);

        // 2. Upsert Campaigns to DB (Skip if Mock Integration)
        if (integration.id !== "mock_int_1") {
            for (const camp of campaigns) {
                await supabase.from("campaigns").upsert({
                    meta_campaign_id: camp.id,
                    integration_id: integration.id,
                    name: camp.name,
                    status: camp.status,
                    objective: camp.objective,
                    updated_at: new Date().toISOString()
                }, { onConflict: "meta_campaign_id" });
            }
        } else {
            console.log("Mock Mode: Skipping DB save for campaigns.");
        }

        // 3. Fetch & Update Metrics (Simplified)
        const insights = await getInsights(integration.ad_account_id, accessToken);
        if (insights.length > 0) {
            // Store simple aggregation for now
            // Real implementation would store daily breakdown in 'performance_metrics'
        }

        revalidatePath("/dashboard");
        return { success: true, count: campaigns.length };
    } catch (error) {
        console.error("Sync failed", error);
        return { error: "Sync failed" };
    }
}
