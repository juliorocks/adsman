import { decrypt } from "@/lib/security/vault";
import { getAds } from "@/lib/meta/api";
import { getIntegration, getOpenAIKey } from "../data/settings";
import OpenAI from "openai";

export interface CreativeVariation {
    id: string;
    targetAdId: string;
    targetAdName: string;
    adImage?: string;
    headline: string;
    bodyText: string;
    cta: string;
    angle: string;
}

export async function generateCreativeIdeas(): Promise<CreativeVariation[]> {
    const integration = await getIntegration();
    const userApiKey = await getOpenAIKey();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const ads = await getAds(integration.ad_account_id, accessToken);
        let activeAds = ads.filter((a: any) => a.status === 'ACTIVE').slice(0, 5);

        // If no active ads, take top 5 ads regardless of status
        if (activeAds.length === 0) {
            activeAds = ads.slice(0, 5);
        }
        console.log(`[CreativeAgent] Found ${activeAds.length} active ads for analysis.`);

        if (!userApiKey) {
            console.warn("[CreativeAgent] No OpenAI key found, using mock fallback.");
            return activeAds.flatMap((ad: any) => [
                {
                    id: `v1_${ad.id}`,
                    targetAdId: ad.id,
                    targetAdName: ad.name,
                    adImage: ad.creative?.thumbnail_url,
                    angle: 'Urgência',
                    headline: 'Aproveite agora',
                    bodyText: `Baseado no seu anúncio ${ad.name}, esta é uma variação de urgência.`,
                    cta: 'SAIBA_MAIS'
                }
            ]);
        }

        const openai = new OpenAI({ apiKey: userApiKey });

        const generationPromises = activeAds.map(async (ad: any) => {
            try {
                const currentTitle = ad.creative?.title || ad.name;
                const currentBody = ad.creative?.body || "";

                const response = await openai.chat.completions.create({
                    model: "gpt-4-turbo-preview",
                    messages: [
                        {
                            role: "system",
                            content: `Você é um Copywriter Especialista em Meta Ads.
                            Sua tarefa é criar 3 variações de anúncio baseadas no contexto de um anúncio existente.
                            Mantenha o tom de voz e o produto, mas mude o ângulo.
                            
                            Ângulos:
                            1. Urgência e Escassez
                            2. Foco no Benefício Direto
                            3. Prova Social / Autoridade

                            Responda APENAS um objeto JSON com a lista 'variations'. Cada item deve ter:
                            - angle: nome do ângulo
                            - headline: max 40 caracteres
                            - bodyText: texto principal envolvente
                            - cta: uma das opções: SAIBA_MAIS, COMPRAR_AGORA, CADASTRAR_SE, VER_MAIS`
                        },
                        {
                            role: "user",
                            content: `Anúncio Original:
                            Título: ${currentTitle}
                            Texto: ${currentBody}
                            
                            Gere variações para este contexto específico.`
                        }
                    ],
                    response_format: { type: "json_object" }
                });

                const data = JSON.parse(response.choices[0].message.content || "{}");
                return (data.variations || []).map((v: any, index: number) => ({
                    id: `ai_creative_${ad.id}_${index}`,
                    targetAdId: ad.id,
                    targetAdName: ad.name,
                    adImage: ad.creative?.thumbnail_url,
                    angle: v.angle,
                    headline: v.headline,
                    bodyText: v.bodyText,
                    cta: v.cta
                }));
            } catch (err) {
                console.error(`[CreativeAgent] Error generating for ad ${ad.id}:`, err);
                return [];
            }
        });

        const results = await Promise.all(generationPromises);
        return results.flat();
    } catch (error) {
        console.error("Creative generation error:", error);
        return [];
    }
}
