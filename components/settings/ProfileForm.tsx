"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";

export function ProfileForm({ currentName, email }: { currentName: string; email: string }) {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Nome não pode ser vazio.");
        setLoading(true);
        try {
            const { success, error } = await updateProfile(name);
            if (success) {
                toast.success("Perfil atualizado! Recarregue a página para ver o nome atualizado na sidebar.");
            } else {
                toast.error(error || "Erro ao atualizar perfil.");
            }
        } finally {
            setLoading(false);
        }
    };

    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-6">
                {/* Avatar preview */}
                <div className="h-16 w-16 rounded-2xl bg-primary-600/10 border border-primary-900 flex items-center justify-center text-primary-400 font-bold text-xl flex-shrink-0">
                    {initials}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome de exibição</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full bg-slate-950/20 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading || name.trim() === currentName}
                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 font-semibold"
                        >
                            {loading ? "Salvando..." : "Salvar Perfil"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
