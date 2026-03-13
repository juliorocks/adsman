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

import { createAdminClient as createAdminSupabase } from "@/lib/supabase/admin";
import { getWorkspaceOwnerId } from "@/lib/data/settings";

const MOCK_USER_ID = "de70c0de-ad00-4000-8000-000000000000";

export async function getInteractions() {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: MOCK_USER_ID } as any;

    if (!user) {
        throw new Error("Não autorizado");
    }

    const adminDb = createAdminSupabase();

    // Resolve workspace owner: team members inherit admin's integrations
    const effectiveUserId = await getWorkspaceOwnerId(user.id);

    // Prioridade 1: cliente explicitamente selecionado via cookie (selectClient)
    const activeIntegrationId = cookies().get("active_integration_id")?.value;

    let integrationIds: string[] = [];

    if (activeIntegrationId) {
        // Valida que esse integration_id pertence ao workspace do usuário
        const { data: integCheck } = await adminDb
            .from("integrations")
            .select("id")
            .eq("id", activeIntegrationId)
            .eq("user_id", effectiveUserId)
            .single();

        if (integCheck) {
            integrationIds = [activeIntegrationId];
        }
    }

    // Prioridade 2: se não tiver cookie ou não pertencer ao workspace, usa todas as integrations Meta
    if (integrationIds.length === 0) {
        const { data: userIntegrations } = await adminDb
            .from("integrations")
            .select("id")
            .eq("user_id", effectiveUserId)
            .eq("platform", "meta");

        integrationIds = (userIntegrations || []).map((i: any) => i.id);
    }

    if (integrationIds.length === 0) {
        console.log("getInteractions: no meta integrations found for user", user.id);
        return [];
    }

    // Busca interações SOMENTE das integrations do cliente selecionado
    const { data: interactions, error } = await adminDb
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
            context,
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
    const adminDb = createAdminSupabase();

    // Resolve workspace owner: team members inherit admin's integrations
    const effectiveUserId = await getWorkspaceOwnerId(user.id);

    // 1. Fetch the interaction and the integration details
    const { data: interaction, error: fetchErr } = await adminDb
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

    // Allow if the integration belongs to the user or to their workspace owner
    if (interaction.integration.user_id !== user.id && interaction.integration.user_id !== effectiveUserId) {
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
                        // For Instagram, we must use the PAGE's scope for the 'me/messages' endpoint to work correctly
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
            // With a Page Access Token, 'me/messages' is the standard for both platforms
            const endpoint = `${META_GRAPH_URL}/me/messages`;

            const payload: any = {
                recipient: { id: interaction.sender_id },
                message: { text: editedResponse },
                access_token: accessToken
            };

            // Instagram requires no messaging_type, Facebook Messenger prefers RESPONSE
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

    // Use admin client so team members can update interactions from the owner's integrations
    const db = user.id === MOCK_USER_ID ? getDbClient(user, supabase) : createAdminSupabase();

    const { error } = await db.from("social_interactions").update({
        status: "IGNORED"
    }).eq("id", interactionId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/inbox");
    return { success: true, ignored: true };
}

export async function regenerateInteraction(interactionId: string) {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

    if (!user) {
        return { success: false, error: "Não autorizado" };
    }

    // Use admin client so team members can update interactions from the owner's integrations
    const db = user.id === MOCK_USER_ID ? getDbClient(user, supabase) : createAdminSupabase();

    // Reset status to PENDING
    const { error } = await db.from("social_interactions").update({
        status: "PENDING",
        ai_response: null,
        error_log: null
    }).eq("id", interactionId).in("status", ["DRAFT", "FAILED"]);

    if (error) {
        return { success: false, error: error.message };
    }

    // Ping the cron endpoint to process it faster
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adsman.vercel.app';
        fetch(`${appUrl}/api/cron/community-manager`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
            }
        }).catch(() => { }); // fire and forget
    } catch (e) {
        // ignore
    }

    revalidatePath("/dashboard/inbox");
    return { success: true };
}

