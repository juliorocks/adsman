
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken, getAdAccounts } from "@/lib/meta/api";
import { encrypt } from "@/lib/security/vault";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        return redirect("/dashboard/settings?error=meta_auth_failed");
    }

    try {
        const supabase = await createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        // Mock User for Dev Mode if Supabase Auth fails
        let user = supabaseUser;

        // Check for dev_session cookie explicitly (works in Production too for this test)
        const { cookies } = await import("next/headers");
        const devSession = cookies().get("dev_session");

        if (!user && (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_MOCK_MODE === "true" || devSession)) {
            console.log("Using Dev Session User");
            user = { id: "mock_user_id_dev", email: "dev@example.com" } as any;
        }

        // IMPORTANT: If user is still null (e.g. prod environment not logged in), force login
        if (!user) {
            console.error("No user found in callback, redirecting to login");
            return redirect("/login");
        }

        // 1. Exchange Code for Long-Lived Token
        let accessToken = "mock_access_token_" + Date.now();

        // Only attempt real exchange if we have valid-looking keys and code isn't our mock
        const appId = process.env.META_APP_ID;
        const isMock = !appId || appId === "your_meta_app_id" || appId === "123456789" || code === "mock_auth_code_dev";

        if (!isMock) {
            accessToken = await exchangeCodeForToken(code);
        }

        // 2. Encrypt Token
        const encryptedToken = encrypt(accessToken);

        // 3. Save Integration (Skip DB if Mock User, use Cookie instead)
        if (user.id !== "mock_user_id_dev") {
            const { error: dbError } = await supabase
                .from("integrations")
                .upsert({
                    user_id: user.id,
                    platform: "meta",
                    access_token_ref: encryptedToken, // In real app, store ID to Vault
                    status: "active",
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id, platform" });

            if (dbError) throw dbError;
        } else {
            console.log("Mock Mode: Saving real token to cookie for session use.");
            // Hack for Dev: Store encrypted token in cookie so we can use it without DB
            const { cookies } = await import("next/headers");
            cookies().set("dev_meta_token", encryptedToken, { httpOnly: true, path: "/" });
        }
    } catch (err) {
        if ((err as Error).message === "NEXT_REDIRECT") throw err;
        console.error("Meta Auth Error:", err);
        return redirect("/dashboard/settings?error=meta_exchange_failed");
    }

    return redirect("/dashboard/settings/select-account");
}
