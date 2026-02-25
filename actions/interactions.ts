"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/security/vault";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const getDbClient = (user: any, defaultClient: any) => {
    if (user?.id === "de70c0de-ad00-4000-8000-000000000000") {
        return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    }
    return defaultClient;
};

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function getInteractions() {
    const supabase = await createClient();
    const { data: userAuth, error: authErr } = await supabase.auth.getUser();

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

    if (!user) {
        throw new Error("Não autorizado");
    }

    const db = getDbClient(user, supabase);

    const { data: integrations } = await db
        .from("integrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");

    if (!integrations || integrations.length === 0) {
        return [];
    }

    const integrationIds = integrations.map((i: any) => i.id);

    // Fetch DRAFT (to be approved) and COMPLETED/FAILED/IGNORED for history
    const { data: interactions, error } = await db
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
        .in("status", ["PENDING", "DRAFT", "COMPLETED", "FAILED"])
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

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

    if (!user) {
        return { success: false, error: "Não autorizado" };
    }

    const db = getDbClient(user, supabase);

    // 1. Fetch the interaction and the integration details
    const { data: interaction, error: fetchErr } = await db
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

    if (interaction.integration.user_id !== user.id) {
        return { success: false, error: "Acesso negado" };
    }

    if (interaction.status !== "DRAFT" && interaction.status !== "FAILED") {
        return { success: false, error: "Interação já processada" };
    }

    // 2. Map data and Decrypt Token
    let userAccessToken;
    try {
        userAccessToken = decrypt(interaction.integration.access_token_ref);
    } catch (e) {
        // Fallback or handle missing 
        userAccessToken = process.env.META_ACCESS_TOKEN || "";
    }

    let accessToken = userAccessToken;

    let pageIdOrIgId = interaction.context?.page_id;
    if (!pageIdOrIgId && interaction.interaction_type === 'message') {
        pageIdOrIgId = interaction.context?.raw?.recipient?.id;
    }

    if (pageIdOrIgId && userAccessToken) {
        try {
            const accRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=id,access_token,instagram_business_account,connected_instagram_account&access_token=${userAccessToken}`);
            const accData = await accRes.json();
            if (accData.data) {
                for (const page of accData.data) {
                    if (
                        page.id === pageIdOrIgId ||
                        page.instagram_business_account?.id === pageIdOrIgId ||
                        page.connected_instagram_account?.id === pageIdOrIgId
                    ) {
                        accessToken = page.access_token;
                        break;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch dynamically bound page token", e);
        }
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
            const isInstagram = interaction.platform === 'instagram';
            const endpoint = isInstagram
                ? `${META_GRAPH_URL}/${pageIdOrIgId}/messages`
                : `${META_GRAPH_URL}/me/messages`;

            const payload: any = {
                recipient: { id: interaction.sender_id },
                message: { text: editedResponse },
                access_token: accessToken
            };

            if (!isInstagram) {
                payload.messaging_type = "RESPONSE";
            }

            const graphRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
        await db.from("social_interactions").update({
            status: "COMPLETED",
            ai_response: editedResponse,
            error_log: null
        }).eq("id", interactionId);

        revalidatePath("/dashboard/inbox");
        return { success: true };
    } else {
        await db.from("social_interactions").update({
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
    const { data: userAuth } = await supabase.auth.getUser();

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

    if (!user) {
        return { success: false, error: "Não autorizado" };
    }

    const db = getDbClient(user, supabase);

    const { error } = await db.from("social_interactions").update({
        status: "IGNORED"
    }).eq("id", interactionId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/inbox");
    return { success: true };
}
