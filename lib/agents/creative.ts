
import { decrypt } from "@/lib/security/vault";
import { getAdCreatives } from "@/lib/meta/api";
import { getIntegration } from "../data/settings";

export interface CreativeVariation {
    id: string;
    headline: string;
    bodyText: string;
    cta: string;
    angle: string;
}

export async function generateCreativeIdeas(objective: string = 'CONVERSIONS'): Promise<CreativeVariation[]> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref || !integration.ad_account_id) {
        return [];
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const realCreatives = await getAdCreatives(integration.ad_account_id, accessToken);

        // Analyze real content to extract keywords/business context
        let detectedContext = "";
        if (realCreatives.length > 0) {
            // Take titles and bodies from the last 3 creatives to build context
            const sampleText = realCreatives.slice(0, 3).map((v: any) =>
                `${v.title || ''} ${v.body || ''} ${v.object_story_spec?.link_data?.message || ''}`
            ).join(" ");

            // Extract some keywords (simulated analysis)
            const words = sampleText.toLowerCase().split(/\s+/);
            const commonKeywords = words.filter(w => w.length > 4).slice(0, 5);
            detectedContext = commonKeywords.join(" ");
        }

        const variations: CreativeVariation[] = [
            {
                id: 'v1',
                angle: 'Urgência e Escassez',
                headline: realCreatives[0]?.title ? `Última Chance: ${realCreatives[0].title}` : `Oferta exclusiva por tempo limitado`,
                bodyText: `Não perca a oportunidade de garantir o melhor em ${detectedContext || 'seu setor'}. Qualidade garantida e entrega rápida.`,
                cta: 'Comprar Agora'
            },
            {
                id: 'v2',
                angle: 'Foco no Benefício',
                headline: `O segredo para sua satisfação com ${detectedContext || 'nossos produtos'}`,
                bodyText: `Descubra por que nossos clientes não abrem mão de ${detectedContext || 'nossa qualidade'}. Transforme sua experiência hoje.`,
                cta: 'Saiba Mais'
            },
            {
                id: 'v3',
                angle: 'Prova Social',
                headline: `Milhares de pessoas já aprovaram`,
                bodyText: `Junte-se à comunidade que confia em ${detectedContext || 'nosso trabalho'}. Resultados reais e suporte dedicado.`,
                cta: 'Quero Conhecer'
            }
        ];

        return variations;
    } catch (error) {
        console.error("Creative generation error:", error);
        return [];
    }
}
