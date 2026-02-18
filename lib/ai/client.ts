
import OpenAI from "openai";
import { getOpenAIKey, getModalKey } from "@/lib/data/settings";

// Simple semaphore to prevent concurrent AI calls on Modal (Limit: 1)
let aiLock: Promise<void> = Promise.resolve();

export async function getAIClient() {
    const modalKey = await getModalKey();
    const openaiKey = await getOpenAIKey();

    // Prefer Modal/GLM-5 if key is available since it's free currently
    if (modalKey) {
        return {
            client: new OpenAI({
                apiKey: modalKey,
                baseURL: "https://api.us-west-2.modal.direct/v1"
            }),
            model: "zai-org/GLM-5-FP8",
            isModal: true,
            // Function to wrap calls in the lock
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
