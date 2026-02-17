
import { getAuthUrl } from "@/lib/meta/api";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Generate state for CSRF protection
    const state = randomBytes(16).toString("hex");

    const appId = process.env.META_APP_ID;

    // Safety check: Don't allow auth if app credentials are missing
    if (!appId || appId === "your_meta_app_id" || appId === "123456789") {
        return Response.json({ error: "Configuração da Meta ausente (App ID não configurado)" }, { status: 500 });
    }

    const url = getAuthUrl(state);

    return Response.redirect(url);
}
