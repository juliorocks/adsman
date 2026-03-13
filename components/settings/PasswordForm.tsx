"use client";

import { useState } from "react";
import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export function PasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.");
        if (password !== confirm) return toast.error("As senhas não coincidem.");
        setLoading(true);
        try {
            const { success, error } = await updatePassword(password);
            if (success) {
                toast.success("Senha atualizada com sucesso!");
                setPassword("");
                setConfirm("");
            } else {
                toast.error(error || "Erro ao atualizar senha.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={show ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShow(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                tabIndex={-1}
                            >
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmar Senha</label>
                        <input
                            type={show ? "text" : "password"}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                            placeholder="Repita a nova senha"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={loading || !password || !confirm}
                        className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-6 font-semibold"
                    >
                        <KeyRound className="h-4 w-4 mr-2" />
                        {loading ? "Salvando..." : "Atualizar Senha"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
