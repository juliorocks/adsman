
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
        const response = await ai.acquireLock(() => ai.client.chat.completions.create({
            model: ai.model,
            messages: [
                {
                    role: "system",
                    content: `Você é um analista de tráfego especialista em Meta Ads. 
                    Responda RIGOROSAMENTE apenas em formato JSON.
                    Não inclua explicações fora do JSON.
                    
                    Estrutura obrigatória:
                    {
                      "verdicts": [
                        {
                          "agent": "auditor" | "strategist" | "creative",
                          "status": "OPTIMAL" | "WARNING" | "CRITICAL",
                          "impact": "Métrica principal atingida",
                          "thought": "O que você observou nos dados",
                          "recommendation": "Ação clara e direta (mesmo para status OPTIMAL, sugira como manter ou melhorar ligeiramente)"
                        }
                      ]
                    }`
                },
                {
                    role: "user",
                    content: `Analise estes dados e gere os 3 vereditos:
                    Campanha: "${context.campaignName}"
                    Objetivo: ${context.objective}
                    Metrics: Spend=${context.metrics.spend}, Clicks=${context.metrics.clicks}, ROAS=${context.metrics.roas}, CTR=${context.metrics.ctr}%`
                }
            ],
            temperature: 0.2,
            response_format: ai.isModal ? undefined : { type: "json_object" }
        }));

        let content = response.choices[0].message.content || "{}";

        if (ai.isModal) {
            console.log("GLM-5 Raw Output:", content);
            // Powerful cleanup for LLMs that talk too much
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
        }

        const data = JSON.parse(content);
        console.log(`[Brain] Parsed response keys: ${Object.keys(data).join(', ')}`);

        let verdicts: AgentVerdict[] = [];
        // Flatten and normalize various possible structures
        const potentialArray = data.verdicts || data.agents || (Array.isArray(data) ? data : Object.values(data).find(v => Array.isArray(v)));

        if (Array.isArray(potentialArray)) {
            verdicts = potentialArray;
        } else if (typeof data === 'object' && data !== null) {
            // Case where it returned a single verdict object instead of array
            if (data.agent || data.recommendation) {
                verdicts = [data as any];
            }
        }

        const normalized = verdicts.map(v => ({
            agent: String(v.agent || '').toLowerCase().trim() as "auditor" | "strategist" | "creative",
            status: String(v.status || 'OPTIMAL').toUpperCase().trim() as "OPTIMAL" | "WARNING" | "CRITICAL",
            thought: String(v.thought || ''),
            recommendation: String(v.recommendation || 'Continuar monitorando métricas.'),
            impact: String(v.impact || '')
        })).filter(v => ['auditor', 'strategist', 'creative'].includes(v.agent));

        console.log(`[Brain] Normalized verdicts count: ${normalized.length}`);
        return normalized;

    } catch (error) {
        console.error("AI Brain Error:", error);
        return [];
    }
}
