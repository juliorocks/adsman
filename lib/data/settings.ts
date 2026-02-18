
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/security/vault";
import { getAdAccounts, AdAccount } from "@/lib/meta/api";
import { cookies } from "next/headers";

export async function getIntegration() {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");

    if (!user && devSession) {
        user = { id: "mock_user_id_dev" } as any;
    }

    if (!user) return null;

    if (user.id === "mock_user_id_dev") {
        const devToken = cookies().get("dev_meta_token")?.value;
        const selectedAccountId = cookies().get("dev_ad_account_id")?.value;

        if (devToken) {
            return {
                id: "mock_int_real",
                user_id: "mock_user_id_dev",
                platform: "meta",
                status: "active",
                ad_account_id: selectedAccountId || null,
                access_token_ref: devToken,
                updated_at: new Date().toISOString()
            };
        }
        return null;
    }

    const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "meta")
        .single();

    return data;
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
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "mock_user_id_dev" } as any;
    if (!user) return null;

    let encryptedKey: string | null = null;

    if (user.id === "mock_user_id_dev") {
        encryptedKey = cookies().get("dev_openai_token")?.value || null;
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
        return null;
    }
}
export async function getModalKey() {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "mock_user_id_dev" } as any;
    if (!user) return null;

    let encryptedKey: string | null = null;

    if (user.id === "mock_user_id_dev") {
        encryptedKey = cookies().get("dev_modal_token")?.value || null;
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
        return null;
    }
}
