
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Salva o cliente (integration_id) ativo em cookie para que o Inbox filtre pelo cliente correto
export async function selectClient(integrationId: string) {
    cookies().set("active_integration_id", integrationId, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 dias
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inbox");
    redirect("/dashboard");
}

// Retorna o integration_id do cliente ativo no cookie ou o padrão do usuário logado
export async function getActiveIntegrationId(): Promise<string | null> {
    return cookies().get("active_integration_id")?.value || null;
}


// Finalizes a pending Meta integration: sets client_name, ad_account_id, and marks as active.
// Called from the select-account page after OAuth.
export async function finalizeIntegration(integrationId: string, accountId: string, clientName: string) {
    console.log(`[finalizeIntegration] Starting: integrationId=${integrationId}, accountId=${accountId}, clientName=${clientName}`);

    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;

    console.log(`[finalizeIntegration] User ID: ${user?.id || 'NULL'}`);
    if (!user) throw new Error("Unauthorized - No user found");

    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`[finalizeIntegration] Updating integration record...`);

    // Get the pending integration's access token before potentially deleting it
    const { data: pendingInteg } = await supabaseAdmin
        .from("integrations")
        .select("access_token_ref")
        .eq("id", integrationId)
        .single();

    // Find ALL existing integrations with this ad_account_id (handles duplicates from prior reconnects)
    // Keep the oldest one (most likely to have social_interactions history), delete the rest
    const { data: existingIntegs } = await supabaseAdmin
        .from("integrations")
        .select("id, created_at")
        .eq("user_id", user.id)
        .eq("platform", "meta")
        .eq("ad_account_id", accountId)
        .neq("id", integrationId)
        .order("created_at", { ascending: true });

    if (existingIntegs && existingIntegs.length > 0) {
        const keeper = existingIntegs[0]; // oldest = the one with comment/message history
        const duplicateIds = existingIntegs.slice(1).map((i: any) => i.id);

        console.log(`[finalizeIntegration] Reusing integration ${keeper.id}, removing ${duplicateIds.length} duplicate(s) + pending ${integrationId}`);

        // Update the keeper with the new token and re-activate
        const { error } = await supabaseAdmin
            .from("integrations")
            .update({
                access_token_ref: pendingInteg?.access_token_ref,
                client_name: clientName,
                status: "active",
                updated_at: new Date().toISOString()
            })
            .eq("id", keeper.id);

        if (error) throw new Error("Falha ao reatualizar integração: " + error.message);

        // Delete duplicates and the pending integration
        const toDelete = [...duplicateIds, integrationId];
        await supabaseAdmin.from("integrations").delete().in("id", toDelete);

        integrationId = keeper.id;
    } else {
        try {
            const { error, data } = await supabaseAdmin
                .from("integrations")
                .upsert({
                    id: integrationId,
                    user_id: user.id,
                    platform: "meta",
                    ad_account_id: accountId,
                    client_name: clientName,
                    status: "active",
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: "id"
                })
                .select();

            console.log(`[finalizeIntegration] Upsert response: error=${error ? error.message : 'NONE'}, rowsAffected=${data?.length || 0}`);

            if (error) {
                console.error("[finalizeIntegration] Database error:", error);
                throw new Error("Falha ao salvar integração: " + error.message);
            }

            if (!data || data.length === 0) {
                console.warn("[finalizeIntegration] No rows updated - integration may not exist or user mismatch");
                throw new Error("Integração não encontrada ou acesso negado");
            }
        } catch (err: any) {
            console.error("[finalizeIntegration] Exception:", err.message);
            throw err;
        }
    }

    // Clear pending setup cookie
    cookies().delete("pending_integration_id");

    // Set this as the active integration (switches the dashboard to this client)
    cookies().set("active_integration_id", integrationId, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30
    });

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_ad_account_id", accountId, { httpOnly: true, path: "/" });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inbox");
    redirect("/dashboard");
}

// Legacy: keeps the ability to switch ad account within an existing integration
export async function selectAdAccount(accountId: string, _formData: FormData) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    // Update only the currently active integration, not all meta integrations
    const activeIntegrationId = cookies().get("active_integration_id")?.value;
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let queryBuilder = supabaseAdmin
        .from("integrations")
        .update({ ad_account_id: accountId })
        .eq("user_id", user.id)
        .eq("platform", "meta");

    if (activeIntegrationId) {
        queryBuilder = (queryBuilder as any).eq("id", activeIntegrationId);
    }

    const { error } = await queryBuilder;

    if (error) {
        console.error(error);
        throw new Error("Failed to update account");
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_ad_account_id", accountId, { httpOnly: true, path: "/" });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inbox");
    redirect("/dashboard");
}

export async function disconnectMeta() {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");

    if (!user && devSession) {
        user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    }

    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: delError } = await supabaseAdmin
            .from("integrations")
            .update({ status: "inactive" })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = delError;
    } else {
        const { error: delError } = await supabase
            .from("integrations")
            .update({ status: "inactive" })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = delError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to disconnect");
    }

    // Clear all possible mock/dev cookies + cliente ativo
    cookies().delete("dev_meta_token");
    cookies().delete("dev_ad_account_id");
    cookies().delete("active_integration_id");

    // Invalida cache de TODAS as páginas — o dashboard deve mostrar zero imediatamente
    revalidatePath("/dashboard", "layout");

    return { success: true };
}
import { encrypt } from "@/lib/security/vault";

export async function saveOpenAIKey(key: string) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    const encryptedKey = encrypt(key.trim());

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: opError } = await supabaseAdmin
            .from("integrations")
            .upsert({
                user_id: user.id,
                platform: "openai",
                access_token_ref: encryptedKey,
                status: "active",
                updated_at: new Date().toISOString()
            }, {
                onConflict: "user_id,platform"
            });
        error = opError;
    } else {
        const { error: opError } = await supabase
            .from("integrations")
            .upsert({
                user_id: user.id,
                platform: "openai",
                access_token_ref: encryptedKey,
                status: "active",
                updated_at: new Date().toISOString()
            }, {
                onConflict: "user_id,platform"
            });
        error = opError;
    }

    if (error) {
        console.error("Supabase error saving OpenAI key:", error);
        throw new Error(error.message);
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_openai_token", encryptedKey, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function toggleAutonomousMode(enabled: boolean) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: autError } = await supabaseAdmin
            .from("integrations")
            .update({ is_autonomous: enabled })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = autError;
    } else {
        const { error: autError } = await supabase
            .from("integrations")
            .update({ is_autonomous: enabled })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = autError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to update autonomous mode");
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_is_autonomous", enabled ? "true" : "false", { httpOnly: true, path: "/" });
    }

    revalidatePath("/dashboard/agents");
    return { success: true };
}

export async function saveAgentContext(integrationId: string, context: string) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: autError } = await supabaseAdmin
            .from("integrations")
            .update({ agent_context: context })
            .eq("id", integrationId)
            .eq("user_id", user.id);
        error = autError;
    } else {
        const { error: autError } = await supabase
            .from("integrations")
            .update({ agent_context: context })
            .eq("id", integrationId)
            .eq("user_id", user.id);
        error = autError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to save agent context");
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true };
}
