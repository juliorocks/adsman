
"use client";

import { useState } from "react";
import { UploadCloud, Zap } from "lucide-react";
import { generateStrategy } from "@/lib/ai/simulator";

export function SmartInputStep({ onNext }: { onNext: (data: any) => void }) {
    const [objective, setObjective] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        setIsProcessing(true);
        try {
            const strategy = await generateStrategy(objective);
            onNext(strategy);
        } catch (error) {
            console.error("AI Generation failed", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">O que vamos vender hoje?</h2>
                <p className="text-slate-500 mt-2">Diga o objetivo e solte os criativos. A IA faz o resto.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Seu Objetivo</label>
                    <textarea
                        className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        rows={3}
                        placeholder="Ex: Vender sapatos femininos para mulheres de 25-40 anos no Rio de Janeiro..."
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                    />
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
                        <UploadCloud className="h-full w-full" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">Clique para enviar ou arraste arquivos</p>
                    <p className="text-xs text-slate-500 mt-1">Imagens (JPG, PNG) ou Vídeos (MP4)</p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!objective || isProcessing}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isProcessing ? "A IA está pensando..." : "Gerar Estratégia Mágica ✨"}
                </button>
            </div>
        </div>
    );
}
