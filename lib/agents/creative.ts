
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
        const stopWords = [
            'saiba', 'mais', 'precisa', 'vontade', 'força', 'clique', 'aqui', 'agora', 'link', 'bio', 'oferta', 'promoção',
            'você', 'para', 'com', 'pelo', 'pela', 'isso', 'esse', 'essa', 'está', 'fazer', 'têm', 'como', 'onde', 'quem',
            'seus', 'suas', 'meu', 'minha', 'nosso', 'nossa', 'tudo', 'muito', 'quer', 'pode', 'anos', 'pelo', 'pela',
            'pelas', 'pelos', 'sobre', 'então', 'também', 'quando', 'mais', 'menos', 'mesmo', 'sendo', 'estão', 'ficar',
            'tenha', 'terá', 'será', 'qual', 'pela', 'pelo', 'livros', 'sente'
        ];

        if (realCreatives.length > 0) {
            const rawText = realCreatives.slice(0, 10).map((v: any) =>
                `${v.title || ''} ${v.body || ''} ${v.object_story_spec?.link_data?.message || ''}`
            ).join(" ").toLowerCase();

            // Extract words: letters only, minimum 5 chars, not a stopword
            const words = rawText.match(/[a-záàâãéèêíïóôõöúç]{5,}/g) || [];
            const filtered = words.filter((w: string) => !stopWords.includes(w));

            const freq: Record<string, number> = {};
            filtered.forEach((w: string) => freq[w] = (freq[w] || 0) + 1);

            const sorted = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(e => e[0]);

            detectedContext = sorted.join(" ");
            console.log("Creative Agent Analysis:", { detectedContext });
        }

        const variations: CreativeVariation[] = [
            {
                id: 'v1',
                angle: 'Urgência e Escassez',
                headline: `Oportunidade por tempo limitado`,
                bodyText: detectedContext
                    ? `O tempo está acabando. Não perca a chance de transformar seus resultados com nossa solução focada em ${detectedContext}.`
                    : `Últimos slots disponíveis para este ciclo. Garanta sua vantagem exclusiva agora mesmo e não fique para trás.`,
                cta: 'Comprar Agora'
            },
            {
                id: 'v2',
                angle: 'Foco no Benefício',
                headline: `A evolução que seu negócio precisa`,
                bodyText: detectedContext
                    ? `Descubra por que especialistas estão priorizando ${detectedContext} para escalar operações este mês.`
                    : `Nossa metodologia exclusiva foi desenhada para quem busca performance real e previsibilidade de vendas.`,
                cta: 'Saiba Mais'
            },
            {
                id: 'v3',
                angle: 'Prova Social',
                headline: `Junte-se à Elite do Mercado`,
                bodyText: `Milhares de empreendedores já validaram nossa estrutura. O próximo nível de ${detectedContext || 'sua jornada'} começa com um clique.`,
                cta: 'Quero Conhecer'
            }
        ];

        return variations;
    } catch (error) {
        console.error("Creative generation error:", error);
        return [];
    }
}
