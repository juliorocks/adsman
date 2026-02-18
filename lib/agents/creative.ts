import { decrypt } from "@/lib/security/vault";
import { getAds } from "@/lib/meta/api";
import { getIntegration } from "../data/settings";
import { getAIClient } from "../ai/client";

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
    const ai = await getAIClient();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const ads = await getAds(integration.ad_account_id, accessToken);
        const activeAds = ads.filter((a: any) => a.status === 'ACTIVE').slice(0, 3); // Top 3 ads

        if (!ai) {
            // Fallback mock if no key
            return activeAds.flatMap((ad: any, i: number) => [
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

        const allVariations: CreativeVariation[] = [];

        for (const ad of activeAds) {
            const currentTitle = ad.creative?.title || ad.name;
            const currentBody = ad.creative?.body || "";

            const response = await ai.client.chat.completions.create({
                model: ai.model,
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
                response_format: ai.isModal ? undefined : { type: "json_object" }
            });

            let content = response.choices[0].message.content || "{}";

            // Modal GLM-5 fallback
            if (ai.isModal && content.includes("```json")) {
                content = content.split("```json")[1].split("```")[0];
            } else if (ai.isModal && content.includes("```")) {
                content = content.split("```")[1].split("```")[0];
            }

            const data = JSON.parse(content || "{}");
            if (data.variations) {
                data.variations.forEach((v: any, index: number) => {
                    allVariations.push({
                        id: `ai_creative_${ad.id}_${index}`,
                        targetAdId: ad.id,
                        targetAdName: ad.name,
                        adImage: ad.creative?.thumbnail_url,
                        angle: v.angle,
                        headline: v.headline,
                        bodyText: v.bodyText,
                        cta: v.cta
                    });
                });
            }
        }

        return allVariations;
    } catch (error) {
        console.error("Creative generation error:", error);
        return [];
    }
}
