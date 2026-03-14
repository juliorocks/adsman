import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/security/vault";
import { getAdAccounts, AdAccount } from "@/lib/meta/api";

const MOCK_USER_ID = "de70c0de-ad00-4000-8000-000000000000";

export async function getCurrentUserId(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) return data.user.id;
    } catch (e) { }

    try {
        const devSession = cookies().get("dev_session");
        if (devSession) return MOCK_USER_ID;
    } catch (e) { }

    return null;
}

/**
 * Returns the workspace owner's user_id for the given user.
 * If the user is a team member, returns their owner's id.
 * If the user is an owner (or solo user), returns their own id.
 */
export async function getWorkspaceOwnerId(userId: string): Promise<string> {
    if (userId === MOCK_USER_ID) return userId;
    try {
        const adminClient = createAdminClient();
        const { data } = await adminClient
            .from('team_members')
            .select('owner_id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();
        return data?.owner_id || userId;
    } catch {
        return userId;
    }
}

/**
 * Convenience: resolves the effective workspace owner id for the current user.
 * Use this anywhere you need to scope data to the workspace (integrations, knowledge, etc.)
 */
export async function getEffectiveUserId(): Promise<string | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return getWorkspaceOwnerId(userId);
}

export async function getIntegration() {
    try {
        let supabase;
        let supabaseUser = null;

        try {
            supabase = await createClient();
            const { data } = await supabase.auth.getUser();
            supabaseUser = data?.user;
        } catch (e) {
            // Suppress errors if createClient fails (e.g. cookies unavailable)
            // console.error("Auth error in getIntegration:", e);
        }

        let user = supabaseUser;
        let devSession = null;
        try {
            devSession = cookies().get("dev_session");
        } catch (e) { }

        if (!user && devSession) {
            user = { id: MOCK_USER_ID } as any;
        }

        if (!user) return null;

        if (user.id === MOCK_USER_ID) {
            const devToken = cookies().get("dev_meta_token")?.value;
            const selectedAccountId = cookies().get("dev_ad_account_id")?.value;

            if (devToken) {
                // Try to find the real record in DB for this MOCK_USER and platform Meta
                const adminClient = createAdminClient();
                const { data: dbInt } = await adminClient
                    .from("integrations")
                    .select("*")
                    .eq("user_id", MOCK_USER_ID)
                    .eq("platform", "meta")
                    .single();

                return {
                    id: dbInt?.id || "mock_int_real",
                    user_id: MOCK_USER_ID,
                    platform: "meta",
                    status: "active",
                    ad_account_id: selectedAccountId || dbInt?.ad_account_id || null,
                    access_token_ref: devToken,
                    updated_at: new Date().toISOString(),
                    agent_context: dbInt?.agent_context || null
                };
            }
            return null;
        }

        if (!supabase) return null;

        // Resolve workspace owner so team members see the admin's integration
        const ownerId = await getWorkspaceOwnerId(user.id);
        const adminCl = createAdminClient();

        // If a specific client is selected (via cookie), use that integration
        let activeIntegrationId: string | null = null;
        try {
            activeIntegrationId = cookies().get("active_integration_id")?.value || null;
        } catch (e) { }

        let query = adminCl
            .from("integrations")
            .select("*")
            .eq("user_id", ownerId)
            .eq("platform", "meta")
            .eq("status", "active");

        if (activeIntegrationId) {
            query = query.eq("id", activeIntegrationId) as any;
        }

        const { data, error } = await (query as any)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("getIntegration query error:", error);
            return null;
        }

        return data;
    } catch (err) {
        console.error("getIntegration unexpected error:", err);
        return null;
    }
}

export async function getGoogleIntegration() {
    try {
        const rawUserId = await getCurrentUserId();
        if (!rawUserId) {
            console.log("[getGoogleIntegration] No userId found");
            return null;
        }
        const userId = await getWorkspaceOwnerId(rawUserId);

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("integrations")
            .select("*")
            .eq("user_id", userId)
            .eq("platform", "google")
            .single();

        if (error) {
            console.log("[getGoogleIntegration] Query error:", error.message);
            return null;
        }

        console.log("[getGoogleIntegration] Found Google integration for user:", userId);
        return data;
    } catch (err) {
        console.error("[getGoogleIntegration] Unexpected error:", err);
        return null;
    }
}

export async function getAvailableAdAccounts(): Promise<AdAccount[]> {
    const integration = await getIntegration();
    if (!integration || !integration.access_token_ref) return [];

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const accounts = await getAdAccounts(accessToken);
        return accounts;
    } catch (error) {
        console.error("Failed to fetch ad accounts", error);
        return [];
    }
}

