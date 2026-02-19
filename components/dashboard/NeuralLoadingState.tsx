"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bot, Share2, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
    "Sincronizando com a API do Meta Ads...",
    "Estabelecendo tunelamento neural seguro...",
    "Seus Agentes estão assumindo os postos...",
    "Auditor mapeando anomalias em tempo real...",
    "Estrategista processando tendências de ROAS...",
    "Creative Studio coletando assets visuais...",
    "Otimizando conexão com a Central de Comando...",
];

export function NeuralLoadingState() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const agents = [
        { icon: ShieldCheck, color: "text-orange-500", label: "Auditor" },
        { icon: Bot, color: "text-blue-500", label: "Strategist" },
        { icon: Sparkles, color: "text-purple-500", label: "Creative" }
    ];

    return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-900/20 backdrop-blur-sm rounded-[40px] border border-slate-800/50 relative overflow-hidden">
            {/* Background Grain/Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Meta Connection Visualizer */}
            <div className="relative w-full max-w-md h-32 flex items-center justify-between mb-12">
                {/* Meta Side */}
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2 z-10"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#0668E1]/10 border border-[#0668E1]/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,104,225,0.2)]">
                        <Share2 className="h-8 w-8 text-[#0668E1]" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-[#0668E1] uppercase">Meta API</span>
                </motion.div>

                {/* Connection Lines Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[2px] bg-slate-800/50 relative">
                        {/* Traveling Data Pulses */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                                animate={{ left: ["-10%", "110%"] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.5
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* AIOS Side */}
                <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="flex flex-col items-center gap-2 z-10"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Zap className="h-8 w-8 text-primary-400" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-primary-400 uppercase">AIOS Hive</span>
                </motion.div>
            </div>

            {/* Agent Icons Status bar */}
            <div className="flex gap-4 mb-8">
                {agents.map((agent, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 relative`}>
                            <agent.icon className={`h-5 w-5 ${agent.color}`} />
                            <motion.div
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Status Text Area */}
            <div className="text-center space-y-3 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-3"
                    >
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                        <span className="text-lg font-bold text-white tracking-tight">
                            {LOADING_MESSAGES[messageIndex]}
                        </span>
                    </motion.div>
                </AnimatePresence>
                <div className="flex flex-col gap-1 items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        Estabelecendo Pipeline Neural de Alta Performance
                    </p>
                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <motion.div
                            className="h-full bg-primary-500"
                            animate={{ width: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Decorative background blurs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] -z-10" />
        </div>
    );
}
