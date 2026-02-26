"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginDev } from "@/actions/auth";
import { Facebook, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleFacebookLogin = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'email,ads_management,ads_read,business_management,pages_show_list,pages_manage_metadata,pages_read_engagement,pages_messaging,instagram_basic,instagram_manage_comments,instagram_manage_messages'
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(`Erro ao conectar: ${error.message}`);
            setLoading(false);
        }
    };

    const handleDevLogin = async () => {
        setLoading(true);
        await loginDev();
        // Redirect is handled inside loginDev action typically
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Zap className="h-8 w-8 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">ADS.AI</h1>
                <p className="text-slate-400 text-sm mb-8 px-4">Faça login com sua conta do Facebook. Nós já conectaremos suas Páginas, BM e Instagram automaticamente.</p>

                <div className="space-y-4">
                    <button
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        <Facebook className="h-5 w-5 fill-current" />
                        {loading ? "Conectando..." : "Entrar com Facebook"}
                    </button>

                    <div className="pt-6 mt-6 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-bold">Modo Desenvolvedor</p>
                        <Button
                            variant="outline"
                            onClick={handleDevLogin}
                            disabled={loading}
                            className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
                        >
                            Entrar como Teste Sisiático
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
