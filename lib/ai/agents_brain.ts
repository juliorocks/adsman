
import OpenAI from "openai";
import { DashboardMetrics } from "../data/metrics";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        return [{
            agent: 'strategist',
            status: 'OPTIMAL',
            thought: 'OpenAI API key missing. Running in simulation mode.',
            recommendation: 'Configure a API Key para análise real.'
        }];
    }

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
