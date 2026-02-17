
"use client";

import { motion } from "framer-motion";
import { Activity, Loader2, Play } from "lucide-react";
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

    const AgentStation = ({ type, color, glowColor, robotImg, eyeColor }: any) => (
        <div className={`relative w-[30%] flex flex-col items-center justify-end pb-12 group`}>
            {/* Holographic Platform */}
            <div className={`absolute bottom-4 w-full h-8 ${color.replace('bg-', 'bg-')}/10 rounded-[100%] blur-xl group-hover:bg-opacity-20 transition-all duration-700`} />
            <div className="absolute bottom-4 w-24 h-4 bg-slate-800/40 rounded-[100%] border border-slate-700/50 blur-[2px]" />

            {/* Robot Container */}
            <motion.div
                className="relative z-20 cursor-pointer w-32 h-32"
                animate={{
                    y: [0, -15, 0],
                    rotate: [-1, 1, -1]
                }}
                transition={{
                    duration: 4 + Math.random(),
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.1 }}
            >
                {/* Robot Image */}
                <img
                    src={robotImg}
                    alt={type}
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                />

                {/* Blinking Eyes Overlay */}
                <RobotBlink color={eyeColor.replace('bg-', 'bg-')} />

                {/* Status Indicator Dot */}
                <div className={`absolute top-2 right-6 w-3 h-3 ${glowColor.replace('text-', 'bg-')} rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_10px_currentColor]`} />

                {/* Popup Tooltip */}
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl text-xs">
                        <div className="font-bold flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider text-slate-400">
                            <Activity className="w-3 h-3 text-green-400" />
                            Status Ativo
                        </div>
                        <p className="font-medium text-slate-200">
                            {activeStatuses[type as keyof typeof activeStatuses]}
                        </p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
                </div>
            </motion.div>

            {/* Base Label */}
            <div className="mt-8 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${glowColor}`}>
                    {type}
                </span>
            </div>
        </div>
    );

    return (
        <div className="relative w-full h-[360px] bg-slate-950 rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl shadow-black/50">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

            {/* Manual Override Button */}
            <div className="absolute top-8 right-8 z-30">
                <button
                    onClick={handleRunSquad}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95 border border-primary-400/20"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    {loading ? 'Sincronizando...' : 'Executar Análise IA Agora'}
                </button>
            </div>

            {/* Stations */}
            <div className="relative w-full h-full flex justify-center items-center px-10">
                <AgentStation
                    type="auditor"
                    color="bg-orange-500"
                    glowColor="text-orange-500"
                    robotImg="/robots/auditor.png"
                    eyeColor="bg-yellow-400"
                />

                <AgentStation
                    type="strategist"
                    color="bg-blue-500"
                    glowColor="text-blue-400"
                    robotImg="/robots/strategist.png"
                    eyeColor="bg-emerald-400"
                />

                <AgentStation
                    type="creative"
                    color="bg-purple-500"
                    glowColor="text-purple-400"
                    robotImg="/robots/creative.png"
                    eyeColor="bg-fuchsia-400"
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
