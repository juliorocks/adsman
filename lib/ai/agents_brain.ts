
import OpenAI from "openai";
import { DashboardMetrics } from "../data/metrics";

export interface AgentVerdict {
    agent: 'auditor' | 'strategist' | 'creative';
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    thought: string;
    action?: string;
    recommendation: string;
    impact?: string;
}

import { getOpenAIKey } from "../data/settings";

import { unstable_cache } from "next/cache";

// Wrapper for caching the expensive AI call
export const getAgentVerdict = async (context: {
    campaignName: string;
    metrics: any;
    currentBudget: number;
    objective: string;
}): Promise<AgentVerdict[]> => {
    // Create a unique key for cache based on metrics (rounded to avoid noise)
    const cacheKey = `agent-verdict-${context.campaignName}-${Math.round(context.metrics.spend)}-${Math.round(context.metrics.roas * 10)}`;

    return await unstable_cache(
        async () => {
            const userApiKey = await getOpenAIKey();

            if (!userApiKey) {
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

            const openai = new OpenAI({
                apiKey: userApiKey,
            });

            try {
                // Switched to gpt-4o-mini for significant cost reduction (approx 10x cheaper)
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `Você é o Cérebro de uma Colmeia de Agentes de Meta Ads.
                            Your task is to analyze the campaign context and generate verdicts for 3 agents:
                            1. AUDITOR: Focus on anomaly detection and technical health (CTR, High CPC). 
                               - If status is CRITICAL: Performance is so bad that the ad SHOULD BE PAUSED immediately. Recommendation MUST justify the PAUSE.
                               - If status is WARNING: Performance is sub-optimal but fixable. Recommendation must suggest a specific optimization (Copy, Audience, etc.).
                            2. STRATEGIST: Focus on ROI, Profitability, and Scaling (ROAS, CPA).
                               - If status is CRITICAL: Budget is being wasted without return. Suggest pausing or massive budget cut.
                               - If status is WARNING: Performance is okay but has room for scaling.
                            3. CREATIVE: Focus on creative fatigue and new copy angles.

                            JSON Structure:
                            {
                              "verdicts": [
                                {
                                  "agent": "auditor" | "strategist" | "creative",
                                  "status": "OPTIMAL" | "WARNING" | "CRITICAL",
                                  "impact": "e.g., ROAS, CTR, Cost per Lead",
                                  "thought": "Direct thought behind the verdict",
                                  "recommendation": "CLEAR ACTIONABLE ADVICE"
                                }
                              ]
                            }

                            CRITICAL action MUST correspond to a STOP/PAUSE action.
                            WARNING action MUST correspond to an OPTIMIZE/FIX action.`
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
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0].message.content;
                const data = JSON.parse(content || "{}");

                // Normalize results to always return an array
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
        },
        [cacheKey],
        {
            revalidate: 3600, // Cache for 1 hour to prevent re-running on every refresh
            tags: ['agent-verdicts']
        }
    )();
}
