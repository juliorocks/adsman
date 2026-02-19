"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Play, Box, Zap, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { runAgentSquadAction } from "@/actions/agents";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

// Background Atmosphere Component
const BackgroundAtmosphere = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Geometric Mesh / Network Grid */}
            <div className="absolute inset-0 opacity-[0.1]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="mesh-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary-500/20" />
                            <circle cx="0" cy="0" r="1" className="fill-primary-500/30" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mesh-pattern)" />
                </svg>
            </div>

            {/* Pulsing Neural Nodes - Reduced Count */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`node-${i}`}
                    className="absolute w-1 h-1 bg-primary-400 rounded-full blur-[1px]"
                    style={{
                        left: `${(i * 17) % 100}%`,
                        top: `${(i * 23) % 100}%`,
                        willChange: "opacity, transform"
                    }}
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}

            {/* Working Robots - Reduced Count */}
            {[...Array(4)].map((_, i) => (
                <WorkingRobot key={i} delay={i * 4} />
            ))}

            {/* Twinkling Fairies - Reduced Count and simplified */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={`fairy-${i}`}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                        left: `${(i * 31) % 100}%`,
                        top: `${(i * 19) % 100}%`,
                        willChange: "opacity"
                    }}
                    animate={{
                        opacity: [0, 0.7, 0],
                    }}
                    transition={{
                        duration: 2 + (i % 3),
                        repeat: Infinity,
                        delay: i * 0.5,
                    }}
                />
            ))}

            {/* Connecting Lines & Flares */}
            <ConnectionNetwork />
        </div>
    );
};

const WorkingRobot = ({ delay }: { delay: number }) => {
    // Stable random values based on delay
    const startX = (delay * 13) % 100;
    const endX = (startX + 40) % 100;
    const top = 20 + ((delay * 7) % 50);

    return (
        <motion.div
            className="absolute z-0"
            style={{ top: `${top}%`, willChange: "transform, opacity" }}
            initial={{ left: `${startX}%`, opacity: 0 }}
            animate={{
                left: [`${startX}%`, `${endX}%`, `${startX}%`],
                opacity: [0, 0.3, 0.3, 0],
                rotateY: [0, 0, 180, 180, 0]
            }}
            transition={{
                duration: 30,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
        >
            <Bot className="w-4 h-4 text-primary-400/20" />
        </motion.div>
    );
};

const ConnectionNetwork = () => {
    return (
        <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
                <ConnectionBeam key={i} delay={i * 3} index={i} />
            ))}
        </div>
    );
};

