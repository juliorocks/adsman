
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginDev() {
    cookies().set("dev_session", "true", { httpOnly: true, path: "/" });
    redirect("/dashboard");
}

export async function logoutDev() {
    cookies().delete("dev_session");
    cookies().delete("dev_meta_token");
    redirect("/login");
}
