import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
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
                return {
                    id: "mock_int_real",
                    user_id: MOCK_USER_ID,
                    platform: "meta",
                    status: "active",
                    ad_account_id: selectedAccountId || null,
                    access_token_ref: devToken,
                    updated_at: new Date().toISOString()
                };
            }
            return null;
        }

        if (!supabase) return null;

        const { data, error } = await supabase
            .from("integrations")
            .select("*")
            .eq("user_id", user.id)
            .eq("platform", "meta")
            .single();

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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("[getGoogleIntegration] No user found");
            return null;
        }

        const { data, error } = await supabase
            .from("integrations")
            .select("*")
            .eq("user_id", user.id)
            .eq("platform", "google")
            .single();

        if (error) {
            console.log("[getGoogleIntegration] Query error:", error.message);
            return null;
        }

        console.log("[getGoogleIntegration] Found integration for user:", user.id);
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
export async function getOpenAIKey() {
    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        let user = supabaseUser;
        try {
            const devSession = cookies().get("dev_session");
            if (!user && devSession) user = { id: "mock_user_id_dev" } as any;
        } catch (e) { }
        if (!user) return process.env.OPENAI_API_KEY || null;

        let encryptedKey: string | null = null;

        if (user.id === "mock_user_id_dev") {
            try {
                encryptedKey = cookies().get("dev_openai_token")?.value || null;
            } catch (e) { }
        } else {
            const { data } = await supabase
                .from("integrations")
                .select("access_token_ref")
                .eq("user_id", user.id)
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
            if (!user && devSession) user = { id: "mock_user_id_dev" } as any;
        } catch (e) { }
        if (!user) return process.env.MODAL_API_KEY || null;

        let encryptedKey: string | null = null;

        if (user.id === "mock_user_id_dev") {
            try {
                encryptedKey = cookies().get("dev_modal_token")?.value || null;
            } catch (e) { }
        } else {
            const { data } = await supabase
                .from("integrations")
                .select("access_token_ref")
                .eq("user_id", user.id)
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