// Pulls unanswered DMs from Meta Graph API and inserts missing ones as PENDING
export async function syncMetaMessages() {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    let user = userAuth?.user as any;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: MOCK_USER_ID } as any;
    if (!user) return { success: false, error: "Não autorizado", synced: 0 };

    const adminDb = createAdminSupabase();
    const effectiveUserId = await getWorkspaceOwnerId(user.id);

    const { data: integrations } = await adminDb
        .from("integrations")
        .select("id, access_token_ref, preferred_page_id, preferred_instagram_id")
        .eq("user_id", effectiveUserId)
        .eq("platform", "meta")
        .eq("status", "active");

    if (!integrations || integrations.length === 0) {
        return { success: false, error: "Nenhuma conta Meta conectada.", synced: 0 };
    }

    let totalSynced = 0;

    for (const integration of integrations) {
        try {
            const userToken = decrypt(integration.access_token_ref);

            const accountsRes = await fetch(
                `${META_GRAPH_URL}/me/accounts?fields=id,access_token,instagram_business_account,name&access_token=${userToken}`
            );
            const accountsData = await accountsRes.json();
            if (!accountsData.data) continue;

            for (const page of accountsData.data) {
                const pageToken = page.access_token;
                const igId = page.instagram_business_account?.id;

                // --- Instagram DMs ---
                if (igId) {
                    const convRes = await fetch(
                        `${META_GRAPH_URL}/${igId}/conversations?platform=instagram&fields=messages{id,message,from,created_time}&access_token=${pageToken}&limit=20`
                    );
                    const convData = await convRes.json();
                    if (!convData.error && convData.data) {
                        for (const conv of convData.data) {
                            const messages = conv.messages?.data || [];
                            if (messages.length === 0) continue;
                            // Skip if business already replied last
                            if (messages[0].from?.id === igId) continue;

                            for (const msg of messages) {
                                if (msg.from?.id === igId) break; // hit business reply
                                if (!msg.message?.trim()) continue;

                                const { data: existing } = await adminDb
                                    .from("social_interactions").select("id")
                                    .eq("external_id", msg.id).maybeSingle();
                                if (existing) continue;

                                await adminDb.from("social_interactions").insert({
                                    integration_id: integration.id,
                                    platform: "instagram",
                                    interaction_type: "message",
                                    external_id: msg.id,
                                    sender_id: msg.from?.id,
                                    message: msg.message,
                                    status: "PENDING",
                                    context: {
                                        sender_name: msg.from?.username || msg.from?.name || "Usuário",
                                        page_id: igId,
                                    }
                                });
                                totalSynced++;
                            }
                        }
                    }
                }

                // --- Facebook Messenger DMs ---
                const fbConvRes = await fetch(
                    `${META_GRAPH_URL}/me/conversations?fields=messages{id,message,from,created_time}&access_token=${pageToken}&limit=20`
                );
                const fbConvData = await fbConvRes.json();
                if (!fbConvData.error && fbConvData.data) {
                    for (const conv of fbConvData.data) {
                        const messages = conv.messages?.data || [];
                        if (messages.length === 0) continue;
                        if (messages[0].from?.id === page.id) continue;

                        for (const msg of messages) {
                            if (msg.from?.id === page.id) break;
                            if (!msg.message?.trim()) continue;

                            const { data: existing } = await adminDb
                                .from("social_interactions").select("id")
                                .eq("external_id", msg.id).maybeSingle();
                            if (existing) continue;

                            await adminDb.from("social_interactions").insert({
                                integration_id: integration.id,
                                platform: "facebook",
                                interaction_type: "message",
                                external_id: msg.id,
                                sender_id: msg.from?.id,
                                message: msg.message,
                                status: "PENDING",
                                context: {
                                    sender_name: msg.from?.name || "Usuário",
                                    page_id: page.id,
                                }
                            });
                            totalSynced++;
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error("syncMetaMessages: error for integration", integration.id, e.message);
        }
    }

    revalidatePath("/dashboard/inbox");
    return { success: true, synced: totalSynced };
}
