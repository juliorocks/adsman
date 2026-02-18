"use server";

import { decrypt } from "@/lib/security/vault";
import { getIntegration } from "@/lib/data/settings";
import { updateObjectStatus, updateBudget, getAd, createAdCreative, updateAdCreativeId, createAd } from "@/lib/meta/api";
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

        const ctaMapping: Record<string, string> = {
            "SAIBA_MAIS": "LEARN_MORE",
            "COMPRAR_AGORA": "SHOP_NOW",
            "CADASTRAR_SE": "SIGN_UP",
            "VER_MAIS": "WATCH_MORE",
            "FALAR_COM": "CONTACT_US",
            "RESERVAR": "BOOK_TRAVEL"
        };
        const validCta = ctaMapping[cta] || "LEARN_MORE";

        if (newSpec.link_data) {
            newSpec.link_data.message = bodyText; // Primary Text
            newSpec.link_data.name = headline;    // Headline (for link ads, usually 'name' or 'link_url' title)

            // Sometimes headline is in call_to_action.value.link_title
            if (newSpec.link_data.call_to_action) {
                newSpec.link_data.call_to_action.type = validCta;
                if (newSpec.link_data.call_to_action.value) {
                    newSpec.link_data.call_to_action.value.link_title = headline;
                }
            }
        } else if (newSpec.video_data) {
            newSpec.video_data.message = bodyText; // Primary Text
            newSpec.video_data.title = headline;   // Headline

            // Fix for "ObjectStorySpecRedundant": Remove image_hash if image_url exists
            if (newSpec.video_data.image_url) {
                delete newSpec.video_data.image_hash;
            } else if (newSpec.video_data.image_hash) {
                delete newSpec.video_data.image_url;
            }

            if (newSpec.video_data.call_to_action) {
                newSpec.video_data.call_to_action.type = validCta;
                // Fix for "Title/Description Obsolete": Do not set link_title in CTA value for videos
                // The error explicitly says to use 'title' field of video_data instead (which we set above)
                if (newSpec.video_data.call_to_action.value) {
                    delete newSpec.video_data.call_to_action.value.link_title;
                    delete newSpec.video_data.call_to_action.value.link_description;
                    delete newSpec.video_data.call_to_action.value.link_caption;
                }
            }
        }

        console.log("[Creative] Sending Spec:", JSON.stringify(newSpec, null, 2));

        // 3. Create the new creative
        const creativeName = `[AI] ${headline.substring(0, 20)}... - ${new Date().toISOString()}`;
        const newCreative = await createAdCreative(integration.ad_account_id, creativeName, newSpec, accessToken);

        // 4. Create a NEW Ad (Duplicate logic) instead of updating the existing one
        // Use a descriptive name for the new Ad
        const newAdName = `[AI Variação] ${headline} - ${ad.name}`;

        // Create as PAUSED for safety and review
        await createAd(integration.ad_account_id, ad.adset_id, newCreative.id, newAdName, accessToken, 'PAUSED');

        revalidatePath("/dashboard/agents");
        return { success: true, message: "Novo anúncio criado (Pausado) para teste A/B!" };
    } catch (error: any) {
        console.error("Apply creative variation error details:", JSON.stringify(error, null, 2));
        return { success: false, error: error.message || "Unknown error" };
    }
}
