"use client";

import { Sparkles, Copy, Check, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { applyCreativeVariationAction } from "@/actions/recommendations";

interface CreativeProps {
    creative: {
        id: string;
        targetAdId: string;
        targetAdName: string;
        adImage?: string;
        angle: string;
        headline: string;
        bodyText: string;
        cta: string;
    }
}

export function CreativeCard({ creative }: CreativeProps) {
    const [copied, setCopied] = useState(false);
    const [applying, setApplying] = useState(false);

    const handleCopy = () => {
        const text = `${creative.headline}\n\n${creative.bodyText}\n\nCTA: ${creative.cta}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copy copiada!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = async () => {
        setApplying(true);
        try {
            const res = await applyCreativeVariationAction(
                creative.targetAdId,
                creative.headline,
                creative.bodyText,
                creative.cta
            );
            if (res.success) {
                toast.success(`Variação aplicada com sucesso ao anúncio: ${creative.targetAdName}`);
            } else {
                toast.error(`Falha ao aplicar: ${res.error}`);
            }
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="group relative bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden hover:border-primary-500/50 transition-all duration-500 flex flex-col h-full">
            {/* Ad Preview Header */}
            <div className="relative h-40 bg-slate-800 overflow-hidden flex-shrink-0">
                {creative.adImage ? (
                    <img
                        src={creative.adImage}
                        alt={creative.targetAdName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 italic text-xs">
                        Sem imagem
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        {creative.angle}
                    </span>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Headline Sugerida</p>
                    <h4 className="text-lg font-bold text-white leading-tight">
                        {creative.headline}
                    </h4>
                </div>

                <div className="mb-6">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nova Copy</p>
                    <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-4">
                        "{creative.bodyText}"
                    </p>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-slate-800 pt-4">
                        <span>Anúncio Alvo:</span>
                        <span className="text-primary-400 truncate ml-2 max-w-[150px]">{creative.targetAdName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                            onClick={handleApply}
                            disabled={applying}
                            className="bg-white text-black hover:bg-slate-200 font-black rounded-xl h-11 gap-2 text-xs"
                        >
                            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            Aplicar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="border-slate-800 text-slate-400 hover:text-white hover:bg-white/5 font-bold rounded-xl h-11 text-xs"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            Copiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* AI Badge */}
            <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-sm border border-white/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            </div>
        </div>
    );
}
