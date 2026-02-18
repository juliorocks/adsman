
import { DashboardMetrics } from "../data/metrics";
import { getAIClient } from "./client";

export interface AgentVerdict {
    agent: 'auditor' | 'strategist' | 'creative';
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    thought: string;
    action?: string;
    recommendation: string;
    impact?: string;
}

export async function getAgentVerdict(context: {
    campaignName: string;
    metrics: any;
    currentBudget: number;
    objective: string;
}): Promise<AgentVerdict[]> {
    const ai = await getAIClient();

    if (!ai) {
        return [
            {
                agent: 'auditor',
                status: 'WARNING',
                thought: 'Simulação: Analisando padrões de CTR e CPC.',
                recommendation: 'Detectamos que 2 anúncios estão com CTR abaixo da média do setor (0.8%). Considere revisar a headline.',
                impact: 'CTR'
            },
            {
                agent: 'strategist',
                status: 'WARNING',
                thought: 'Simulação: Avaliando ROAS e teto de gastos.',
                recommendation: 'Sua campanha principal tem ROAS de 3.5x. Recomendamos escalar o orçamento em 15% para aproveitar o momentum.',
                impact: 'ROAS'
            },
            {
                agent: 'creative',
                status: 'OPTIMAL',
                thought: 'Simulação: Fadiga de criativos está em níveis baixos.',
                recommendation: 'Seus criativos atuais ainda performam bem. Continue o monitoramento.',
                impact: 'CPA'
            }
        ];
    }

    try {
        const response = await ai.client.chat.completions.create({
            model: ai.model,
            messages: [
                {
                    role: "system",
                    content: `Você é o Cérebro de uma Colmeia de Agentes de Meta Ads.
                    Sua tarefa é analisar o contexto da campanha e gerar vereditos para 3 agentes:
                    1. AUDITOR: Foco em detecção de anomalias e saúde técnica (CTR, CPC Alto). 
                       - Se status for CRITICAL: A performance está tão ruim que o anúncio DEVE SER PAUSADO imediatamente. A recomendação DEVE justificar o PAUSE.
                       - Se status for WARNING: Performance sub-otimizada mas corrigível. Sugira uma otimização específica.
                    2. STRATEGIST: Foco em ROI, Lucratividade e Escala (ROAS, CPA).
                       - Se status for CRITICAL: Orçamento está sendo desperdiçado sem retorno. Sugira pause ou corte massivo.
                       - Se status for WARNING: Performance está ok mas tem espaço para escala.
                    3. CREATIVE: Foco em fadiga criativa e novos ângulos de copy.

                    Estrutura JSON esperada:
                    {
                      "verdicts": [
                        {
                          "agent": "auditor" | "strategist" | "creative",
                          "status": "OPTIMAL" | "WARNING" | "CRITICAL",
                          "impact": "ex: ROAS, CTR, Custo por Lead",
                          "thought": "Raciocínio direto por trás do veredito",
                          "recommendation": "CONSELHO CLARO E ACIONÁVEL"
                        }
                      ]
                    }

                    AÇÃO CRITICAL DEVE corresponder a um STOP/PAUSE.
                    AÇÃO WARNING DEVE corresponder a uma OTIMIZAÇÃO/AJUSTE.`
                },
                {
                    role: "user",
                    content: `Dados da Campanha "${context.campaignName}":
                    - Objetivo: ${context.objective}
                    - Orçamento Atual: R$ ${context.currentBudget}
                    - Gasto: R$ ${context.metrics.spend}
                    - Cliques: ${context.metrics.clicks}
                    - ROAS: ${context.metrics.roas}x
                    - CTR: ${context.metrics.ctr}%`
                }
            ],
            response_format: ai.isModal ? undefined : { type: "json_object" }
        });

        let content = response.choices[0].message.content || "{}";

        // Modal GLM-5 fallback for non-json_object mode
        if (ai.isModal && content.includes("```json")) {
            content = content.split("```json")[1].split("```")[0];
        } else if (ai.isModal && content.includes("```")) {
            content = content.split("```")[1].split("```")[0];
        }

        const data = JSON.parse(content || "{}");

        let verdicts: AgentVerdict[] = [];
        if (Array.isArray(data.verdicts)) {
            verdicts = data.verdicts;
        } else if (Array.isArray(data.agents)) {
            verdicts = data.agents;
        } else if (typeof data === 'object' && data !== null) {
            const values = Object.values(data);
            if (Array.isArray(values[0])) {
                verdicts = values[0];
            } else if (typeof values[0] === 'object') {
                verdicts = values as any[];
            }
        }

        return Array.isArray(verdicts) ? verdicts : [];
    } catch (error) {
        console.error("Agent brain error:", error);
        return [];
    }
}
