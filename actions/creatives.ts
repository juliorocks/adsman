
"use server";

import { generateCreativeIdeas, GeneratedCreatives, generateCreativeImage } from "@/lib/ai/creatives";

export async function generateCreativeIdeasAction(goal: string, knowledgeBaseId?: string): Promise<{ success: boolean; data?: GeneratedCreatives; error?: string }> {
    try {
        const data = await generateCreativeIdeas(goal, knowledgeBaseId);
        return { success: true, data };
    } catch (error: any) {
        console.error("Action error generating creatives:", error);
        return { success: false, error: error.message };
    }
}

export async function generateCreativeImageAction(prompt: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const url = await generateCreativeImage(prompt);
        if (url) return { success: true, url };
        return { success: false, error: "Failed to generate image." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
