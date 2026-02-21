
import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/data/settings";

export interface GeneratedCreatives {
    headlines: string[];
    primary_texts: string[];
    image_prompts: string[];
}

const FALLBACK_CREATIVES: GeneratedCreatives = {
    headlines: ["Oferta Imperdível", "Garanta o seu agora", "Aproveite hoje"],
    primary_texts: [
        "Confira nossa nova coleção exclusiva.",
        "Trabalhamos com o melhor para você."
    ],
    image_prompts: ["A luxury retail store background with soft lighting"]
};

export async function generateCreativeIdeas(goal: string = "Vendas gerais"): Promise<GeneratedCreatives> {
    // Try user-saved key from DB first, then fall back to env var
    let apiKey: string | null = null;

    try {
        apiKey = await getOpenAIKey();
    } catch (e) {
        console.warn("[creatives] Could not fetch user OpenAI key:", e);
    }

    // Fall back to environment variable if no user key
    if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY || null;
    }

    if (!apiKey) {
        console.warn("[creatives] No OpenAI API key available. Returning fallback creatives.");
        return FALLBACK_CREATIVES;
    }

    try {
        // Lazy instantiation — only when we have a key
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Você é um copywriter de performance especializado em Meta Ads. 
                    Com base no objetivo do usuário, gere:
                    - 3 títulos chamativos (curtos).
                    - 2 textos principais (descrições longas).
                    - 1 prompt para geração de imagem (DALL-E) em inglês que descreva o visual ideal para o anúncio.

                    Responda em formato JSON com as chaves: headlines, primary_texts, image_prompts.`
                },
                {
                    role: "user",
                    content: `Objetivo da campanha: "${goal}"`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content || "{}") as GeneratedCreatives;
    } catch (error) {
        console.error("[creatives] generateCreativeIdeas error:", error);
        return FALLBACK_CREATIVES;
    }
}
