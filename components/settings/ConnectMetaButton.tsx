
"use client";

import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectMetaButton({ isConnected }: { isConnected: boolean }) {
    const handleConnect = () => {
        // Redirect to our internal API route which redirects to Facebook
        window.location.href = "/api/auth/meta";
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
                <div>
                    {isConnected ? (
                        <Button variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                            Conectado
                        </Button>
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
