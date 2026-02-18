"use server";

import { decrypt } from "@/lib/security/vault";
import { getIntegration } from "@/lib/data/settings";
import { updateObjectStatus, updateBudget, getAd, createAdCreative, updateAdCreativeId } from "@/lib/meta/api";
import { revalidatePath } from "next/cache";

async function updateBudgetRobust(targetId: string, amount: number, accessToken: string) {
    try {
        await updateBudget(targetId, amount, 'daily_budget', accessToken);
    } catch (err: any) {
        if (err.message.includes('lifetime_budget')) {
            await updateBudget(targetId, amount, 'lifetime_budget', accessToken);
        } else {
            throw err;
        }
    }
}

export async function applyRecommendationAction(recommendationId: string, type: string, targetId: string, currentBudget: number, suggestedBudget?: number) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) throw new Error("Não autorizado");

    try {
        const accessToken = decrypt(integration.access_token_ref);

        if (type === 'pause' || type === 'critical') {
            await updateObjectStatus(targetId, 'PAUSED', accessToken);
        } else if (type === 'scale_up' && suggestedBudget) {
            await updateBudgetRobust(targetId, suggestedBudget * 100, accessToken);
        } else if (type === 'optimization') {
            // Log and bypass for now, or perform soft-action
            console.log(`[OPTIMIZATION] Manual review required for ${targetId}`);
        }

        revalidatePath("/dashboard/agents");
        return { success: true, message: type === 'optimization' ? "Revisão agendada. Use as variações abaixo." : "Ação aplicada com sucesso!" };
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
                return updateBudgetRobust(rec.targetId, rec.suggestedBudget * 100, accessToken);
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

export async function applyCreativeVariationAction(adId: string, headline: string, bodyText: string, cta: string) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) throw new Error("Não autorizado");

    try {
        const accessToken = decrypt(integration.access_token_ref);

        // 1. Get original ad context (image, link, etc.)
        const ad = await getAd(adId, accessToken);
        const originalCreative = ad.creative;

        // 2. Prepare new AdCreative data
        const newSpec = { ...originalCreative.object_story_spec };

        if (newSpec.link_data) {
            newSpec.link_data.message = bodyText;
            if (newSpec.link_data.call_to_action) {
                newSpec.link_data.call_to_action.type = cta;
                if (newSpec.link_data.call_to_action.value) {
                    newSpec.link_data.call_to_action.value.link_title = headline;
                }
            }
        }

        // 3. Create the new creative
        const creativeName = `AI Opt: ${originalCreative.name} (${new Date().toLocaleDateString()})`;
        const newCreative = await createAdCreative(integration.ad_account_id, creativeName, newSpec, accessToken);

        // 4. Update the Ad to use this new creative
        await updateAdCreativeId(adId, newCreative.id, accessToken);

        revalidatePath("/dashboard/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Apply creative variation error:", error);
        return { success: false, error: error.message };
    }
}
