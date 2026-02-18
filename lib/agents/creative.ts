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
        const activeAds = ads.filter((a: any) => a.status === 'ACTIVE' || a.status === 'PAUSED').slice(0, 5);

        console.log(`[Creative] Found ${ads.length} total ads, analyzing ${activeAds.length} for variations.`);

        if (!ai) {
            console.log("[Creative] No AI client available, using fallback mock.");
            // Fallback mock if no key
            return activeAds.flatMap((ad: any, i: number) => [
                {
                    id: `v1_${ad.id}`,
                    targetAdId: ad.id,
                    targetAdName: ad.name,
                    adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
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

            console.log(`[Creative] Generating variations for: ${ad.name}`);

            try {
                const response = await ai.acquireLock(() => ai.client.chat.completions.create({
                    model: ai.model,
                    messages: [
                        {
                            role: "system",
                            content: `Você é um Copywriter Especialista em Meta Ads. 
                            Gere 3 variações baseadas no anúncio do usuário.
                            Responda APENAS em JSON válido.

                            Estrutura JSON:
                            {
                              "variations": [
                                {
                                  "angle": "Urgência | Benefício | Prova Social",
                                  "headline": "máx 40 caracteres",
                                  "bodyText": "texto atraente",
                                  "cta": "SAIBA_MAIS | COMPRAR_AGORA"
                                }
                              ]
                            }`
                        },
                        {
                            role: "user",
                            content: `Anúncio: "${currentTitle}". Texto: "${currentBody}"`
                        }
                    ],
                    temperature: 0.8,
                    response_format: ai.isModal ? undefined : { type: "json_object" }
                }));

                let content = response.choices[0].message.content || "{}";
                console.log(`[Creative] Raw AI Response for ${ad.name}: ${content.substring(0, 50)}...`);

                if (ai.isModal) {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) content = jsonMatch[0];
                }

                const data = JSON.parse(content || "{}");
                const variations = data.variations || (Array.isArray(data) ? data : Object.values(data).find(v => Array.isArray(v)));

                if (Array.isArray(variations)) {
                    variations.forEach((v: any, index: number) => {
                        allVariations.push({
                            id: `ai_creative_${ad.id}_${index}_${Date.now()}`,
                            targetAdId: ad.id,
                            targetAdName: ad.name,
                            adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                            angle: v.angle || 'Novidade',
                            headline: v.headline || 'Confira agora',
                            bodyText: v.bodyText || 'Variação gerada por IA.',
                            cta: v.cta || 'SAIBA_MAIS'
                        });
                    });
                }
            } catch (err) {
                console.error(`[Creative] Error generating for ${ad.id}:`, err);
            }
        }

        console.log(`[Creative] Final variation count: ${allVariations.length}`);
        return allVariations;
    } catch (error) {
        console.error("[Creative] Core routine error:", error);
        return [];
    }
}
