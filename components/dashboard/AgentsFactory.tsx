
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, ShieldCheck, Zap, Sparkles, Box, Activity, Loader2, Play } from "lucide-react";
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

interface AgentStatusProps {
    type: 'auditor' | 'strategist' | 'creative';
    positionX: string;
    icon: React.ElementType;
    color: string;
    glowColor: string;
}

const RobotArm = ({ type, isActive }: { type: string, isActive: boolean }) => {
    const armVariants: any = {
        idle: { rotate: 0 },
        active: {
            rotate: [0, -15, 10, -5, 0],
            transition: {
                repeat: Infinity,
                duration: type === 'creative' ? 2 : 4,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 origin-bottom z-10 pointer-events-none"
            variants={armVariants}
            animate="active"
        >
            <div className={`w-2 h-16 bg-gradient-to-t from-slate-700 to-slate-500 rounded-full relative shadow-lg`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {type === 'auditor' && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-8 h-1 bg-red-500 blur-sm rounded-full"
                        />
                    )}
                    {type === 'strategist' && (
                        <div className="w-6 h-6 border-2 border-blue-400 rounded-full border-dashed animate-spin-slow" />
                    )}
                    {type === 'creative' && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 bg-purple-500 rounded-sm"
                        />
                    )}
                </div>
            </div>
        </motion.div>
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

    const AgentStation = ({ type, positionX, icon: Icon, color, glowColor }: AgentStatusProps) => (
        <div className={`absolute top-0 bottom-0 w-[20%] ${positionX} flex flex-col items-center justify-end pb-8 group`}>
            <div className="absolute bottom-0 w-full h-4 bg-slate-800/50 rounded-[100%] blur-sm group-hover:bg-slate-700/50 transition-colors" />
            <motion.div
                className="relative z-20 cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
            >
                <div className={`
                    w-16 h-16 rounded-2xl ${color} bg-opacity-20 border-2 border-[${glowColor}] 
                    flex items-center justify-center backdrop-blur-sm shadow-[0_0_15px_${glowColor}40]
                    relative overflow-hidden
                `}>
                    <Icon className={`w-8 h-8 ${glowColor}`} />
                    <motion.div
                        className={`absolute inset-0 bg-gradient-to-b from-transparent via-[${glowColor}] to-transparent opacity-20 h-[30%] w-full`}
                        animate={{ top: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs">
                        <div className="font-bold flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider text-slate-400">
                            <Activity className="w-3 h-3 text-green-400" />
                            Em Execução
                        </div>
                        <p className="font-medium text-slate-200">
                            {activeStatuses[type]}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
                            <span>Uptime: 99.9%</span>
                            <span>Latency: 12ms</span>
                        </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                </div>
            </motion.div>
            <RobotArm type={type} isActive={true} />
            <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {type}
            </div>
        </div>
    );

    return (
        <div className="relative w-full h-[320px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

            <div className="absolute top-6 right-6 z-30">
                <button
                    onClick={handleRunSquad}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                    {loading ? 'Sincronizando...' : 'Executar Análise IA Agora'}
                </button>
            </div>

            <div className="absolute bottom-0 w-full h-12 bg-slate-900 border-t border-slate-700 overflow-hidden flex items-center">
                <motion.div
                    className="flex w-[200%] h-full opacity-30"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-[5%] border-r border-slate-600 h-full skew-x-12" />
                    ))}
                </motion.div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 h-10 pointer-events-none z-10">
                <AnimatePresence>
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute bottom-0"
                            initial={{ left: "-10%" }}
                            animate={{ left: "110%" }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 2.5
                            }}
                        >
                            <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/50 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-[-12deg]">
                                <Box className="w-6 h-6 text-indigo-200" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="relative w-full h-full">
                <AgentStation
                    type="auditor"
                    positionX="left-[15%]"
                    icon={ShieldCheck}
                    color="bg-orange-500"
                    glowColor="text-orange-500"
                />

                <AgentStation
                    type="strategist"
                    positionX="left-[40%]"
                    icon={Zap}
                    color="bg-blue-500"
                    glowColor="text-blue-500"
                />

                <AgentStation
                    type="creative"
                    positionX="left-[65%]"
                    icon={Sparkles}
                    color="bg-purple-500"
                    glowColor="text-purple-500"
                />
            </div>

            <div className="absolute top-4 left-6 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]">Live Operations</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Centro de Comando Neural
                </h3>
            </div>
        </div>
    );
}
