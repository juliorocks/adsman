"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function getTeamMembers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Não autenticado");
    }

    // Owner checks their own team, but also a member might want to see the team.
    // We will just show the team where the owner_id is the user's id (workspace owner)

    // First, let's see if this user is a workspace owner or what workspace they are using.
    // For now, let's assume the user is managing their own workspace.
    const { data: team, error } = await supabase
        .from('team_members')
        .select(`
            id,
            user_id,
            email,
            role,
            created_at
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao buscar equipe:", error);
        return [];
    }

    return team || [];
}

export async function addTeamMember(email: string, role: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Não autenticado" };
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adsman.vercel.app';
        let targetUser: any = null;

        // Always try invite first:
        // - New user → creates account and sends invite email
        // - Existing but unconfirmed user → re-sends invite email
        // - Existing confirmed user → fails (that's fine, find them via RPC)
        const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${appUrl}/auth/confirm`
        });

        let inviteLink: string | null = null;

        if (!inviteErr) {
            // New or unconfirmed user — invite email sent automatically
            targetUser = inviteData.user;
        } else {
            // User already exists and is confirmed — find via RPC
            const { data: rpcUsers } = await supabaseAdmin.rpc('get_auth_user_by_email', { user_email: email.toLowerCase() });
            targetUser = rpcUsers?.[0] ?? null;
            if (!targetUser) {
                return { success: false, error: `Erro ao convidar usuário: ${inviteErr.message}` };
            }
            // Generate a magic link the admin can share directly (Supabase won't resend invite for confirmed users)
            const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: { redirectTo: `${appUrl}/auth/confirm` }
            });
            inviteLink = linkData?.properties?.action_link ?? null;
        }

        if (targetUser.id === user.id) {
            return { success: false, error: "Você não pode adicionar a si mesmo (você já é o SuperAdmin)." };
        }

        // Add to team (use admin client to bypass RLS on insert)
        const { error: insertError } = await supabaseAdmin
            .from('team_members')
            .insert({
                owner_id: user.id,
                user_id: targetUser.id,
                email: targetUser.email,
                role: role
            });

        if (insertError) {
            if (insertError.code === '23505') {
                return { success: false, error: "Este usuário já está na sua equipe." };
            }
            throw insertError;
        }

        revalidatePath("/dashboard/settings");
        return { success: true, inviteLink };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message || "Erro inesperado ao adicionar o usuário." };
    }
}

export async function removeTeamMember(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Não autenticado" };
    }

    try {
        // RLS will ensure only owner_id can delete this
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id);

        if (error) throw error;

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}
