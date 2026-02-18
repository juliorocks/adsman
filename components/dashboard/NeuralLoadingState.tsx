
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Cpu, Zap, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
    "Conectando à rede neural da colmeia...",
    "Auditor verificando anomalias no Meta Ads...",
    "Estrategista calculando oportunidades de lucro...",
    "Creative Studio gerando novas variações de copy...",
    "Sincronizando métricas de ROAS em tempo real...",
    "Refinando algoritmos de escala vertical...",
];

export function NeuralLoadingState() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full py-12 flex flex-col items-center justify-center space-y-6">
            {/* Connection Animation */}
            <div className="relative h-20 w-64">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-800" />

                <motion.div
                    className="absolute top-1/2 left-0 h-1 w-20 bg-gradient-to-r from-transparent via-primary-500 to-transparent blur-sm"
                    animate={{ left: ["-20%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                <div className="absolute inset-0 flex items-center justify-around">
                    <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg">
                        <Cpu className="h-4 w-4 text-primary-400" />
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg">
                        <Share2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg">
                        <Zap className="h-4 w-4 text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Pulsing Text */}
            <div className="flex flex-col items-center space-y-2">
                <p className="text-sm font-bold text-slate-300 tracking-wide uppercase font-sans flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    {LOADING_MESSAGES[messageIndex]}
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    Estabelecendo conexão neural segura
                </p>
            </div>
        </div>
    );
}
