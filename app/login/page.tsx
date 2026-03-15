"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Facebook, Zap, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleFacebookLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
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

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message === "Invalid login credentials"
                ? "Email ou senha incorretos."
                : `Erro: ${error.message}`
            );
        } finally {
            setLoading(false);
        }
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
                <p className="text-slate-400 text-sm mb-8 px-4">
                    Entre com sua conta para acessar o painel.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        <Facebook className="h-5 w-5 fill-current" />
                        {loading ? "Conectando..." : "Entrar com Facebook"}
                    </button>

                    <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-xs text-slate-500 font-medium">ou</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {!showEmailForm ? (
                        <button
                            onClick={() => setShowEmailForm(true)}
                            className="w-full flex items-center justify-center gap-2 text-slate-300 border border-slate-700 hover:bg-slate-800 font-semibold py-3.5 px-4 rounded-xl transition-all text-sm"
                        >
                            <Mail className="h-4 w-4" />
                            Entrar com Email e Senha
                        </button>
                    ) : (
                        <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                            />
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Senha"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl"
                            >
                                {loading ? "Entrando..." : "Entrar"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowEmailForm(false)}
                                className="w-full text-xs text-slate-500 hover:text-slate-400 py-1"
                            >
                                Cancelar
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
