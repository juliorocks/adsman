
import { decrypt } from "@/lib/security/vault";
import { getInsights, getCampaigns } from "@/lib/meta/api";
import { getIntegration } from "./settings";

export interface DashboardMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    total_revenue: number;
    active_campaigns: number;
    cpc: number;
    cpm: number;
    ctr: number;
    conversions: number;
}

export interface MetricsFilter {
    campaignId?: string | string[];
    datePreset?: string;
    since?: string;
    until?: string;
}

export interface Campaign {
    id: string;
    name: string;
    status: string;
    created_at: string;
}

import { getManualRevenue } from "@/actions/revenue";

export async function getDashboardMetrics(filter?: MetricsFilter): Promise<DashboardMetrics> {
    const integration = await getIntegration();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return {
            spend: 0, impressions: 0, clicks: 0, roas: 0, total_revenue: 0, active_campaigns: 0,
            cpc: 0, cpm: 0, ctr: 0, conversions: 0
        };
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const targetId = filter?.campaignId || integration.ad_account_id;
        const datePreset = filter?.datePreset || 'last_30d';

        let timeRange;
        if (filter?.since && filter?.until) {
            timeRange = { since: filter.since, until: filter.until };
        }

        const insights = await getInsights(targetId, accessToken, datePreset, timeRange);
        const campaigns = await getCampaigns(integration.ad_account_id, accessToken);

        // Date handling for revenue query
        const manualSales = await getManualRevenue(
            integration.ad_account_id,
            filter?.since,
            filter?.until
        );
        const totalManualRevenue = manualSales.reduce((acc: number, curr: any) => acc + Number(curr.revenue), 0);

        const totalInsights = insights.reduce((acc: { spend: number, impressions: number, clicks: number, conversions: number }, curr: any) => ({
            spend: acc.spend + parseFloat(curr.spend || 0),
            impressions: acc.impressions + parseInt(curr.impressions || 0),
            clicks: acc.clicks + parseInt(curr.clicks || 0),
            conversions: acc.conversions + (curr.conversions || 0),
        }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

        const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;

        // Use manual revenue for ROAS if present, otherwise fallback to insights data
        const totalRevenue = totalManualRevenue > 0 ? totalManualRevenue : 0;
        const roas = totalInsights.spend > 0 ? totalRevenue / totalInsights.spend : 0;

        const cpc = totalInsights.clicks > 0 ? totalInsights.spend / totalInsights.clicks : 0;
        const ctr = totalInsights.impressions > 0 ? (totalInsights.clicks / totalInsights.impressions) * 100 : 0;
        const cpm = totalInsights.impressions > 0 ? (totalInsights.spend / totalInsights.impressions) * 1000 : 0;

        return {
            spend: totalInsights.spend,
            impressions: totalInsights.impressions,
            clicks: totalInsights.clicks,
            roas: Number(roas.toFixed(2)),
            total_revenue: totalRevenue,
            active_campaigns: activeCampaigns,
            cpc: Number(cpc.toFixed(2)),
            cpm: Number(cpm.toFixed(2)),
            ctr: Number(ctr.toFixed(2)),
            conversions: totalInsights.conversions
        };
    } catch (error) {
        console.error("Error fetching real metrics:", error);
        return {
            spend: 0, impressions: 0, clicks: 0, roas: 0, total_revenue: 0, active_campaigns: 0,
            cpc: 0, cpm: 0, ctr: 0, conversions: 0
        };
    }
}

export async function getRecentActivity(): Promise<Campaign[]> {
    const integration = await getIntegration();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return [];
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const campaigns = await getCampaigns(integration.ad_account_id, accessToken);

        return campaigns.sort((a: any, b: any) =>
            new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
        ).slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            created_at: c.created_time
        }));
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
}

export async function getDailyPerformance(filter?: MetricsFilter) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const targetId = filter?.campaignId || integration.ad_account_id;
        const datePreset = filter?.datePreset || 'last_30d';
        let timeRange;
        if (filter?.since && filter?.until) {
            timeRange = { since: filter.since, until: filter.until };
        }

        const insights = await getInsights(targetId, accessToken, datePreset, timeRange, 1);

        const manualSales = await getManualRevenue(
            integration.ad_account_id,
            filter?.since,
            filter?.until
        );

        const dailyData = insights.reduce((acc: any[], curr: any) => {
            const date = curr.date_start;
            const existingIndex = acc.findIndex((d: any) => d.date === date);

            const spend = parseFloat(curr.spend || 0);
            const clicks = parseInt(curr.clicks || 0);
            const impressions = parseInt(curr.impressions || 0);
            const roasMultiplier = curr.purchase_roas ? curr.purchase_roas.reduce((sum: number, r: any) => sum + parseFloat(r.value), 0) : 0;
            const metaRevenue = (curr.action_values ? curr.action_values.reduce((sum: number, r: any) => sum + parseFloat(r.value), 0) : 0);

            if (existingIndex > -1) {
                acc[existingIndex].spend += spend;
                acc[existingIndex].clicks += clicks;
                acc[existingIndex].impressions += impressions;
                acc[existingIndex].meta_revenue += metaRevenue;
            } else {
                acc.push({
                    date,
                    spend,
                    clicks,
                    impressions,
                    meta_revenue: metaRevenue
                });
            }
            return acc;
        }, []);

        return dailyData.map((d: any) => {
            const manualEntry = manualSales.find((s: any) => s.date === d.date);
            const totalRevenue = manualEntry ? Number(manualEntry.revenue) : d.meta_revenue;

            return {
                ...d,
                roas: d.spend > 0 ? totalRevenue / d.spend : 0,
                revenue: totalRevenue // Return total revenue explicitly if needed by frontend
            };
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error("Error fetching daily performance:", error);
        return [];
    }
}
