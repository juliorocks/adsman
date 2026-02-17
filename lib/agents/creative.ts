
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

        // Analysis of real content to extract business context
        let detectedContext = "";
        const commonGarbageWords = ['saiba', 'mais', 'precisa', 'vontade', 'força', 'clique', 'aqui', 'agora', 'link', 'bio', 'oferta', 'promoção'];

        if (realCreatives.length > 0) {
            const sampleText = realCreatives.slice(0, 5).map((v: any) =>
                `${v.title || ''} ${v.body || ''} ${v.object_story_spec?.link_data?.message || ''}`
            ).join(" ").toLowerCase();

            const words = sampleText.split(/[^\w\u00C0-\u00FF]+/)
                .filter((w: string) => w.length > 3 && !commonGarbageWords.includes(w));

            // Get most frequent meaningful words
            const freq: Record<string, number> = {};
            words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1);

            const sorted = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(e => e[0]);

            detectedContext = sorted.join(" ");
            console.log("Creative Agent: Detected Context ->", detectedContext);
        }

        const fallbackContext = detectedContext || "seu negócio";

        const variations: CreativeVariation[] = [
            {
                id: 'v1',
                angle: 'Urgência e Escassez',
                headline: realCreatives[0]?.title ? `Última Chance: ${realCreatives[0].title}` : `Aproveite esta oportunidade única`,
                bodyText: detectedContext
                    ? `O tempo está acabando para você garantir o melhor em ${detectedContext}. Não fique de fora!`
                    : `Últimas unidades/vagas disponíveis. Garanta sua vantagem exclusiva agora mesmo antes que a oferta expire.`,
                cta: 'Comprar Agora'
            },
            {
                id: 'v2',
                angle: 'Foco no Benefício',
                headline: detectedContext ? `Transforme sua rotina com ${detectedContext.split(' ')[0]}` : `A solução definitiva que você buscava`,
                bodyText: `Descubra como nossa metodologia em ${fallbackContext} pode acelerar seus resultados de forma consistente e escalável.`,
                cta: 'Saiba Mais'
            },
            {
                id: 'v3',
                angle: 'Prova Social',
                headline: `Junte-se a milhares de clientes satisfeitos`,
                bodyText: `Veja por que somos referência em ${fallbackContext}. Centenas de pessoas já alcançaram seus objetivos conosco.`,
                cta: 'Quero Conhecer'
            }
        ];

        return variations;
    } catch (error) {
        console.error("Creative generation error:", error);
        return [];
    }
}
