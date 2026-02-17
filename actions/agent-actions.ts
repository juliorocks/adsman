
"use server";

import { revalidatePath } from "next/cache";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { updateBudget, updateObjectStatus } from "@/lib/meta/api";

export async function applyScalingAction(adSetId: string, newBudget: number) {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) {
        throw new Error("Meta integration not found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        // Meta API budget is in cents
        await updateBudget(adSetId, newBudget * 100, 'daily_budget', accessToken);

        revalidatePath("/dashboard/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Scaling application error:", error);
        return { success: false, error: error.message };
    }
}

export async function applyStatusAction(id: string, status: 'ACTIVE' | 'PAUSED') {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) {
        throw new Error("Meta integration not found");
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        await updateObjectStatus(id, status, accessToken);

        revalidatePath("/dashboard/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Status update error:", error);
        return { success: false, error: error.message };
    }
}
