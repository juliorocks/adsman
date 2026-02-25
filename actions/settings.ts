
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function selectAdAccount(accountId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");

    if (!user && devSession) {
        user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    }

    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: adError } = await supabaseAdmin
            .from("integrations")
            .update({ ad_account_id: accountId })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = adError;
    } else {
        const { error: adError } = await supabase
            .from("integrations")
            .update({ ad_account_id: accountId })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = adError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to update account");
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_ad_account_id", accountId, { httpOnly: true, path: "/" });
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

export async function disconnectMeta() {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");

    if (!user && devSession) {
        user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    }

    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: delError } = await supabaseAdmin
            .from("integrations")
            .delete()
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = delError;
    } else {
        const { error: delError } = await supabase
            .from("integrations")
            .delete()
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = delError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to disconnect");
    }

    // Clear all possible mock/dev cookies
    cookies().delete("dev_meta_token");
    cookies().delete("dev_ad_account_id");

    revalidatePath("/dashboard/settings");
    return { success: true };
}
import { encrypt } from "@/lib/security/vault";

export async function saveOpenAIKey(key: string) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    const encryptedKey = encrypt(key.trim());

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: opError } = await supabaseAdmin
            .from("integrations")
            .upsert({
                user_id: user.id,
                platform: "openai",
                access_token_ref: encryptedKey,
                status: "active",
                updated_at: new Date().toISOString()
            }, {
                onConflict: "user_id,platform"
            });
        error = opError;
    } else {
        const { error: opError } = await supabase
            .from("integrations")
            .upsert({
                user_id: user.id,
                platform: "openai",
                access_token_ref: encryptedKey,
                status: "active",
                updated_at: new Date().toISOString()
            }, {
                onConflict: "user_id,platform"
            });
        error = opError;
    }

    if (error) {
        console.error("Supabase error saving OpenAI key:", error);
        throw new Error(error.message);
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_openai_token", encryptedKey, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function toggleAutonomousMode(enabled: boolean) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let user = supabaseUser;
    const devSession = cookies().get("dev_session");
    if (!user && devSession) user = { id: "de70c0de-ad00-4000-8000-000000000000" } as any;
    if (!user) throw new Error("Unauthorized");

    let error;
    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error: autError } = await supabaseAdmin
            .from("integrations")
            .update({ is_autonomous: enabled })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = autError;
    } else {
        const { error: autError } = await supabase
            .from("integrations")
            .update({ is_autonomous: enabled })
            .eq("user_id", user.id)
            .eq("platform", "meta");
        error = autError;
    }

    if (error) {
        console.error(error);
        throw new Error("Failed to update autonomous mode");
    }

    if (user.id === "de70c0de-ad00-4000-8000-000000000000") {
        cookies().set("dev_is_autonomous", enabled ? "true" : "false", { httpOnly: true, path: "/" });
    }

    revalidatePath("/dashboard/agents");
    return { success: true };
}
