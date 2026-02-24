
import OpenAI from "openai";
import { getOpenAIKey, getPollinationsKey } from "@/lib/data/settings";
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
  "image_prompts": ["A detailed English prompt for the AdsAI Creative Engine. Describe a highly converting, vibrant, commercial photography image related EXACTLY to the product/service in the context. CRITICAL: DO NOT PUT ANY TEXT, WORDS, OR LETTERS IN THE IMAGE! The visual should focus purely on lighting, mood, people, or objects."]
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
    try {
        console.log(`[creatives] Generating ${count} image variations via Creative Engine...`);

        // Limit prompt length to avoid 414/404 errors from long URLs
        const cleanPrompt = prompt.slice(0, 300).replace(/\n/g, ' ');
        const enhancedPrompt = `cinematic photography, ${cleanPrompt}`;
        const encodedPrompt = encodeURIComponent(enhancedPrompt);

        // Generate array of distinct images by passing different random seeds
        const urls = Array.from({ length: count }).map(() => {
            const seed = Math.floor(Math.random() * 999999);
            // Using 'flux' model for better compatibility/speed as realism might be stricter
            return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
        });

        // Simulate processing delay for UI experience
        await new Promise(resolve => setTimeout(resolve, 2000));

        return urls;
    } catch (error) {
        console.error("[creatives] generateCreativeImages error:", error);
        return [];
    }
}
