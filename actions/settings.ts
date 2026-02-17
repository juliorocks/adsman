
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function selectAdAccount(accountId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    // Support Mock User
    let user = supabaseUser;
    if (!user && (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_MOCK_MODE === "true")) {
        // We check for the cookie set by loginDev, but for actions we might just assume if env is dev
        // For safety, let's assume we are okay in dev.
        user = { id: "mock_user_id_dev" } as any;
    }

    if (!user) throw new Error("Unauthorized");

    if (user.id !== "mock_user_id_dev") {
        const { error } = await supabase
            .from("integrations")
            .update({ ad_account_id: accountId })
            .eq("user_id", user.id)
            .eq("platform", "meta");

        if (error) {
            console.error(error);
            throw new Error("Failed to update account");
        }
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
