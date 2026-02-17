
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/security/vault";
import { getAdAccounts, AdAccount } from "@/lib/meta/api";

import { cookies } from "next/headers";

export async function getIntegration() {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;

    // Check for dev_session cookie even in production for test mode
    const devSession = cookies().get("dev_session");

    if (!user && (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_MOCK_MODE === "true" || devSession)) {
        user = { id: "mock_user_id_dev", email: "dev@example.com" } as any;
    }

    if (!user) return null;

    if (user.id === "mock_user_id_dev") {
        // Try to get real token from cookie first
        const devToken = cookies().get("dev_meta_token")?.value;

        if (devToken) {
            return {
                id: "mock_int_real",
                user_id: "mock_user_id_dev",
                platform: "meta",
                status: "active",
                ad_account_id: "act_mock_123", // Can be updated by selection
                access_token_ref: devToken,
                updated_at: new Date().toISOString()
            };
        }

        return {
            id: "mock_int_1",
            user_id: "mock_user_id_dev",
            platform: "meta",
            status: "active",
            ad_account_id: "act_mock_123", // Default mock account
            // Format: iv(24):tag(32):content
            access_token_ref: "000000000000000000000000:00000000000000000000000000000000:mock_encrypted_content",
            updated_at: new Date().toISOString()
        };
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

    // Skip decryption ONLY for the default mock integration
    if (integration.id === "mock_int_1") {
        console.log("Using Mock Ad Accounts");
        return [{
            id: "act_mock_123",
            name: "Conta de Anúncios Mock",
            account_id: "act_mock_123",
            currency: "BRL"
        }];
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        console.log("Decrypted Token for Ad Accounts:", accessToken ? "Token exists (hidden)" : "No token");

        const accounts = await getAdAccounts(accessToken);
        console.log("Fetched Ad Accounts:", JSON.stringify(accounts));

        return accounts;
    } catch (error) {
        console.error("Failed to fetch ad accounts", error);
        return [];
    }
}
