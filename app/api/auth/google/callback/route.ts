
import { handleGoogleCallbackAction } from "@/actions/google-drive";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error || !code) {
        console.error("Google Auth Error from URL:", error);
        return redirect("/dashboard/settings?error=google_auth_failed");
    }

    let redirectUrl = "/dashboard/settings?success=google_connected&refresh=" + Date.now();

    try {
        const result = await handleGoogleCallbackAction(code, state || undefined);
        if (!result.success) {
            console.error("Google Callback Action Failed:", result.error);
            redirectUrl = `/dashboard/settings?error=google_db_error&msg=${encodeURIComponent(result.error || '')}`;
        }
    } catch (err: any) {
        // Only override if it wasn't already set by a redirect throw (though results are handled above)
        console.error("Google Callback Route Error:", err);
        redirectUrl = `/dashboard/settings?error=google_exchange_failed&msg=${encodeURIComponent(err.message)}`;
    }

    return redirect(redirectUrl);
}
