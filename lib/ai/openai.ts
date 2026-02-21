
import OpenAI from "openai";

export interface AdTargeting {
    interests: string[];
    geo: string[];
    genders: number[]; // 1=Male, 2=Female
    age_min: number;
    age_max: number;
    optimization_goal: string;
}

export async function parseTargetingFromGoal(goal: string): Promise<AdTargeting> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("[openai] OPENAI_API_KEY not set. Using fallback targeting.");
        return getDefaultTargeting();
    }

    try {
        // Lazy instantiation — only create OpenAI client when we have a key
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Você é um especialista em Meta Ads. Sua tarefa é extrair parâmetros de segmentação em formato JSON a partir de um objetivo de campanha.
                    Extraia:
                    - interests: Lista de interesses em inglês (conforme Meta Graph API).
                    - geo: Cidades ou Estados.
                    - genders: [1] para Homens, [2] para Mulheres, [1, 2] para ambos.
                    - age_min: Idade mínima (padrão 18).
                    - age_max: Idade máxima (padrão 65).
                    - optimization_goal: Um dos [REACH, IMPRESSIONS, LINK_CLICKS, POST_ENGAGEMENT, OFFSITE_CONVERSIONS].

                    Responda APENAS o JSON puro.`
                },
                {
                    role: "user",
                    content: `Objetivo: "${goal}"`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("Empty response from AI");

        return JSON.parse(content) as AdTargeting;
    } catch (error) {
        console.error("[openai] parseTargetingFromGoal error:", error);
        return getDefaultTargeting();
    }
}

function getDefaultTargeting(): AdTargeting {
    return {
        interests: ["Online shopping"],
        geo: ["BR"],
        genders: [1, 2],
        age_min: 18,
        age_max: 65,
        optimization_goal: "REACH"
    };
}
