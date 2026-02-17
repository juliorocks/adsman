
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Play, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { runAgentSquadAction } from "@/actions/agents";
import { useRouter } from "next/navigation";

const AGENT_STATES = {
    auditor: [
        "Verificando anomalias de CPC...",
        "Validando estrutura de campanhas...",
        "Monitorando frequência...",
        "Analisando CTR médio..."
    ],
    strategist: [
        "Calculando oportunidades de escala...",
        "Ajustando orçamentos...",
        "Identificando gargalos...",
        "Otimizando ROAS..."
    ],
    creative: [
        "Gerando variações de copy...",
        "Testando ganchos emocionais...",
        "Analisando criativos vencedores...",
        "Refinando chamadas para ação..."
    ]
} as const;

const RobotBlink = ({ color }: { color: string }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            {/* Left Eye */}
            <motion.div
                className={`absolute top-[38%] left-[32%] w-[12%] h-[6%] rounded-full ${color} mix-blend-screen blur-[1px]`}
                animate={{
                    scaleY: [1, 1, 0, 1],
                    opacity: [0.8, 0.8, 0, 0.8]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    times: [0, 0.9, 0.92, 1],
                    ease: "easeInOut"
                }}
            />
            {/* Right Eye */}
            <motion.div
                className={`absolute top-[38%] right-[32%] w-[12%] h-[6%] rounded-full ${color} mix-blend-screen blur-[1px]`}
                animate={{
                    scaleY: [1, 1, 0, 1],
                    opacity: [0.8, 0.8, 0, 0.8]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    times: [0, 0.9, 0.92, 1],
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};

export function AgentsFactory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeStatuses, setActiveStatuses] = useState({
        auditor: AGENT_STATES.auditor[0],
        strategist: AGENT_STATES.strategist[0],
        creative: AGENT_STATES.creative[0]
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const types = ['auditor', 'strategist', 'creative'] as const;
            const randomType = types[Math.floor(Math.random() * types.length)];
            const states = AGENT_STATES[randomType];
            const randomState = states[Math.floor(Math.random() * states.length)];

            setActiveStatuses(prev => ({
                ...prev,
                [randomType]: randomState
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleRunSquad = async () => {
        setLoading(true);
        try {
            await runAgentSquadAction();
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const AgentStation = ({ type, glowColor, robotImg, eyeColor }: any) => {
        // Unique variations for each agent - much smoother and slower
        const variants: any = {
            auditor: {
                y: [0, -6, 0],
                rotate: [-0.5, 0.5, -0.5],
                transition: { duration: 6, repeat: Infinity, ease: "linear" }
            },
            strategist: {
                y: [0, -9, 0],
                scale: [1, 1.02, 1],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            },
            creative: {
                y: [0, -4, 0],
                rotate: [1, -1, 1],
                transition: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }
        };

        return (
            <div className={`relative w-[30%] flex flex-col items-center justify-end group transition-all`}>
                {/* Name Label ABOVE robot */}
                <div className="mb-3 px-4 py-1 rounded-full bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm z-30 group-hover:bg-slate-800/80 transition-colors">
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${glowColor}`}>
                        {type}
                    </span>
                </div>

                {/* Robot Container - Behind Belt (z-10) */}
                <motion.div
                    className="relative z-10 cursor-pointer w-28 h-28"
                    animate={variants[type]}
                    whileHover={{ scale: 1.1, y: -5 }}
                >
                    {/* Robot Image */}
                    <img
                        src={robotImg}
                        alt={type}
                        className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
                    />

                    {/* Blinking Eyes Overlay */}
                    <RobotBlink color={eyeColor} />

                    {/* Status Indicator Dot */}
                    <div className={`absolute top-1 right-5 w-2.5 h-2.5 ${glowColor.replace('text-', 'bg-')} rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_10px_currentColor]`} />

                    {/* Popup Tooltip */}
                    <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-56 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="bg-slate-900/98 backdrop-blur-3xl text-white p-4 rounded-2xl border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-xs">
                            <div className="font-bold flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-slate-400">
                                <Activity className="w-3.5 h-3.5 text-green-400" />
                                Monitoramento Ativo
                            </div>
                            <p className="font-semibold text-slate-100 leading-relaxed text-[13px]">
                                {activeStatuses[type as keyof typeof activeStatuses]}
                            </p>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-[420px] bg-slate-950 rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl shadow-black/80">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.4)_1px,transparent_1px)] bg-[size:40px_40px] opacity:10" />

            {/* Header Info */}
            <div className="absolute top-6 left-8 z-30 pointer-events-none">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]" />
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em]">LIVE OPERATIONS</span>
                </div>
                <h3 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                    Central de Comando Neural
                </h3>
            </div>

            {/* Manual Override Button */}
            <div className="absolute top-8 right-8 z-40">
                <button
                    onClick={handleRunSquad}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 border border-primary-400/20"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    {loading ? 'Sincronizando...' : 'Processar Inteligência'}
                </button>
            </div>

            {/* Robots Layer (Z-10) */}
            <div className="relative w-full h-full flex justify-center items-end px-10 pb-6 z-10">
                <AgentStation
                    type="auditor"
                    glowColor="text-orange-500"
                    robotImg="/robots/auditor.png"
                    eyeColor="bg-yellow-400"
                />

                <AgentStation
                    type="strategist"
                    glowColor="text-blue-400"
                    robotImg="/robots/strategist.png"
                    eyeColor="bg-emerald-400"
                />

                <AgentStation
                    type="creative"
                    glowColor="text-purple-400"
                    robotImg="/robots/creative.png"
                    eyeColor="bg-fuchsia-400"
                />
            </div>

            {/* Conveyor Belt System - FRONT LAYER (Z-20) */}
            <div className="absolute bottom-0 w-full h-20 bg-slate-900 border-t border-slate-800 overflow-hidden flex items-center shadow-[0_-20px_50px_rgba(0,0,0,0.9)] z-20">
                <motion.div
                    className="flex w-[200%] h-full opacity-40"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-[5%] border-r border-slate-700 h-full skew-x-12 bg-gradient-to-b from-slate-800/20 to-transparent" />
                    ))}
                </motion.div>

                {/* Belt Details */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-b from-black to-transparent" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10" />
            </div>

            {/* Moving Items on Belt - FRONT LAYER (Z-30) */}
            <div className="absolute bottom-10 left-0 right-0 h-10 pointer-events-none z-30">
                <AnimatePresence>
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute bottom-0"
                            initial={{ left: "-15%" }}
                            animate={{ left: "115%" }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 2.5
                            }}
                        >
                            <div className="w-8 h-8 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-lg flex items-center justify-center shadow-2xl rotate-[15deg]">
                                <Box className="w-4 h-4 text-slate-500" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
