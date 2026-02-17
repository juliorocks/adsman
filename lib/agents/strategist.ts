
import { decrypt } from "@/lib/security/vault";
import { getInsights, getAdSets, getCampaigns } from "@/lib/meta/api";
import { getIntegration } from "../data/settings";
import { DashboardMetrics } from "../data/metrics";

export interface ScalingRecommendation {
    id: string;
    type: 'scale_up' | 'scale_down' | 'pause';
    targetName: string;
    targetId: string;
    currentBudget: number;
    suggestedBudget?: number;
    reason: string;
    impact: string;
}

export async function runScaleStrategy(): Promise<ScalingRecommendation[]> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const adSets = await getAdSets(integration.ad_account_id, accessToken);
        const recommendations: ScalingRecommendation[] = [];

        for (const adSet of adSets) {
            if (adSet.status !== 'ACTIVE') continue;

            const insights = await getInsights(adSet.id, accessToken, 'last_7d');
            if (insights.length === 0) continue;

            const data = insights[0];
            const spend = parseFloat(data.spend || 0);
            const roas = data.purchase_roas ? parseFloat(data.purchase_roas[0]?.value || 0) : 0;
            const currentBudget = parseFloat(adSet.daily_budget || adSet.lifetime_budget || 0) / 100;

            // Scale UP Logic: High ROAS
            if (roas > 4.0 && spend > 50) {
                recommendations.push({
                    id: `scale_up_${adSet.id}`,
                    type: 'scale_up',
                    targetName: adSet.name,
                    targetId: adSet.id,
                    currentBudget,
                    suggestedBudget: currentBudget * 1.2,
                    reason: `ROAS excelente de ${roas.toFixed(2)}x nos últimos 7 dias.`,
                    impact: 'Aumento estimado de 15-20% em conversões'
                });
            }

            // Scale DOWN / PAUSE Logic: High Spend, No results
            if (spend > 100 && roas < 1.0) {
                recommendations.push({
                    id: `pause_${adSet.id}`,
                    type: 'pause',
                    targetName: adSet.name,
                    targetId: adSet.id,
                    currentBudget,
                    reason: `Gasto elevado (R$ ${spend}) sem retorno satisfatório (ROAS ${roas.toFixed(2)}).`,
                    impact: 'Economia imediata de orçamento'
                });
            }
        }

        return recommendations;
    } catch (error) {
        console.error("Scale strategy error:", error);
        return [];
    }
}
