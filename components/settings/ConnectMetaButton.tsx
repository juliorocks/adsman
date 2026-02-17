"use client";

import { Facebook, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disconnectMeta } from "@/actions/settings";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectMetaButton({ isConnected }: { isConnected: boolean }) {
    const router = useRouter();
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleConnect = () => {
        window.location.href = "/api/auth/meta";
    };

    const handleDisconnect = async () => {
        if (!confirm("Tem certeza que deseja desconectar sua conta da Meta?")) return;

        setIsDisconnecting(true);
        try {
            await disconnectMeta();
            router.refresh();
        } catch (error) {
            alert("Erro ao desconectar conta.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2]">
                        <Facebook className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-slate-900">Meta Ads (Facebook/Instagram)</h3>
                        <p className="text-sm text-slate-500">
                            {isConnected
                                ? "Sua conta está conectada e sincronizando dados."
                                : "Conecte para gerenciar campanhas e analisar métricas."}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {isConnected ? (
                        <>
                            <Button variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 cursor-default">
                                Conectado
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                title="Desconectar"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleConnect} className="bg-[#1877F2] hover:bg-[#166fe5]">
                            Conectar Conta
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
