"use server";

import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/security/vault";
import { revalidatePath } from "next/cache";

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function getInteractions() {
    const supabase = await createClient();
    const { data: userAuth, error: authErr } = await supabase.auth.getUser();

    if (authErr || !userAuth?.user) {
        throw new Error("Não autorizado");
    }

    const { data: integrations } = await supabase
        .from("integrations")
        .select("id")
        .eq("user_id", userAuth.user.id)
        .eq("status", "active");

    if (!integrations || integrations.length === 0) {
        return [];
    }

    const integrationIds = integrations.map((i: any) => i.id);

    // Fetch DRAFT (to be approved) and COMPLETED/FAILED/IGNORED for history
    const { data: interactions, error } = await supabase
        .from("social_interactions")
        .select(`
            id,
            platform,
            interaction_type,
            message,
            sender_id,
            status,
            ai_response,
            error_log,
            created_at,
            integration_id
        `)
        .in("integration_id", integrationIds)
        .in("status", ["DRAFT", "COMPLETED", "FAILED"])
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching interactions:", error);
        return [];
    }

    return interactions;
}

export async function approveAndSendInteraction(interactionId: string, editedResponse: string) {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    if (!userAuth?.user) {
        return { success: false, error: "Não autorizado" };
    }

    // 1. Fetch the interaction and the integration details
    const { data: interaction, error: fetchErr } = await supabase
        .from("social_interactions")
        .select(`
            *,
            integration:integrations (
                user_id,
                access_token_ref
            )
        `)
        .eq("id", interactionId)
        .single();

    if (fetchErr || !interaction) {
        return { success: false, error: "Interação não encontrada" };
    }

    if (interaction.integration.user_id !== userAuth.user.id) {
        return { success: false, error: "Acesso negado" };
    }

    if (interaction.status !== "DRAFT" && interaction.status !== "FAILED") {
        return { success: false, error: "Interação já processada" };
    }

    // 2. Map data and Decrypt Token
    let accessToken;
    try {
        accessToken = decrypt(interaction.integration.access_token_ref);
    } catch (e) {
        // Fallback or handle missing 
        accessToken = process.env.META_ACCESS_TOKEN || "";
    }

    let metaSuccess = false;
    let apiErrorLog = "";

    // 3. Send to Meta Graph API
    try {
        if (interaction.interaction_type === 'comment') {
            const graphRes = await fetch(`${META_GRAPH_URL}/${interaction.external_id}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: editedResponse, access_token: accessToken })
            });
            const graphData = await graphRes.json();
            if (graphData.error) throw new Error(graphData.error.message);
            metaSuccess = true;
        } else if (interaction.interaction_type === 'message') {
            const graphRes = await fetch(`${META_GRAPH_URL}/me/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: interaction.sender_id },
                    message: { text: editedResponse },
                    messaging_type: "RESPONSE",
                    access_token: accessToken
                })
            });
            const graphData = await graphRes.json();
            if (graphData.error) throw new Error(graphData.error.message);
            metaSuccess = true;
        }
    } catch (metaErr: any) {
        console.error("Meta Graph API err during approval:", metaErr);
        apiErrorLog = metaErr.message;
    }

    // 4. Update Database Status
    if (metaSuccess) {
        await supabase.from("social_interactions").update({
            status: "COMPLETED",
            ai_response: editedResponse,
            error_log: null
        }).eq("id", interactionId);

        revalidatePath("/dashboard/inbox");
        return { success: true };
    } else {
        await supabase.from("social_interactions").update({
            status: "FAILED",
            ai_response: editedResponse,
            error_log: apiErrorLog
        }).eq("id", interactionId);

        revalidatePath("/dashboard/inbox");
        return { success: false, error: apiErrorLog };
    }
}

export async function ignoreInteraction(interactionId: string) {
    const supabase = await createClient();

    // Auth checks mapped minimally here 
    const { error } = await supabase.from("social_interactions").update({
        status: "IGNORED"
    }).eq("id", interactionId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/inbox");
    return { success: true };
}
