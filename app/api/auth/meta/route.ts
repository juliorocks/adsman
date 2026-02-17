import { getAuthUrl } from "@/lib/meta/api";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
    // Generate state for CSRF protection
    const state = randomBytes(16).toString("hex");

    // In a real app, we should store this state in a cookie or session to verify on callback
    // For now, we'll just pass it through.

    // Check for real or placeholder credentials
    const appId = process.env.META_APP_ID;
    const isMock = !appId || appId === "your_meta_app_id" || appId === "123456789";

    if (isMock) {
        // Simulate successful redirect
        return redirect("/api/auth/meta/callback?code=mock_auth_code_dev");
    }

    const url = getAuthUrl(state);

    return redirect(url);
}
