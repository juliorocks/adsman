
"use server";

import { decrypt } from "@/lib/security/vault";
import { getIntegration } from "@/lib/data/settings";
import { updateObjectStatus, updateBudget } from "@/lib/meta/api";
import { revalidatePath } from "next/cache";

export async function applyRecommendationAction(recommendationId: string, type: string, targetId: string, currentBudget: number, suggestedBudget?: number) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) throw new Error("Não autorizado");

    try {
        const accessToken = decrypt(integration.access_token_ref);

        if (type === 'pause' || type === 'critical') {
            await updateObjectStatus(targetId, 'PAUSED', accessToken);
        } else if (type === 'scale_up' && suggestedBudget) {
            await updateBudget(targetId, suggestedBudget * 100, 'daily_budget', accessToken);
        }

        revalidatePath("/dashboard/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Apply recommendation error:", error);
        return { success: false, error: error.message };
    }
}

export async function applyAllRecommendationsAction(recommendations: any[]) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) throw new Error("Não autorizado");

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const promises = recommendations.map(rec => {
            if (rec.type === 'pause' || rec.type === 'critical') {
                return updateObjectStatus(rec.targetId, 'PAUSED', accessToken);
            } else if (rec.type === 'scale_up' && rec.suggestedBudget) {
                return updateBudget(rec.targetId, rec.suggestedBudget * 100, 'daily_budget', accessToken);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
        revalidatePath("/dashboard/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Apply all recommendations error:", error);
        return { success: false, error: error.message };
    }
}
