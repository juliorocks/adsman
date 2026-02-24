
"use server";

import { generateCreativeIdeas, GeneratedCreatives, generateCreativeImages } from "@/lib/ai/creatives";

export async function generateCreativeIdeasAction(goal: string, knowledgeBaseId?: string): Promise<{ success: boolean; data?: GeneratedCreatives; error?: string }> {
    try {
        const data = await generateCreativeIdeas(goal, knowledgeBaseId);
        return { success: true, data };
    } catch (error: any) {
        console.error("Action error generating creatives:", error);
        return { success: false, error: error.message };
    }
}

export async function generateCreativeImagesAction(prompt: string, count: number = 4): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    try {
        const urls = await generateCreativeImages(prompt, count);
        if (urls && urls.length > 0) return { success: true, urls };
        return { success: false, error: "Failed to generate images." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
