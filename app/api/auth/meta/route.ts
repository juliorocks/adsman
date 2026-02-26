import { getAuthUrl } from "@/lib/meta/api";
import { getCurrentUserId } from "@/lib/data/settings";
import { encrypt } from "@/lib/security/vault";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const userId = await getCurrentUserId();
    const origin = new URL(request.url).origin;

    if (!userId) {
        return Response.redirect(`${origin}/login?error=not_logged_in_for_meta`);
    }

    // Encrypt the userId to act as the state string so we persist it through the cross-site redirect
    const state = encrypt(userId);

    const appId = process.env.META_APP_ID;

    // Safety check: Don't allow auth if app credentials are missing
    if (!appId || appId === "your_meta_app_id" || appId === "123456789") {
        return Response.json({ error: "Configuração da Meta ausente (App ID não configurado)" }, { status: 500 });
    }

    const redirectUri = `${origin}/api/auth/meta/callback`;
    const url = getAuthUrl(state, redirectUri);

    return Response.redirect(url);
}
