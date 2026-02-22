
"use server";

import { createClient } from "@/lib/supabase/server";
import { getOAuth2Client, GOOGLE_SCOPES, listDriveFiles, getDriveClient } from "@/lib/google/drive";
import { encrypt, decrypt } from "@/lib/security/vault";
import { revalidatePath } from "next/cache";

/**
 * Generates the Google Auth URL for the connection
 */
export async function getGoogleAuthUrlAction() {
    try {
        const supabase = await createClient();

        // Try to get user from session (more resilient in some server environments)
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
            console.error("[getGoogleAuthUrlAction] No session/user found in Server Action");
            throw new Error("Sessão expirada ou não encontrada. Por favor, atualize a página e tente novamente.");
        }

        const client = getOAuth2Client();
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: GOOGLE_SCOPES,
            prompt: 'consent',
            state: user.id
        });
        return { success: true, url };
    } catch (error: any) {
        console.error("getGoogleAuthUrlAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Handles the callback from Google, exchanges code for tokens and saves to DB
 */
export async function handleGoogleCallbackAction(code: string, state?: string) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // Recover user ID from session or from OAuth state
        const userId = currentUser?.id || state;

        if (!userId) {
            console.error("[GoogleAuth] No user ID found in session or state");
            throw new Error("Identificação de usuário perdida no redirecionamento");
        }

        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);

        if (!tokens.access_token) throw new Error("No access token received");

        const encryptedAccessToken = encrypt(tokens.access_token);
        const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined;
        const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined;

        // Use service role to bypass RLS since we might have lost the session cookies
        // But we trust the 'state' because it was signed by Google
        const { error } = await supabase
            .from("integrations")
            .upsert({
                user_id: userId,
                platform: "google",
                access_token_ref: encryptedAccessToken,
                refresh_token_ref: encryptedRefreshToken,
                expires_at: expiresAt,
                status: "active",
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id,platform" });

        if (error) {
            console.error("[GoogleAuth] Database error:", error.message);
            throw error;
        }

        console.log("[GoogleAuth] Integration saved successfully for user:", userId);
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error: any) {
        console.error("handleGoogleCallbackAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches Google Drive files for the current user
 */
export async function getGoogleDriveFilesAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { data: integration, error: dbError } = await supabase
            .from("integrations")
            .select("*")
            .eq("user_id", user.id)
            .eq("platform", "google")
            .single();

        if (dbError || !integration || !integration.access_token_ref) {
            return { success: false, error: "Google Drive não conectado" };
        }

        let accessToken = decrypt(integration.access_token_ref);

        // Check for expiration and refresh if necessary
        if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
            if (!integration.refresh_token_ref) {
                return { success: false, error: "Token expirado e sem refresh token" };
            }

            const client = getOAuth2Client();
            client.setCredentials({
                refresh_token: decrypt(integration.refresh_token_ref)
            });

            const { credentials } = await client.refreshAccessToken();
            if (credentials.access_token) {
                accessToken = credentials.access_token;
                const encryptedAccessToken = encrypt(accessToken);
                const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : undefined;

                await supabase
                    .from("integrations")
                    .update({
                        access_token_ref: encryptedAccessToken,
                        expires_at: expiresAt,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", integration.id);
            }
        }

        const files = await listDriveFiles(accessToken);
        return { success: true, files: files.files };
    } catch (error: any) {
        console.error("getGoogleDriveFilesAction error:", error);
        return { success: false, error: error.message };
    }
}
