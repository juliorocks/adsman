
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedCreatives {
    headlines: string[];
    primary_texts: string[];
    image_prompts: string[];
}

export async function generateCreativeIdeas(goal: string): Promise<GeneratedCreatives> {
    if (!process.env.OPENAI_API_KEY) {
        return {
            headlines: ["Oferta Imperdível", "Garanta o seu agora"],
            primary_texts: ["Confira nossa nova coleção exclusiva.", "Trabalhamos com o melhor para você."],
            image_prompts: ["A luxury retail store background with soft lighting"]
        };
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
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
        console.error("Creative generation error:", error);
        return {
            headlines: ["Promoção Especial"],
            primary_texts: ["Aproveite nossas condições por tempo limitado."],
            image_prompts: ["Product marketing photography"]
        };
    }
}
