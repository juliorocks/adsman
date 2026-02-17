
export interface CreativeVariation {
    id: string;
    headline: string;
    bodyText: string;
    cta: string;
    angle: string;
}

const NICHES = {
    'CONVERSIONS': {
        angles: ['Urgência', 'Benefício Direto', 'Prova Social'],
        headlines: [
            'Oferta por Tempo Limitado!',
            'Como [Problema] se tornou [Solução]',
            'Mais de 10.000 clientes satisfeitos'
        ]
    },
    'OUTLINE': {
        angles: ['Curiosidade', 'Autoridade'],
        headlines: [
            'O segredo para [Objetivo] revelado',
            'Especialistas recomendam [Produto]'
        ]
    }
};

export async function generateCreativeIdeas(objective: string = 'CONVERSIONS'): Promise<CreativeVariation[]> {
    // Simulating AI generation for different angles
    const variations: CreativeVariation[] = [
        {
            id: 'v1',
            angle: 'Foco em Dor/Problema',
            headline: 'Cansado de perder tempo com [Nicho]?',
            bodyText: 'Descubra a ferramenta que está mudando o jogo para profissionais de marketing. Eficiência real sem complicações.',
            cta: 'Saiba Mais'
        },
        {
            id: 'v2',
            angle: 'Prova Social e Autoridade',
            headline: 'Por que [Número] de empresas escolheram a AIOS',
            bodyText: 'Junte-se à comunidade de elite que automatizou seus anúncios da Meta com inteligência real.',
            cta: 'Experimentar Grátis'
        },
        {
            id: 'v3',
            angle: 'Escassez e Urgência',
            headline: 'Últimas vagas para o Beta Exclusivo',
            bodyText: 'Não fique para trás na revolução da IA nos anúncios. Garanta seu acesso hoje mesmo.',
            cta: 'Obter Acesso'
        }
    ];

    return variations;
}
