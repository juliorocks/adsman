import { createClient as createAdminClient } from "@supabase/supabase-js";
import { exchangeCodeForToken } from "@/lib/meta/api";
import { encrypt, decrypt } from "@/lib/security/vault";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error || !code || !state) {
        return redirect("/dashboard/settings?error=meta_auth_failed");
    }

    try {
        const userId = decrypt(state);

        if (!userId) {
            return redirect("/login");
        }

        // 1. Exchange Code for Long-Lived Token
        const origin = new URL(request.url).origin;
        const redirectUri = `${origin}/api/auth/meta/callback`;
        const accessToken = await exchangeCodeForToken(code, redirectUri);

        // 2. Encrypt Token
        const encryptedToken = encrypt(accessToken);

        // 3. Save Integration seamlessly and completely avoiding RLS restrictions or cookie drops
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: dbError } = await supabaseAdmin
            .from("integrations")
            .upsert({
                user_id: userId,
                platform: "meta",
                access_token_ref: encryptedToken,
                status: "active",
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id, platform" });

        if (dbError) throw dbError;

        // Keep cookie strictly for dev UI edge cases if needed
        if (userId === "de70c0de-ad00-4000-8000-000000000000") {
            try {
                cookies().set("dev_meta_token", encryptedToken, { httpOnly: true, path: "/" });
            } catch (e) { }
        }

    } catch (err) {
        if ((err as Error).message === "NEXT_REDIRECT") throw err;
        console.error("Meta Auth Error:", err);
        return redirect("/dashboard/settings?error=meta_exchange_failed");
    }

    return redirect("/dashboard/settings/select-account");
}
