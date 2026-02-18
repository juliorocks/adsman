
import OpenAI from "openai";
import { getOpenAIKey, getModalKey } from "@/lib/data/settings";

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
            isModal: true
        };
    }

    if (openaiKey) {
        return {
            client: new OpenAI({
                apiKey: openaiKey
            }),
            model: "gpt-4-turbo-preview",
            isModal: false
        };
    }

    return null;
}
