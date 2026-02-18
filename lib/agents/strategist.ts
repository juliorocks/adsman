
import { decrypt } from "@/lib/security/vault";
import { getInsights, getAdSets } from "@/lib/meta/api";
import { getIntegration } from "../data/settings";
import { DashboardMetrics } from "../data/metrics";
import { getAgentVerdict } from "../ai/agents_brain";

export interface ScalingRecommendation {
    id: string;
    type: 'scale_up' | 'scale_down' | 'pause';
    targetName: string;
    targetId: string;
    currentBudget: number;
    suggestedBudget?: number;
    reason: string;
    impact: string;
    thought?: string;
}

export async function runScaleStrategy(metrics?: DashboardMetrics): Promise<ScalingRecommendation[]> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adSets = await getAdSets(integration.ad_account_id, accessToken);

        // Filter active adsets and limit to top 8 to avoid timeout
        const activeAdSets = adSets
            .filter((a: any) => a.status === 'ACTIVE')
            .slice(0, 8);

        const recommendationPromises = activeAdSets.map(async (adSet: any) => {
            try {
                const insights = await getInsights(adSet.id, accessToken, 'last_7d');
                if (!insights || insights.length === 0) return null;

                const data = insights[0];
                const currentBudget = parseFloat(adSet.daily_budget || adSet.lifetime_budget || 0) / 100;
                const spend = parseFloat(data.spend || 0);
                const clicks = parseInt(data.clicks || 0);
                const impressions = parseInt(data.impressions || 0);

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

                if (verdict && verdict.status !== 'OPTIMAL') {
                    return {
                        id: `ai_scale_${adSet.id}`,
                        type: (verdict.status === 'CRITICAL' ? 'pause' : 'scale_up') as any,
                        targetName: adSet.name,
                        targetId: adSet.id,
                        currentBudget,
                        suggestedBudget: verdict.status === 'WARNING' ? currentBudget * 1.2 : undefined,
                        reason: verdict.recommendation,
                        impact: verdict.status === 'WARNING' ? 'Expansão de ROAS' : 'Corte de Gastos Ineficientes',
                        thought: verdict.thought
                    } as ScalingRecommendation;
                }
                return null;
            } catch (err) {
                console.error(`Error analyzing adset ${adSet.id}:`, err);
                return null;
            }
        });

        const results = await Promise.all(recommendationPromises);
        return results.filter((r): r is ScalingRecommendation => r !== null);
    } catch (error) {
        console.error("Scale strategy core error:", error);
        return [];
    }
}
