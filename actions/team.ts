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
        // Need to find the user by email using Admin client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey);

        // Fetch users to find matching email - in V1 this is acceptable, 
        // ideally supabase admin has getUserById, but for email we can list users or use a standard approach.
        // There is supabaseAdmin.auth.admin.getUserById but no getByEmail directly unless using getUser() but that requires JWT.
        // If the user already signed up with that email, they will be in the system.
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
            console.error(usersError);
            return { success: false, error: "Erro interno ao validar e-mail do usuário." };
        }

        const targetUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!targetUser) {
            return {
                success: false,
                error: "Usuário não encontrado. Peça para a pessoa acessar o painel e fazer login pelo menos uma vez antes de adicioná-la à equipe."
            };
        }

        if (targetUser.id === user.id) {
            return { success: false, error: "Você não pode adicionar a si mesmo (você já é o SuperAdmin)." };
        }

        // Add to team
        const { error: insertError } = await supabase
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
        return { success: true };
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
