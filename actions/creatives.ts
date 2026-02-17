
"use server";

import { generateCreativeIdeas, GeneratedCreatives } from "@/lib/ai/creatives";

export async function generateCreativeIdeasAction(goal: string): Promise<{ success: boolean; data?: GeneratedCreatives; error?: string }> {
    try {
        const data = await generateCreativeIdeas(goal);
        return { success: true, data };
    } catch (error: any) {
        console.error("Action error generating creatives:", error);
        return { success: false, error: error.message };
    }
}
