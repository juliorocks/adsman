
import { DashboardMetrics } from "../data/metrics";

export interface AIRecommendation {
    id: string;
    type: 'critical' | 'optimization' | 'opportunity';
    title: string;
    description: string;
    actionLabel: string;
    impact: string;
}

export interface AuditResult {
    score: number;
    status: 'good' | 'average' | 'poor';
    summary: string;
    recommendations: AIRecommendation[];
}

export async function runPerformanceAudit(metrics: DashboardMetrics): Promise<AuditResult> {
    const recommendations: AIRecommendation[] = [];
    let score = 85;

    // Logic for CPA (Total Spend / Clicks as proxy for now)
    const cpc = metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0;

    if (cpc > 5) {
        score -= 20;
        recommendations.push({
            id: 'high_cpc',
            type: 'critical',
            title: 'CPC Elevado Detectado',
            description: `Seu custo por clique atual (R$ ${cpc.toFixed(2)}) está 40% acima da média do seu setor. Recomenda-se revisar o criativo ou a segmentação.`,
            actionLabel: 'Revisar Criativos',
            impact: 'Redução de ~15% no custo total'
        });
    }

    if (metrics.roas < 3) {
        score -= 15;
        recommendations.push({
            id: 'low_roas',
            type: 'optimization',
            title: 'ROAS Abaixo da Meta',
            description: 'O retorno sobre investimento estábaixo. Considere pausar os conjuntos de anúncios com menor conversão.',
            actionLabel: 'Ver Detalhes do ROAS',
            impact: 'Aumento de 0.5x no ROAS'
        });
    }

    if (metrics.impressions > 10000 && metrics.clicks < 50) {
        score -= 25;
        recommendations.push({
            id: 'low_ctr',
            type: 'critical',
            title: 'CTR Muito Baixo',
            description: 'Muitas pessoas estão vendo seus anúncios, mas poucas estão clicando. Isso indica que a oferta ou a imagem não está atraente.',
            actionLabel: 'Trocar Imagem',
            impact: 'Aumento real em cliques'
        });
    }

    // Opportunity
    if (metrics.roas > 5) {
        recommendations.push({
            id: 'scale_opportunity',
            type: 'opportunity',
            title: 'Oportunidade de Escala',
            description: 'Esta conta está performando excepcionalmente bem. Sugerimos aumentar o orçamento diário em 20% para maximizar o alcance.',
            actionLabel: 'Aumentar Orçamento',
            impact: 'Escala de faturamento'
        });
    }

    let status: 'good' | 'average' | 'poor' = 'good';
    if (score < 50) status = 'poor';
    else if (score < 80) status = 'average';

    const summaries = {
        good: 'Sua conta está operando com ótima eficiência. Pequenos ajustes podem trazer ganhos marginais.',
        average: 'Existem pontos de atenção que estão drenando seu orçamento. Recomendamos agir nas sugestões abaixo.',
        poor: 'Alerta crítico: sua performance está muito abaixo do esperado. É necessário uma revisão estrutural imediata.'
    };

    return {
        score: Math.max(0, score),
        status,
        summary: summaries[status],
        recommendations: recommendations.length > 0 ? recommendations : [
            {
                id: 'all_good',
                type: 'opportunity',
                title: 'Tudo em ordem!',
                description: 'Não detectamos anomalias críticas no momento. Continue monitorando.',
                actionLabel: 'Ver Relatório Completo',
                impact: 'Estabilidade'
            }
        ]
    };
}
