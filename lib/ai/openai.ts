
import OpenAI from "openai";

export interface AdTargeting {
    interests: string[];
    geo: string[];
    genders: number[]; // 1=Male, 2=Female
    age_min: number;
    age_max: number;
    optimization_goal: string;
    headline: string;
    primary_text: string;
    link_url: string;
}

export async function parseTargetingFromGoal(goal: string): Promise<AdTargeting> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("[openai] OPENAI_API_KEY not set. Using fallback targeting.");
        return getDefaultTargeting(goal);
    }

    try {
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Você é um especialista em Meta Ads. Sua tarefa é extrair parâmetros de segmentação E criar textos de anúncio a partir de um objetivo de campanha.
                    Extraia:
                    - interests: Lista de interesses em inglês (conforme Meta Graph API).
                    - geo: Cidades ou Estados.
                    - genders: [1] para Homens, [2] para Mulheres, [1, 2] para ambos.
                    - age_min: Idade mínima (padrão 18).
                    - age_max: Idade máxima (padrão 65).
                    - optimization_goal: Um dos [REACH, IMPRESSIONS, LINK_CLICKS, POST_ENGAGEMENT].
                    - headline: Título curto e chamativo para o anúncio (máx 40 caracteres).
                    - primary_text: Texto principal do anúncio, persuasivo e direto (máx 125 caracteres).
                    - link_url: Se mencionado no objetivo, extraia a URL. Caso contrário, use "https://www.facebook.com/".

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

        const parsed = JSON.parse(content);
        return {
            interests: parsed.interests || ["Online shopping"],
            geo: parsed.geo || ["BR"],
            genders: parsed.genders || [1, 2],
            age_min: parsed.age_min || 18,
            age_max: parsed.age_max || 65,
            optimization_goal: parsed.optimization_goal || "LINK_CLICKS",
            headline: parsed.headline || goal.substring(0, 40),
            primary_text: parsed.primary_text || goal.substring(0, 125),
            link_url: parsed.link_url || "https://www.facebook.com/",
        };
    } catch (error) {
        console.error("[openai] parseTargetingFromGoal error:", error);
        return getDefaultTargeting(goal);
    }
}

function getDefaultTargeting(goal: string = ""): AdTargeting {
    return {
        interests: ["Online shopping"],
        geo: ["BR"],
        genders: [1, 2],
        age_min: 18,
        age_max: 65,
        optimization_goal: "LINK_CLICKS",
        headline: goal.substring(0, 40) || "Confira nossa oferta!",
        primary_text: goal.substring(0, 125) || "Descubra algo novo. Acesse agora!",
        link_url: "https://www.facebook.com/",
    };
}
