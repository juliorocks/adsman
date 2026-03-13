"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginDev() {
    cookies().set("dev_session", "true", { httpOnly: true, path: "/" });
    redirect("/dashboard");
}

export async function logoutDev() {
    cookies().delete("dev_session");
    cookies().delete("dev_meta_token");
    redirect("/login");
}

export async function logout() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
    } catch (e) { }
    cookies().delete("dev_session");
    cookies().delete("dev_meta_token");
    cookies().delete("active_integration_id");
    redirect("/login");
}

export async function updateProfile(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}
