
import { decrypt } from "@/lib/security/vault";
import { getInsights, getAdSets } from "@/lib/meta/api";
import { getIntegration } from "../data/settings";
import { DashboardMetrics } from "../data/metrics";
import { getAgentVerdict } from "../ai/agents_brain";
import { cache } from 'react';

export interface ScalingRecommendation {
    id: string;
    type: 'scale_up' | 'scale_down' | 'pause';
    targetName: string;
    targetId: string;
    currentBudget: number;
    suggestedBudget?: number;
    reason: string;
    impact: string;
    actionLabel: string;
    thought?: string;
}

export const runScaleStrategy = cache(async function (metrics?: DashboardMetrics): Promise<ScalingRecommendation[]> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adSets = await getAdSets(integration.ad_account_id, accessToken);

        // Filter active or recently paused adsets and limit to top 10
        const activeAdSets = adSets
            .filter((a: any) => a.status === 'ACTIVE' || a.status === 'PAUSED')
            .slice(0, 10);

        console.log(`[Strategist] Found ${adSets.length} total adsets, analyzing ${activeAdSets.length} active/paused.`);

        // Sequential analysis to support low-concurrency providers
        const recommendations: ScalingRecommendation[] = [];
        for (const adSet of activeAdSets) {
            try {
                const insights = await getInsights(adSet.id, accessToken, 'last_30d');
                const data = insights && insights.length > 0 ? insights[0] : { spend: 0, clicks: 0, impressions: 0 };

                const currentBudget = parseFloat(adSet.daily_budget || adSet.lifetime_budget || 0) / 100;
                const spend = parseFloat(data.spend || 0);
                const clicks = parseInt(data.clicks || 0);
                const impressions = parseInt(data.impressions || 0);

                console.log(`[Strategist] Analyzing AdSet: ${adSet.name} (Budget: ${currentBudget}, Spend: ${spend})`);

                // Call AI Brain for scaling verdict
                const brainVerdicts = await getAgentVerdict({
                    campaignName: adSet.name,
                    metrics: {
                        spend,
                        clicks,
                        roas: data.purchase_roas ? parseFloat(data.purchase_roas[0]?.value || 0) : 0,
                        ctr: impressions > 0 ? (clicks / impressions * 100) : 0
                    },
                    currentBudget,
                    objective: "SALES"
                });

                const verdict = brainVerdicts.find(v => v.agent === 'strategist');
                console.log(`[Strategist] Verdict for ${adSet.name}: ${verdict?.status || 'NONE'}`);

                if (verdict) {
                    if (verdict.status !== 'OPTIMAL' || recommendations.length < 2) {
                        recommendations.push({
                            id: `ai_scale_${adSet.id}_${Date.now()}`,
                            type: (verdict.status === 'CRITICAL' ? 'pause' : 'scale_up') as any,
                            targetName: adSet.name,
                            targetId: adSet.id,
                            currentBudget,
                            suggestedBudget: verdict.status === 'WARNING' ? currentBudget * 1.2 : undefined,
                            actionLabel: verdict.status === 'CRITICAL' ? 'Pausar Conjunto' : 'Ajustar Orçamento',
                            reason: verdict.recommendation,
                            impact: verdict.status === 'WARNING' ? 'Expansão de ROAS' : 'Otimização de Verba',
                            thought: verdict.thought
                        });
                    }
                }
            } catch (err) {
                console.error(`[Strategist] Error analyzing adset ${adSet.id}:`, err);
            }
        }

        console.log(`[Strategist] Final recommendation count: ${recommendations.length}`);
        return recommendations;
    } catch (error) {
        console.error("Scale strategy core error:", error);
        return [];
    }
});
