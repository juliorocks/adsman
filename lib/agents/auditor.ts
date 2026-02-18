
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

        // Analyze TOP 5 ads to maintain high performance
        const analysisPromises = adsWithPerformance.slice(0, 5).map(async (ad: any) => {
            const spend = parseFloat(ad.insight.spend || 0);
            const clicks = parseInt(ad.insight.clicks || 0);
            const impressions = parseInt(ad.insight.impressions || 0);
            const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
            const roas = ad.insight.purchase_roas ? parseFloat(ad.insight.purchase_roas[0]?.value || 0) : 0;

            // Only analyze using AI if there's a performance signal or decent spend
            if (spend > 10 || ctr < 1.0) {
                try {
                    const brainVerdicts = await getAgentVerdict({
                        campaignName: ad.name,
                        metrics: { spend, clicks, roas, ctr },
                        currentBudget: 0,
                        objective: "SALES"
                    });

                    const verdict = brainVerdicts.find(v => v.agent === 'auditor');

                    if (verdict && verdict.status !== 'OPTIMAL') {
                        return {
                            id: `ai_ad_audit_${ad.id}`,
                            type: (verdict.status === 'CRITICAL' ? 'critical' : 'optimization') as any,
                            title: `Anúncio: ${ad.name}`,
                            description: verdict.recommendation,
                            actionLabel: verdict.status === 'CRITICAL' ? 'Pausar Agora' : 'Revisar Criativo',
                            impact: verdict.impact || 'Performance',
                            thought: verdict.thought,
                            adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                            campaignId: ad.campaign_id
                        } as AIRecommendation;
                    }
                } catch (e) {
                    console.error("AI Analysis failed for ad", ad.id, e);
                }
            }
            return null;
        });

        const results = await Promise.all(analysisPromises);
        const recommendations = results.filter((r): r is AIRecommendation => r !== null);

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
