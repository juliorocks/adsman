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
            console.error("Meta Auth Error: State decryption failed or userId missing");
            return redirect("/login?error=meta_session_expired");
        }

        // 1. Exchange Code for Long-Lived Token
        const origin = new URL(request.url).origin;
        const redirectUri = `${origin}/api/auth/meta/callback`;

        let accessToken;
        try {
            accessToken = await exchangeCodeForToken(code, redirectUri);
        } catch (tokenErr) {
            console.error("Meta Token Exchange Error:", tokenErr);
            const msg = encodeURIComponent((tokenErr as Error).message || "token_exchange_failed");
            return redirect(`/dashboard/settings?error=meta_exchange_failed&details=${msg}`);
        }

        // 2. Encrypt Token
        const encryptedToken = encrypt(accessToken);

        // 3. INSERT a new integration row (one per client — no longer overwrite existing)
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        const { data: newIntegration, error: dbError } = await supabaseAdmin
            .from("integrations")
            .insert({
                user_id: userId,
                platform: "meta",
                access_token_ref: encryptedToken,
                status: "pending_setup",
                updated_at: new Date().toISOString()
            })
            .select("id")
            .single();

        if (dbError) {
            console.error("Meta DB Insert Error:", dbError);
            throw dbError;
        }

        // 4. Store the new integration ID so select-account page knows which one to configure
        cookies().set("pending_integration_id", newIntegration.id, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 // 1 hour — user must complete setup or it expires
        });

        // Keep cookie strictly for dev UI edge cases if needed (Mock User)
        if (userId === "de70c0de-ad00-4000-8000-000000000000") {
            try {
                cookies().set("dev_meta_token", encryptedToken, { httpOnly: true, path: "/" });
            } catch (e) { }
        }

    } catch (err) {
        if ((err as Error).message === "NEXT_REDIRECT") throw err;
        console.error("Meta Auth Catch All Error:", err);
        const errorMsg = encodeURIComponent((err as Error).message || "unknown");
        return redirect(`/dashboard/settings?error=meta_exchange_failed&details=${errorMsg}`);
    }

    return redirect("/dashboard/settings/select-account");
}
