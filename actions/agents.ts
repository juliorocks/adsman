
"use server";

import { runAgentSquad } from "@/lib/agents/orchestrator";
import { revalidatePath } from "next/cache";

export async function runAgentSquadAction() {
    try {
        const result = await runAgentSquad();
        revalidatePath("/dashboard/agents");
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
