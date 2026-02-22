
"use client";

import { useState } from "react";
import { getGoogleAuthUrlAction } from "@/actions/google-drive";
import { Button } from "@/components/ui/button";
import { Database, Link2, Unlink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GoogleDriveCard({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        const result = await getGoogleAuthUrlAction();
        if (result.success && result.url) {
            window.location.href = result.url;
        } else {
            toast.error("Erro ao iniciar conexão com Google: " + result.error);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                        <Database className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Google Drive</h3>
                            {isConnected && (
                                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    Conectado
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Habilite o upload de arquivos grandes via nuvem. Importe seus criativos diretamente para as campanhas.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isConnected ? (
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                                <CheckCircle2 className="h-3 w-3" />
                                Monitoramento Ativo
                            </div>
                            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 text-xs font-bold gap-2">
                                <Unlink className="h-3 w-3" /> Desconectar Cloud
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleConnect}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            Conectar Google Drive
                        </Button>
                    )}
                </div>
            </div>

            {!isConnected && (
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Por que conectar?</p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                            Vídeos de alta fidelidade (.mp4) podem exceder os limites tradicionais de rede. Integrando o Google Drive, o AIOS transfere seus arquivos diretamente entre nuvens, garantindo 100% de estabilidade e velocidade.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
