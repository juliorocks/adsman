"use server";

import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { getAdSetsForCampaign, getAdsForAdSet } from "@/lib/meta/api";

export async function getCampaignAdSetsQuery(campaignId: string) {
    try {
        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref) return { success: false, error: "Integração não encontrada" };

        let accessToken: string;
        try {
            accessToken = decrypt(integration.access_token_ref);
        } catch (decryptErr: any) {
            console.error("Decrypt error in getCampaignAdSetsQuery:", decryptErr);
            return { success: false, error: "Erro ao descriptografar token. Reconecte sua conta Meta." };
        }

        const data = await getAdSetsForCampaign(campaignId, accessToken);
        return { success: true, data };
    } catch (error: any) {
        console.error("getCampaignAdSetsQuery Error:", error);
        return { success: false, error: error.message || "Erro ao carregar conjuntos de anúncios." };
    }
}

export async function getAdSetAdsQuery(adSetId: string) {
    try {
        const integration = await getIntegration();
        if (!integration || !integration.access_token_ref) return { success: false, error: "Integração não encontrada" };

        let accessToken: string;
        try {
            accessToken = decrypt(integration.access_token_ref);
        } catch (decryptErr: any) {
            console.error("Decrypt error in getAdSetAdsQuery:", decryptErr);
            return { success: false, error: "Erro ao descriptografar token. Reconecte sua conta Meta." };
        }

        const data = await getAdsForAdSet(adSetId, accessToken);
        return { success: true, data };
    } catch (error: any) {
        console.error("getAdSetAdsQuery Error:", error);
        return { success: false, error: error.message || "Erro ao carregar anúncios." };
    }
}
