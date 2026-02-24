
import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

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

export async function generateCreativeIdeas(goal: string = "Vendas gerais", knowledgeBaseId?: string): Promise<GeneratedCreatives> {
    let apiKey: string | null = null;
    let contextText = "";

    try {
        apiKey = await getOpenAIKey();
    } catch (e) {
        console.warn("[creatives] Could not fetch user OpenAI key:", e);
    }

    // Try fetching Knowledge Base Context if provided
    if (knowledgeBaseId) {
        try {
            const supabase = await createClient();

            // 1. Get Static Content
            const { data: kb } = await supabase.from("knowledge_bases").select("content").eq("id", knowledgeBaseId).single();
            if (kb?.content) {
                contextText += `\n\nREGRAS FIXAS DO NEGÓCIO:\n${kb.content}`;
            }

            // 2. We can try pulling the first few chunks of scraped URL/Drive data (simplistic RAG)
            const { data: chunks } = await supabase.from("knowledge_documents")
                .select("content")
                .eq("knowledge_base_id", knowledgeBaseId)
                .limit(5); // Bring up to 5 chunks of synced data for context

            if (chunks && chunks.length > 0) {
                contextText += `\n\nCONTEXTO EXTRAÍDO DA WEB/PDF (RAG):\n`;
                contextText += chunks.map((c: any) => c.content).join("\n---\n");
            }
        } catch (e) {
            console.error("Failed to load RAG context:", e);
        }
    }

    if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY || null;
    }

    if (!apiKey) {
        console.warn("[creatives] No OpenAI API key available. Returning fallback creatives.");
        return FALLBACK_CREATIVES;
    }

    try {
        const openai = new OpenAI({ apiKey });

        let systemPrompt = `Você é um copywriter de performance especializado em Meta Ads. 
Com base no objetivo do usuário, gere sugestões de copy.

Retorne EXATAMENTE o seguinte formato JSON:
{
  "headlines": ["titulo 1", "titulo 2", "titulo 3"],
  "primary_texts": ["texto principal longo 1", "texto principal longo 2"],
  "image_prompts": ["A detailed English prompt for DALL-E 3. Describe a highly converting, vibrant, commercial photography image related EXACTLY to the product/service in the context. CRITICAL: DO NOT PUT ANY TEXT, WORDS, OR LETTERS IN THE IMAGE! DALL-E struggles with Portuguese text. Focus purely on lighting, mood, people, or objects."]
}`;

        if (contextText) {
            systemPrompt += `\n\nAqui está o CONTEXTO DO NEGÓCIO do seu cliente. Siga os tons, regras e dores no material abaixo para as copies. PARA A IMAGEM, crie um prompt visual que mostre O PRODUTO/SERVIÇO REAL descrito aqui (ex: se for Clube de Leitura, mostre livros, pessoas lendo, ambiente). NUNCA coloque textos na imagem!\n${contextText}`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Objetivo da campanha que preciso criar agora: "${goal}"`
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

export async function generateCreativeImages(prompt: string, count: number = 4): Promise<string[]> {
    let apiKey = await getOpenAIKey();
    if (!apiKey) apiKey = process.env.OPENAI_API_KEY || null;

    if (!apiKey) {
        console.warn("[creatives] No OpenAI API key for DALL-E");
        return [];
    }

    try {
        console.log("[creatives] Generating multiple image variations...");
        const openai = new OpenAI({ apiKey });

        // Use parallel DALL-E 3 requests to fake Nano Banana and provide fast variations
        const promises = Array.from({ length: count }).map(() =>
            openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            }).then(res => res.data?.[0]?.url).catch(e => {
                console.error("Image variation error:", e);
                return null;
            })
        );

        const results = await Promise.all(promises);
        return results.filter((url): url is string => !!url);
    } catch (error) {
        console.error("[creatives] generateCreativeImages error:", error);
        return [];
    }
}