const ConnectionBeam = ({ delay, index }: { delay: number, index: number }) => {
    // Stable positions
    const startX = (index * 25) % 100;
    const startY = (index * 35) % 100;
    const endX = (startX + 40) % 100;
    const endY = (startY + 40) % 100;

    return (
        <div className="absolute inset-0">
            <motion.div
                className="absolute h-px bg-gradient-to-r from-transparent via-primary-400/30 to-transparent"
                style={{ willChange: "transform, opacity, width" }}
                initial={{ opacity: 0, width: 0 }}
                animate={{
                    opacity: [0, 0.6, 0],
                    width: ["0%", "30%", "0%"],
                    left: [`${startX}%`, `${(startX + endX) / 2}%`],
                    top: [`${startY}%`, `${(startY + endY) / 2}%`],
                    rotate: index * 45
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut"
                }}
            />
            {/* Flare at connection point */}
            <motion.div
                className="absolute w-4 h-4 bg-primary-400 rounded-full blur-lg"
                style={{ willChange: "transform, opacity" }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.6, 0],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 5.2,
                    delay: delay + 2.5,
                }}
                style={{
                    left: `${(startX + endX) / 2}%`,
                    top: `${(startY + endY) / 2}%`
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
        const processingToast = toast.loading("Iniciando processamento neural...");

        try {
            const result = await runAgentSquadAction();

            if (result.success) {
                // Wait for a bit to show the scanning animation
                await new Promise(r => setTimeout(r, 2000));
                toast.success("Análise concluída com sucesso!", { id: processingToast });
                router.refresh();
            } else {
                toast.error(`Falha no processamento: ${result.error}`, { id: processingToast });
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro interno ao processar inteligência.", { id: processingToast });
        } finally {
            setLoading(false);
        }
    };

    const AgentStation = ({ type, glowColor, robotImg, eyeColor, isLoading }: any) => {
        const variants: any = {
            auditor: {
                x: isLoading ? [-6, 6, -6] : [-3, 3, -3],
                rotate: isLoading ? [-3, 3, -3] : [-1, 1, -1],
                transition: { duration: isLoading ? 1.8 : 6, repeat: Infinity, ease: "easeInOut" }
            },
            strategist: {
                x: isLoading ? [-8, 8, -8] : [-4, 4, -4],
                scale: isLoading ? [1, 1.05, 1] : [1, 1.02, 1],
                transition: { duration: isLoading ? 1.5 : 5, repeat: Infinity, ease: "easeInOut" }
            },
            creative: {
                x: isLoading ? [-5, 5, -5] : [-2, 2, -2],
                rotate: isLoading ? [4, -4, 4] : [1, -1, 1],
                transition: { duration: isLoading ? 2 : 7, repeat: Infinity, ease: "easeInOut" }
            }
        };

        return (
            <div className="relative w-[30%] flex flex-col items-center justify-end group transition-all">
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
                    <RobotBlink color={isLoading ? "bg-white" : eyeColor} />

                    {/* Status Indicator Dot */}
                    <div className={`absolute top-1 right-5 w-2.5 h-2.5 ${isLoading ? 'bg-white' : glowColor.replace('text-', 'bg-')} rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_10px_currentColor]`} />

                    {/* Analysis Pulse when loading */}
                    {isLoading && (
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={`absolute inset-0 rounded-full border border-white/50`}
                        />
                    )}

                    {/* Popup Tooltip */}
                    <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-56 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="bg-slate-900/98 backdrop-blur-3xl text-white p-4 rounded-2xl border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-xs">
                            <div className="font-bold flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-slate-400">
                                <Activity className="w-3.5 h-3.5 text-green-400" />
                                Monitoramento Ativo
                            </div>
                            <p className="font-semibold text-slate-100 leading-relaxed text-[13px]">
                                {isLoading ? "Analisando dados em tempo real..." : activeStatuses[type as keyof typeof activeStatuses]}
                            </p>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-[460px] bg-slate-950 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            {/* Background Atmosphere */}
            <BackgroundAtmosphere />

            {/* Digital Scanner Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 pointer-events-none"
                    >
                        <motion.div
                            animate={{ y: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="w-full h-px bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                        />
                        <div className="absolute inset-0 bg-primary-500/5 backdrop-blur-[1px]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Info */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 z-30 pointer-events-none text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]" />
                    <span className="text-[11px] uppercase font-black text-slate-500 tracking-[0.4em]">LIVE OPERATIONS</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-100 to-slate-500 leading-tight">
                    Central de Comando Neural
                </h3>
            </div>

            {/* Manual Override Button */}
            <div className="absolute top-10 right-1/2 translate-x-1/2 md:right-12 md:translate-x-0 z-40">
                <button
                    onClick={handleRunSquad}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white text-[14px] font-bold rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 border border-primary-400/20"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Zap className="h-5 w-5 fill-current text-white" />}
                    {loading ? 'Processando Inteligência...' : 'Processar Inteligência'}
                </button>
            </div>

            {/* Robots Layer (Z-10) */}
            <div className="relative w-full h-full flex justify-center items-end px-10 pb-12 z-10 max-w-7xl mx-auto">
                <AgentStation
                    type="auditor"
                    glowColor="text-orange-500"
                    robotImg="/robots/auditor.png"
                    eyeColor="bg-yellow-400"
                    isLoading={loading}
                />

                <AgentStation
                    type="strategist"
                    glowColor="text-blue-400"
                    robotImg="/robots/strategist.png"
                    eyeColor="bg-emerald-400"
                    isLoading={loading}
                />

                <AgentStation
                    type="creative"
                    glowColor="text-purple-400"
                    robotImg="/robots/creative.png"
                    eyeColor="bg-fuchsia-400"
                    isLoading={loading}
                />
            </div>

            {/* Conveyor Belt System - FRONT LAYER (Z-20) */}
            <div className="absolute bottom-0 w-full h-24 bg-slate-900 overflow-hidden flex items-center shadow-[0_-20px_50px_rgba(0,0,0,0.9)] z-20 border-t border-slate-800/50">
                <motion.div
                    className="flex w-[200%] h-full opacity-30"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: loading ? 3 : 18, repeat: Infinity, ease: "linear" }}
                >
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-[5%] border-r border-slate-700/50 h-full skew-x-12 bg-gradient-to-b from-slate-800/40 to-transparent" />
                    ))}
                </motion.div>

                {/* Belt Details */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-b from-black to-transparent opacity-50" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10" />

                {/* Glow under robots */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-1 flex justify-around">
                    <div className="w-1/4 h-full bg-orange-500/30 blur-xl" />
                    <div className="w-1/4 h-full bg-blue-500/30 blur-xl" />
                    <div className="w-1/4 h-full bg-purple-500/30 blur-xl" />
                </div>
            </div>

            {/* Moving Items on Belt - FRONT LAYER (Z-30) */}
            <div className="absolute bottom-12 left-0 right-0 h-10 pointer-events-none z-30">
                <AnimatePresence>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute bottom-0"
                            initial={{ left: "-15%" }}
                            animate={{ left: "115%" }}
                            transition={{
                                duration: loading ? 5 : 14,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 2
                            }}
                        >
                            <div className="w-10 h-10 bg-slate-800/60 backdrop-blur-md border border-slate-700/30 rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.4)] rotate-[15deg] group">
                                <Box className="w-5 h-5 text-slate-400" />
                                <div className="absolute -inset-1 bg-primary-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-slate-950 to-transparent z-40 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-slate-950 to-transparent z-40 pointer-events-none" />
        </div>
    );
}
