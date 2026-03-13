"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

export default function AuthConfirmPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        // Supabase browser client automatically reads #access_token from the URL hash
        // and establishes the session in localStorage/cookies
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                setStatus("error");
                setErrorMsg(error.message);
                return;
            }
            if (session) {
                router.replace("/dashboard");
                return;
            }

            // Listen for auth state changes (handles async token exchange)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    subscription.unsubscribe();
                    router.replace("/dashboard");
                } else if (event === "SIGNED_OUT") {
                    subscription.unsubscribe();
                    setStatus("error");
                    setErrorMsg("Link expirado ou inválido. Solicite um novo convite.");
                }
            });
        });
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
                <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                    <BarChart3 className="h-6 w-6 text-white" />
                </div>
                {status === "loading" ? (
                    <>
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                        <p className="text-slate-400 text-sm">Autenticando sua conta...</p>
                    </>
                ) : (
                    <>
                        <p className="text-red-400 font-semibold">Erro de autenticação</p>
                        <p className="text-slate-500 text-sm">{errorMsg}</p>
                        <a href="/login" className="text-primary-400 hover:underline text-sm">
                            Voltar ao login
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
