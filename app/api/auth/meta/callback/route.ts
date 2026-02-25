
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { exchangeCodeForToken } from "@/lib/meta/api";
import { encrypt } from "@/lib/security/vault";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        return redirect("/dashboard/settings?error=meta_auth_failed");
    }

    try {
        const supabase = await createClient();
        let { data: { user } } = await supabase.auth.getUser();

        // Support for dev_session with real mock UUID to allow DB writes for webhooks
        const devSession = cookies().get("dev_session");
        if (!user && devSession) {
            user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
        }

        if (!user) {
            return redirect("/login");
        }

        // 1. Exchange Code for Long-Lived Token
        const accessToken = await exchangeCodeForToken(code);

        // 2. Encrypt Token
        const encryptedToken = encrypt(accessToken);

        // 3. Save Integration bypassing RLS if dev user
        let dbError;
        if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
            const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            const { error } = await supabaseAdmin
                .from("integrations")
                .upsert({
                    user_id: user.id,
                    platform: "meta",
                    access_token_ref: encryptedToken,
                    status: "active",
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id, platform" });
            dbError = error;
        } else {
            const { error } = await supabase
                .from("integrations")
                .upsert({
                    user_id: user.id,
                    platform: "meta",
                    access_token_ref: encryptedToken,
                    status: "active",
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id, platform" });
            dbError = error;
        }

        if (dbError) throw dbError;

        // Keep cookie strictly for dev UI edge cases if needed
        if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
            cookies().set("dev_meta_token", encryptedToken, { httpOnly: true, path: "/" });
        }

    } catch (err) {
        if ((err as Error).message === "NEXT_REDIRECT") throw err;
        console.error("Meta Auth Error:", err);
        return redirect("/dashboard/settings?error=meta_exchange_failed");
    }

    return redirect("/dashboard/settings/select-account");
}
