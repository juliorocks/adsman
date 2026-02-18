import { decrypt } from "@/lib/security/vault";
import { getAds } from "@/lib/meta/api";
import { getIntegration, getOpenAIKey } from "../data/settings";
import OpenAI from "openai";
import { unstable_cache } from "next/cache";

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

// Cached function to generate creative for a single ad
const getCachedCreativeForAd = async (ad: any, apiKey: string) => {
    const fn = unstable_cache(
        async () => {
            const openai = new OpenAI({ apiKey });
            const currentTitle = ad.creative?.title || ad.name;
            const currentBody = ad.creative?.body || "";

            if (!currentTitle && !currentBody) return [];

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini", // Optimized model
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
                    adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                    angle: v.angle,
                    headline: v.headline,
                    bodyText: v.bodyText,
                    cta: v.cta
                }));
            } catch (error) {
                console.error(`AI Generation failed for ${ad.id}`, error);
                throw error; // Let the caller handle fallback
            }
        },
        [`creative-variations-${ad.id}`], // Cache key based on Ad ID
        {
            revalidate: 86400, // Cache for 24 hours
            tags: [`creative-${ad.id}`]
        }
    );

    return fn();
};

export async function generateCreativeIdeas(): Promise<CreativeVariation[]> {
    const integration = await getIntegration();
    const userApiKey = await getOpenAIKey();

    if (!integration || !integration.access_token_ref || !integration.ad_account_id) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const ads = await getAds(integration.ad_account_id, accessToken);

        let activeAds = ads.filter((a: any) => a.status === 'ACTIVE').slice(0, 5);

        if (activeAds.length === 0) {
            activeAds = ads.slice(0, 5);
        }

        if (activeAds.length === 0) return [];

        if (!userApiKey) {
            return activeAds.flatMap((ad: any) => [
                {
                    id: `v1_${ad.id}`,
                    targetAdId: ad.id,
                    targetAdName: ad.name,
                    adImage: ad.creative?.thumbnail_url,
                    angle: 'Urgência (Simulado)',
                    headline: 'Aproveite agora (Simulado)',
                    bodyText: `Baseado no seu anúncio ${ad.name}, esta é uma variação de urgência simulada pois falta a chave da OpenAI.`,
                    cta: 'SAIBA_MAIS'
                }
            ]);
        }

        const generationPromises = activeAds.map(async (ad: any) => {
            try {
                return await getCachedCreativeForAd(ad, userApiKey);
            } catch (err: any) {
                console.error(`[CreativeAgent] Error generating for ad ${ad.id}:`, err.message);

                // Fallback: If AI fails (e.g. rate limit, content policy), return template-based variations
                return [
                    {
                        id: `backup_${ad.id}_1`,
                        targetAdId: ad.id,
                        targetAdName: ad.name,
                        adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                        angle: "Urgência (Backup)",
                        headline: "Oferta por Tempo Limitado",
                        bodyText: `Aproveite as condições especiais para ${ad.name}. Restam poucas unidades disponíveis nesta condição exclusiva.`,
                        cta: "COMPRAR_AGORA"
                    },
                    {
                        id: `backup_${ad.id}_2`,
                        targetAdId: ad.id,
                        targetAdName: ad.name,
                        adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                        angle: "Benefício (Backup)",
                        headline: "Solução Comprovada",
                        bodyText: `Descubra por que ${ad.name} é a escolha certa para você. Resultados consistentes e qualidade garantida.`,
                        cta: "SAIBA_MAIS"
                    },
                    {
                        id: `backup_${ad.id}_3`,
                        targetAdId: ad.id,
                        targetAdName: ad.name,
                        adImage: ad.creative?.thumbnail_url || ad.creative?.image_url,
                        angle: "Autoridade (Backup)",
                        headline: "Junte-se aos Melhores",
                        bodyText: `${ad.name}: A referência do mercado. Milhares de clientes satisfeitos não podem estar errados.`,
                        cta: "SAIBA_MAIS"
                    }
                ];
            }
        });

        const results = await Promise.all(generationPromises);
        return results.flat();
    } catch (error) {
        console.error("Creative generation error:", error);
        return [
            {
                id: 'fallback_error_1',
                targetAdId: 'error_state',
                targetAdName: 'Campanha Genérica',
                angle: 'Aviso de Sistema',
                headline: 'Erro ao Carregar Anúncios',
                bodyText: 'Não foi possível conectar à Meta Ads para recuperar seus criativos específicos. Verifique se a integração está ativa e se há anúncios criados.',
                cta: 'VERIFICAR_AGORA'
            }
        ];
    }
}
