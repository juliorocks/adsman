
export interface StrategyResult {
    objective: string;
    budget: number;
    targeting: {
        age_min: number;
        age_max: number;
        genders: number[]; // 1=Male, 2=Female
        geo_locations: string[];
        interests: string[];
    };
    creative_preview: string;
    estimated_results: {
        impressions: number;
        clicks: number;
        cpc: number;
    };
}

export async function generateStrategy(objective: string): Promise<StrategyResult> {
    // Simulate AI latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock logic based on keywords
    const isTraffic = objective.toLowerCase().includes("tráfego") || objective.toLowerCase().includes("cliques");
    const isSales = objective.toLowerCase().includes("venda") || objective.toLowerCase().includes("conversão");

    return {
        objective: isSales ? "CONVERSIONS" : "OUTCOME_TRAFFIC",
        budget: isSales ? 50.00 : 20.00,
        targeting: {
            age_min: 25,
            age_max: 45,
            genders: [1, 2], // All
            geo_locations: ["Rio de Janeiro", "São Paulo"],
            interests: isSales ? ["Compras na internet", "Varejo"] : ["Tecnologia", "Marketing"],
        },
        creative_preview: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60",
        estimated_results: {
            impressions: isSales ? 15000 : 45000,
            clicks: isSales ? 350 : 1200,
            cpc: isSales ? 2.50 : 0.45,
        }
    };
}
