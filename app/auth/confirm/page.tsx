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
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1)); // remove o #
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
            // Processa o token do hash diretamente (invite, magic link, etc.)
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                .then(({ data, error }) => {
                    if (error || !data.session) {
                        setStatus("error");
                        setErrorMsg(error?.message || "Sessão inválida. O link pode ter expirado.");
                    } else {
                        router.replace("/dashboard");
                    }
                });
        } else {
            // Sem hash — verifica se já existe sessão ativa
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    router.replace("/dashboard");
                } else {
                    setStatus("error");
                    setErrorMsg("Link inválido ou expirado. Solicite um novo acesso ao administrador.");
                }
            });
        }
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
