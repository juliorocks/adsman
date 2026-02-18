
import { decrypt } from "@/lib/security/vault";
import { getInsights, getCampaigns } from "@/lib/meta/api";
import { getIntegration } from "./settings";
import { cache } from 'react';

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
    leads: number;
    conversations: number;
    results: number;
    cpa: number;
    top_gender: string;
    top_age: string;
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

export const getDashboardMetrics = cache(async function (filter?: MetricsFilter): Promise<DashboardMetrics> {
    const integration = await getIntegration();

    const emptyMetrics: DashboardMetrics = {
        spend: 0, impressions: 0, clicks: 0, roas: 0, total_revenue: 0, active_campaigns: 0,
        cpc: 0, cpm: 0, ctr: 0, conversions: 0, leads: 0, conversations: 0, results: 0, cpa: 0,
        top_gender: "N/A", top_age: "N/A"
    };

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return emptyMetrics;
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const targetId = filter?.campaignId || integration.ad_account_id;
        const datePreset = filter?.datePreset || 'last_30d';

        let timeRange;
        if (filter?.since && filter?.until) {
            timeRange = { since: filter.since, until: filter.until };
        }

        // Fetch Main Insights
        const [insights, demographicsGender, demographicsAge, campaigns] = await Promise.all([
            getInsights(targetId, accessToken, datePreset, timeRange),
            getInsights(targetId, accessToken, datePreset, timeRange, undefined, 'gender'),
            getInsights(targetId, accessToken, datePreset, timeRange, undefined, 'age'),
            getCampaigns(integration.ad_account_id, accessToken)
        ]);

        // Helpers for manual revenue query
        let startDate = filter?.since;
        let endDate = filter?.until;
        // ... (skipping switch logic for brevity as it's already there elsewhere, but I should keep it if I rewrite the whole function)
        // Actually I should just keep the flow.

        // RE-USING THE SWITCH FROM EXISTING CODE
        if (!startDate && !endDate && datePreset) {
            const today = new Date();
            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            switch (datePreset) {
                case 'today': startDate = endDate = formatDate(today); break;
                case 'yesterday':
                    const y = new Date(today); y.setDate(y.getDate() - 1);
                    startDate = endDate = formatDate(y); break;
                case 'this_month':
                    startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
                    endDate = formatDate(today); break;
                case 'last_month':
                    startDate = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
                    endDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 0)); break;
                case 'last_7d':
                    const l7 = new Date(today); l7.setDate(l7.getDate() - 7);
                    startDate = formatDate(l7); endDate = formatDate(today); break;
                case 'last_30d':
                    const l30 = new Date(today); l30.setDate(l30.getDate() - 30);
                    startDate = formatDate(l30); endDate = formatDate(today); break;
            }
        }

        const manualSales = await getManualRevenue(integration.ad_account_id, startDate, endDate);
        const totalManualRevenue = manualSales.reduce((acc: number, curr: any) => acc + Number(curr.revenue), 0);
        const totalManualSalesCount = manualSales.reduce((acc: number, curr: any) => acc + Number(curr.sales_count || 0), 0);

        const totalInsights = insights.reduce((acc: any, curr: any) => {
            const actions = curr.actions || [];
            const leads = actions.find((a: any) => a.action_type === 'lead')?.value || 0;
            const convs = actions.find((a: any) => a.action_type === 'messaging_conversation_started_7d')?.value || 0;
            const registrations = actions.find((a: any) => a.action_type === 'complete_registration')?.value || 0;
            const purchases = actions.find((a: any) => a.action_type === 'purchase')?.value || 0;

            return {
                spend: acc.spend + parseFloat(curr.spend || 0),
                impressions: acc.impressions + parseInt(curr.impressions || 0),
                clicks: acc.clicks + parseInt(curr.clicks || 0),
                leads: acc.leads + parseInt(leads),
                conversations: acc.conversations + parseInt(convs),
                meta_revenue: acc.meta_revenue + (curr.action_values ? curr.action_values.reduce((sum: number, item: any) => sum + parseFloat(item.value), 0) : 0),
                results: acc.results + parseInt(leads) + parseInt(registrations) + parseInt(purchases) + parseInt(convs)
            };
        }, { spend: 0, impressions: 0, clicks: 0, leads: 0, conversations: 0, meta_revenue: 0, results: 0 });

        // Demographics Processing
        const genderMap: any = {};
        demographicsGender.forEach((d: any) => {
            genderMap[d.gender] = (genderMap[d.gender] || 0) + parseFloat(d.spend || 0);
        });
        const topGender = Object.entries(genderMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";
        const genderLabel = topGender === 'female' ? 'Feminino' : topGender === 'male' ? 'Masculino' : topGender === 'unknown' ? 'Não inf.' : topGender;

        const ageMap: any = {};
        demographicsAge.forEach((d: any) => {
            ageMap[d.age] = (ageMap[d.age] || 0) + parseFloat(d.spend || 0);
        });
        const topAge = Object.entries(ageMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";

        const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;

        // Prioritize manual data for Revenue and Results (Conversions)
        const totalRevenue = totalManualRevenue > 0 ? totalManualRevenue : totalInsights.meta_revenue;
        const totalResults = totalManualSalesCount > 0 ? totalManualSalesCount : totalInsights.results;

        const roas = totalInsights.spend > 0 ? totalRevenue / totalInsights.spend : 0;
        const cpc = totalInsights.clicks > 0 ? totalInsights.spend / totalInsights.clicks : 0;
        const ctr = totalInsights.impressions > 0 ? (totalInsights.clicks / totalInsights.impressions) * 100 : 0;
        const cpm = totalInsights.impressions > 0 ? (totalInsights.spend / totalInsights.impressions) * 1000 : 0;
        const cpa = totalResults > 0 ? totalInsights.spend / totalResults : 0;

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
            conversions: totalResults,
            leads: totalInsights.leads,
            conversations: totalInsights.conversations,
            results: totalResults,
            cpa: Number(cpa.toFixed(2)),
            top_gender: genderLabel,
            top_age: topAge
        };
    } catch (error) {
        console.error("Error fetching real metrics:", error);
        return emptyMetrics;
    }
});


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

            const actions = curr.actions || [];
            const results = actions.reduce((sum: number, a: any) => {
                if (['lead', 'complete_registration', 'purchase', 'messaging_conversation_started_7d'].includes(a.action_type)) {
                    return sum + parseInt(a.value);
                }
                return sum;
            }, 0);

            if (existingIndex > -1) {
                acc[existingIndex].spend += spend;
                acc[existingIndex].clicks += clicks;
                acc[existingIndex].impressions += impressions;
                acc[existingIndex].meta_revenue += metaRevenue;
                acc[existingIndex].results += results;
            } else {
                acc.push({
                    date,
                    spend,
                    clicks,
                    impressions,
                    meta_revenue: metaRevenue,
                    results
                });
            }
            return acc;
        }, []);

        return dailyData.map((d: any) => {
            const manualEntry = manualSales.find((s: any) => s.date === d.date);
            const totalRevenue = manualEntry ? Number(manualEntry.revenue) : d.meta_revenue;
            const totalSales = manualEntry ? Number(manualEntry.sales_count || 0) : d.results || 0;

            return {
                ...d,
                roas: d.spend > 0 ? totalRevenue / d.spend : 0,
                revenue: totalRevenue,
                results: totalSales
            };
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
        console.error("Error fetching daily performance:", error);
        return [];
    }
}
