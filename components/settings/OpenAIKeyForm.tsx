
"use client";

import { useState } from "react";
import { saveOpenAIKey } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export function OpenAIKeyForm({ hasKey }: { hasKey: boolean }) {
    const [key, setKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simple trim and check
        const trimmedKey = key.trim();
        if (!trimmedKey.startsWith("sk-") && trimmedKey.length < 20) {
            toast.error("Chave inválida. Deve começar com 'sk-'");
            return;
        }

        setLoading(true);
        try {
            await saveOpenAIKey(trimmedKey);
            toast.success("Chave OpenAI salva com sucesso!");
            setKey("");
        } catch (error) {
            toast.error("Erro ao salvar chave.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center center justify-center text-primary-600 dark:text-primary-400">
                    <Key className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">OpenAI API Key</h3>
                    <p className="text-sm text-slate-500">Conecte sua própria chave para ativar a inteligência avançada.</p>
                </div>
                {hasKey && (
                    <div className="ml-auto flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/10 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Conectado
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Input
                        type={showKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={key}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                        className="pr-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 max-w-[200px]">
                        Sua chave é criptografada e usada apenas para processar suas campanhas.
                    </p>
                    <Button
                        type="submit"
                        disabled={loading || !key}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 rounded-xl h-11 transition-all active:scale-95 border-none"
                    >
                        {loading ? "Salvando..." : hasKey ? "Atualizar Chave" : "Conectar OpenAI"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
