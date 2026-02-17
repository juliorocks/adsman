
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
}

export interface AuditResult {
    score: number;
    status: 'good' | 'average' | 'poor';
    summary: string;
    recommendations: AIRecommendation[];
}

export async function runPerformanceAudit(metrics: DashboardMetrics, campaignName: string = "Geral"): Promise<AuditResult> {
    // 1. Initial heuristic check
    const cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0;
    const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;

    // 2. Call AI Brain for deeper analysis if API key is present
    const insights = await getAgentVerdict({
        campaignName,
        metrics,
        currentBudget: 0, // Not available here easily
        objective: "CONVERSIONS"
    });

    const aiVerdict = insights.find(v => v.agent === 'auditor');

    const recommendations: AIRecommendation[] = [];

    if (aiVerdict) {
        recommendations.push({
            id: 'ai_audit_' + Date.now(),
            type: aiVerdict.status === 'CRITICAL' ? 'critical' : 'optimization',
            title: 'Análise de Auditoria IA',
            description: aiVerdict.recommendation,
            actionLabel: 'Ver Insights Técnicos',
            impact: 'Otimização de Performance',
            thought: aiVerdict.thought
        });
    }

    // Fallback/Safety heuristic
    if (ctr < 0.5 && metrics.impressions > 5000) {
        recommendations.push({
            id: 'low_ctr_fallback',
            type: 'critical',
            title: 'CTR Crítico (Heurística)',
            description: 'Seu CTR está muito baixo, indicando falta de relevância no criativo.',
            actionLabel: 'Trocar Criativo',
            impact: 'Aumento de cliques'
        });
    }

    let score = 100;
    if (recommendations.some(r => r.type === 'critical')) score = 40;
    else if (recommendations.some(r => r.type === 'optimization')) score = 75;

    return {
        score,
        status: score > 80 ? 'good' : score > 50 ? 'average' : 'poor',
        summary: aiVerdict?.thought || "Auditoria concluída com base nos sinais da conta.",
        recommendations
    };
}
