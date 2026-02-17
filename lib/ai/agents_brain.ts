
import OpenAI from "openai";
import { DashboardMetrics } from "../data/metrics";

export interface AgentVerdict {
    agent: 'auditor' | 'strategist' | 'creative';
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    thought: string;
    action?: string;
    recommendation: string;
}

export async function getAgentVerdict(context: {
    campaignName: string;
    metrics: any;
    currentBudget: number;
    objective: string;
}): Promise<AgentVerdict[]> {
    if (!process.env.OPENAI_API_KEY) {
        return [
            {
                agent: 'auditor',
                status: 'WARNING',
                thought: 'Simulação: Analisando padrões de CTR e CPC.',
                recommendation: 'Detectamos que 2 anúncios estão com CTR abaixo da média do setor (0.8%). Considere revisar a headline.'
            },
            {
                agent: 'strategist',
                status: 'WARNING',
                thought: 'Simulação: Avaliando ROAS e teto de gastos.',
                recommendation: 'Sua campanha principal tem ROAS de 3.5x. Recomendamos escalar o orçamento em 15% para aproveitar o momentum.'
            },
            {
                agent: 'creative',
                status: 'OPTIMAL',
                thought: 'Simulação: Fadiga de criativos está em níveis baixos.',
                recommendation: 'Seus criativos atuais ainda performam bem. Continue o monitoramento.'
            }
        ];
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `Você é o Cérebro de uma Colmeia de Agentes de Meta Ads.
                    Sua tarefa é analisar o contexto da campanha e gerar vereditos para 3 agentes:
                    1. AUDITOR: Focado em anomalias e saúde técnica (CTR, CPC alto).
                    2. STRATEGIST: Focado em ROI, escala e orçamento (ROAS, CPA).
                    3. CREATIVE: Focado em fadiga de criativo e novas ideias.

                    Responda APENAS em JSON no formato:
                    [{ "agent": "auditor", "status": "OPTIMAL|WARNING|CRITICAL", "thought": "...", "recommendation": "..." }, ...]`
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
        return data.verdicts || data.agents || Object.values(data)[0] as AgentVerdict[];
    } catch (error) {
        console.error("Agent brain error:", error);
        return [];
    }
}
