
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/security/vault";
import { getAdAccounts, AdAccount } from "@/lib/meta/api";

export async function getIntegration() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

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
