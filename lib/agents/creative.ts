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

            const response = await ai.acquireLock(() => ai.client.chat.completions.create({
                model: ai.model,
                messages: [
                    {
                        role: "system",
                        content: `Você é um Copywriter Especialista em Meta Ads.
                        Responda RIGOROSAMENTE apenas em formato JSON.
                        Crie 3 variações de anúncio (Ângulos: Urgência, Benefício, Prova Social).
                        
                        Estrutura JSON:
                        {
                          "variations": [
                            {
                              "angle": "nome do ângulo",
                              "headline": "máx 40 caracteres",
                              "bodyText": "texto envolvente",
                              "cta": "SAIBA_MAIS | COMPRAR_AGORA | CADASTRAR_SE"
                            }
                          ]
                        }`
                    },
                    {
                        role: "user",
                        content: `Crie variações para o anúncio: "${currentTitle}". Texto atual: "${currentBody}"`
                    }
                ],
                temperature: 0.7,
                response_format: ai.isModal ? undefined : { type: "json_object" }
            }));

            let content = response.choices[0].message.content || "{}";

            if (ai.isModal) {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) content = jsonMatch[0];
            }

            const data = JSON.parse(content || "{}");
            const variations = data.variations || (Array.isArray(data) ? data : Object.values(data).find(v => Array.isArray(v)));

            if (Array.isArray(variations)) {
                variations.forEach((v: any, index: number) => {
                    allVariations.push({
                        id: `ai_creative_${ad.id}_${index}`,
                        targetAdId: ad.id,
                        targetAdName: ad.name,
                        adImage: ad.creative?.thumbnail_url,
                        angle: v.angle || 'Geral',
                        headline: v.headline || '',
                        bodyText: v.bodyText || '',
                        cta: v.cta || 'SAIBA_MAIS'
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
