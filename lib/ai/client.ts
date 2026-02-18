
import OpenAI from "openai";
import { getOpenAIKey, getModalKey, getAIPreference } from "@/lib/data/settings";

// Simple semaphore to prevent concurrent AI calls on Modal (Limit: 1)
let aiLock: Promise<void> = Promise.resolve();

export async function getAIClient() {
    const preference = await getAIPreference();
    const modalKey = await getModalKey();
    const openaiKey = await getOpenAIKey();

    // 1. If OpenAI is preferred and available
    if (preference === 'openai' && openaiKey) {
        console.log("[AI Client] Using OpenAI (User Preference)");
        return {
            client: new OpenAI({
                apiKey: openaiKey
            }),
            model: "gpt-4-turbo-preview",
            isModal: false,
            acquireLock: async <T>(fn: () => Promise<T>): Promise<T> => await fn()
        };
    }

    // 2. If Modal is available (either preferred or as default/fallback)
    if (modalKey) {
        console.log("[AI Client] Using Modal/GLM-5");
        return {
            client: new OpenAI({
                apiKey: modalKey,
                baseURL: "https://api.us-west-2.modal.direct/v1"
            }),
            model: "zai-org/GLM-5-FP8",
            isModal: true,
            acquireLock: async <T>(fn: () => Promise<T>): Promise<T> => {
                const currentLock = aiLock;
                let release: () => void;
                aiLock = new Promise((resolve) => { release = resolve; });
                await currentLock;
                try {
                    return await fn();
                } finally {
                    release!();
                }
            }
        };
    }

    // 3. Last fallback: OpenAI if available
    if (openaiKey) {
        return {
            client: new OpenAI({
                apiKey: openaiKey
            }),
            model: "gpt-4-turbo-preview",
            isModal: false,
            acquireLock: async <T>(fn: () => Promise<T>): Promise<T> => await fn()
        };
    }

    return null;
}