/** Returns only the integrations visible to the current user (respects member permissions). */
export async function getVisibleIntegrations(): Promise<{ id: string; client_name: string | null; ad_account_id: string | null }[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const adminClient = createAdminClient();
        const effectiveOwnerId = await getWorkspaceOwnerId(userId);

        const { data } = await adminClient
            .from("integrations")
            .select("id, client_name, ad_account_id")
            .eq("user_id", effectiveOwnerId)
            .eq("platform", "meta")
            .eq("status", "active")
            .order("client_name");

        let integrations = data || [];

        // For members: filter by allowed_integration_ids (NULL = no access)
        if (userId !== effectiveOwnerId && userId !== MOCK_USER_ID) {
            const { data: memberData } = await adminClient
                .from("team_members")
                .select("allowed_integration_ids")
                .eq("user_id", userId)
                .maybeSingle();
            const allowed = memberData?.allowed_integration_ids;
            if (allowed === null || allowed === undefined) {
                return [];
            }
            integrations = integrations.filter((i: any) => allowed.includes(i.id));
        }

        return integrations;
    } catch (e) {
        console.error("getVisibleIntegrations error:", e);
        return [];
    }
}
export async function getOpenAIKey() {
    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        let user = supabaseUser;
        try {
            const devSession = cookies().get("dev_session");
            if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
        } catch (e) { }
        if (!user) return process.env.OPENAI_API_KEY || null;

        let encryptedKey: string | null = null;

        if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
            try {
                const adminClient = createAdminClient();
                const { data } = await adminClient
                    .from("integrations")
                    .select("access_token_ref")
                    .eq("user_id", user.id)
                    .eq("platform", "openai")
                    .single();
                encryptedKey = data?.access_token_ref || null;
            } catch (e) {
                // fallback to cookie if DB fails
                encryptedKey = cookies().get("dev_openai_token")?.value || null;
            }
        } else {
            const ownerId = await getWorkspaceOwnerId(user.id);
            const adminCl = createAdminClient();
            const { data } = await adminCl
                .from("integrations")
                .select("access_token_ref")
                .eq("user_id", ownerId)
                .eq("platform", "openai")
                .single();

            encryptedKey = data?.access_token_ref || null;
        }

        if (!encryptedKey) return process.env.OPENAI_API_KEY || null;

        try {
            return decrypt(encryptedKey);
        } catch (e) {
            return process.env.OPENAI_API_KEY || null;
        }
    } catch (err) {
        console.error("getOpenAIKey unexpected error:", err);
        return process.env.OPENAI_API_KEY || null;
    }
}
export async function getModalKey() {
    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        let user = supabaseUser;
        try {
            const devSession = cookies().get("dev_session");
            if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
        } catch (e) { }
        if (!user) return process.env.MODAL_API_KEY || null;

        let encryptedKey: string | null = null;

        if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
            try {
                const adminClient = createAdminClient();
                const { data } = await adminClient
                    .from("integrations")
                    .select("access_token_ref")
                    .eq("user_id", user.id)
                    .eq("platform", "modal")
                    .single();
                encryptedKey = data?.access_token_ref || null;
            } catch (e) {
                encryptedKey = cookies().get("dev_modal_token")?.value || null;
            }
        } else {
            const ownerId = await getWorkspaceOwnerId(user.id);
            const adminCl = createAdminClient();
            const { data } = await adminCl
                .from("integrations")
                .select("access_token_ref")
                .eq("user_id", ownerId)
                .eq("platform", "modal")
                .single();

            encryptedKey = data?.access_token_ref || null;
        }

        if (!encryptedKey) return process.env.MODAL_API_KEY || null;

        try {
            return decrypt(encryptedKey);
        } catch (e) {
            return process.env.MODAL_API_KEY || null;
        }
    } catch (err) {
        console.error("getModalKey unexpected error:", err);
        return process.env.MODAL_API_KEY || null;
    }
}

export async function getPollinationsKey() {
    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        let user = supabaseUser;
        try {
            const devSession = cookies().get("dev_session");
            if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
        } catch (e) { }

        // Always try env first if no user or no integration
        if (!user) return process.env.POLLINATIONS_API_KEY || null;

        let encryptedKey: string | null = null;

        if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
            try {
                const adminClient = createAdminClient();
                const { data } = await adminClient
                    .from("integrations")
                    .select("access_token_ref")
                    .eq("user_id", user.id)
                    .eq("platform", "pollinations")
                    .single();
                encryptedKey = data?.access_token_ref || null;
            } catch (e) {
                encryptedKey = cookies().get("dev_pollinations_token")?.value || null;
            }
        } else {
            const ownerId = await getWorkspaceOwnerId(user.id);
            const adminCl = createAdminClient();
            const { data } = await adminCl
                .from("integrations")
                .select("access_token_ref")
                .eq("user_id", ownerId)
                .eq("platform", "pollinations")
                .single();

            encryptedKey = data?.access_token_ref || null;
        }

        if (!encryptedKey) return process.env.POLLINATIONS_API_KEY || null;

        try {
            return decrypt(encryptedKey);
        } catch (e) {
            return process.env.POLLINATIONS_API_KEY || null;
        }
    } catch (err) {
        console.error("getPollinationsKey unexpected error:", err);
        return process.env.POLLINATIONS_API_KEY || null;
    }
}
