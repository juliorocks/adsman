
import { DashboardMetrics } from "../data/metrics";
import { getAgentVerdict } from "../ai/agents_brain";

export interface AIRecommendation {
    id: string;
    type: 'critical' | 'optimization' | 'opportunity';
    title: string;
    description: string;
    actionLabel: string;
    impact: string;
    thought?: string;
    adImage?: string;
    campaignId?: string;
}

export interface AuditResult {
    score: number;
    status: 'good' | 'average' | 'poor';
    summary: string;
    recommendations: AIRecommendation[];
}

import { decrypt } from "@/lib/security/vault";
import { getAds, getInsights } from "../meta/api";
import { getIntegration } from "../data/settings";

export async function runPerformanceAudit(metrics: DashboardMetrics, campaignName: string = "Geral"): Promise<AuditResult> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return { score: 100, status: 'good', summary: "Sem dados para análise", recommendations: [] };
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const ads = await getAds(integration.ad_account_id, accessToken);

        // Filter active ads and get their IDs
        const activeAds = ads.filter((a: any) => a.status === 'ACTIVE');
        const adIds = activeAds.map((a: any) => a.id);

        if (adIds.length === 0) {
            return { score: 100, status: 'good', summary: "Nenhum anúncio ativo encontrado.", recommendations: [] };
        }

        // Fetch insights for these ads to find the biggest spenders
        const adInsights = await getInsights(adIds, accessToken, 'last_7d');

        // Match insights with ads and sort by spend descendant
        const adsWithPerformance = activeAds.map((ad: any) => {
            const insight = adInsights.find((i: any) => i.ad_id === ad.id);
            return {
                ...ad,
                insight: insight || { spend: 0, clicks: 0, impressions: 0, purchase_roas: [{ value: 0 }] }
            };
        }).sort((a: any, b: any) => parseFloat(b.insight.spend) - parseFloat(a.insight.spend));

        const recommendations: AIRecommendation[] = [];

        // Analyze TOP 12 most expensive ads
        for (const ad of adsWithPerformance.slice(0, 12)) {
            const spend = parseFloat(ad.insight.spend || 0);
            const clicks = parseInt(ad.insight.clicks || 0);
            const impressions = parseInt(ad.insight.impressions || 0);
            const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
            const roas = ad.insight.purchase_roas ? parseFloat(ad.insight.purchase_roas[0]?.value || 0) : 0;

            // Problematic: High Spend and low CTR/ROAS
            if (spend > 15 && (ctr < 1.0 || (spend > 80 && roas < 1.3))) {
                // Potential problematic ad
                const brainVerdicts = await getAgentVerdict({
                    campaignName: ad.name,
                    metrics: { spend, clicks, roas, ctr },
                    currentBudget: 0,
                    objective: "SALES"
                });

                const verdict = brainVerdicts.find(v => v.agent === 'auditor');

                if (verdict && verdict.status !== 'OPTIMAL') {
                    recommendations.push({
                        id: `ai_ad_audit_${ad.id}`,
                        type: verdict.status === 'CRITICAL' ? 'critical' : 'optimization',
                        title: `Anúncio: ${ad.name}`,
                        description: verdict.recommendation,
                        actionLabel: verdict.status === 'CRITICAL' ? 'Pausar Anúncio' : 'Otimizar Criativo',
                        impact: 'Eficácia Criativa',
                        thought: verdict.thought,
                        adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                        campaignId: ad.campaign_id
                    });
                }
            }
        }

        let score = 100;
        if (recommendations.some(r => r.type === 'critical')) score = 55;
        else if (recommendations.some(r => r.type === 'optimization')) score = 82;

        return {
            score,
            status: score > 80 ? 'good' : score > 50 ? 'average' : 'poor',
            summary: recommendations.length > 0
                ? `Identificamos ${recommendations.length} anúncios que precisam de atenção imediata para melhorar a performance.`
                : "Seus anúncios estão operando dentro dos parâmetros de performance esperados.",
            recommendations
        };
    } catch (error) {
        console.error("Auditor error:", error);
        return { score: 100, status: 'good', summary: "Erro técnico na auditoria", recommendations: [] };
    }
}
