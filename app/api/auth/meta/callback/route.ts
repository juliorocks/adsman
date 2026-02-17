
import { createClient } from "@/lib/supabase/server";
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

        // Silent support for dev_session to prevent loop
        const devSession = cookies().get("dev_session");
        if (!user && devSession) {
            user = { id: "mock_user_id_dev" } as any;
        }

        if (!user) {
            return redirect("/login");
        }

        // 1. Exchange Code for Long-Lived Token
        const accessToken = await exchangeCodeForToken(code);

        // 2. Encrypt Token
        const encryptedToken = encrypt(accessToken);

        // 3. Save Integration
        if (user.id !== "mock_user_id_dev") {
            const { error: dbError } = await supabase
                .from("integrations")
                .upsert({
                    user_id: user.id,
                    platform: "meta",
                    access_token_ref: encryptedToken,
                    status: "active",
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id, platform" });

            if (dbError) throw dbError;
        } else {
            // Store real token in cookie for dev user session
            cookies().set("dev_meta_token", encryptedToken, { httpOnly: true, path: "/" });
        }

    } catch (err) {
        if ((err as Error).message === "NEXT_REDIRECT") throw err;
        console.error("Meta Auth Error:", err);
        return redirect("/dashboard/settings?error=meta_exchange_failed");
    }

    return redirect("/dashboard/settings/select-account");
}
