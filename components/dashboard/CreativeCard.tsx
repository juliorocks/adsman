
"use client";

import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface CreativeProps {
    creative: {
        id: string;
        angle: string;
        headline: string;
        bodyText: string;
        cta: string;
    }
}

export function CreativeCard({ creative }: CreativeProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `${creative.headline}\n\n${creative.bodyText}\n\nCTA: ${creative.cta}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copy copiada para a área de transferência!");

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{creative.angle}</span>
                <Sparkles className="h-3 w-3 text-purple-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h4 className="font-bold text-slate-900 leading-snug">{creative.headline}</h4>
            <p className="text-sm text-slate-500 line-clamp-3">{creative.bodyText}</p>
            <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                <span className="text-xs font-medium text-slate-400">CTA: {creative.cta}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 text-[10px] text-purple-600 hover:bg-purple-50 gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3" />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            Copiar Copy
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
