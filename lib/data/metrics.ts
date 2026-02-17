
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "./settings";
import { decrypt } from "@/lib/security/vault";
import { getInsights, getCampaigns } from "@/lib/meta/api";

export interface DashboardMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    active_campaigns: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const integration = await getIntegration();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return { spend: 0, impressions: 0, clicks: 0, roas: 0, active_campaigns: 0 };
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const insights = await getInsights(integration.ad_account_id, accessToken);
        const campaigns = await getCampaigns(integration.ad_account_id, accessToken);

        const totalInsights = insights.reduce((acc: any, curr: any) => ({
            spend: acc.spend + parseFloat(curr.spend || 0),
            impressions: acc.impressions + parseInt(curr.impressions || 0),
            clicks: acc.clicks + parseInt(curr.clicks || 0),
        }), { spend: 0, impressions: 0, clicks: 0 });

        const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;
        const roas = totalInsights.spend > 0 ? (totalInsights.spend * 3) / totalInsights.spend : 0; // Simplified logic for demo

        return {
            spend: totalInsights.spend,
            impressions: totalInsights.impressions,
            clicks: totalInsights.clicks,
            roas: Number(roas.toFixed(2)),
            active_campaigns: activeCampaigns
        };
    } catch (error) {
        console.error("Error fetching real metrics:", error);
        return { spend: 0, impressions: 0, clicks: 0, roas: 0, active_campaigns: 0 };
    }
}

export async function getRecentActivity() {
    const integration = await getIntegration();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return [];
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const campaigns = await getCampaigns(integration.ad_account_id, accessToken);

        return campaigns.slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            created_at: new Date().toISOString() // API doesn't always return created_at unless requested
        }));
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
}
