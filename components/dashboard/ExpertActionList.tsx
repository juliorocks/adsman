
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldAlert, Sparkles, ArrowUpRight, TrendingUp, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExpertActionListProps {
    recommendations: any[];
    audit: any;
}

export function ExpertActionList({ recommendations, audit }: ExpertActionListProps) {
    const [hiddenActions, setHiddenActions] = useState<string[]>([]);

    const handleAction = (id: string, type: 'apply' | 'reject') => {
        // In a real app, this would call a server action
        setHiddenActions(prev => [...prev, id]);
    };

    const activeRecommendations = recommendations.filter(r => !hiddenActions.includes(r.id));

    if (activeRecommendations.length === 0 && recommendations.length > 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-[32px] bg-slate-900/50 border border-slate-800 text-center space-y-4"
            >
                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="text-xl font-bold text-white">Todas as ações foram processadas!</h4>
                <p className="text-slate-400">Sua conta está operando com as otimizações sugeridas pela colmeia.</p>
            </motion.div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-orange-500" />
                    Plano de Ação do Especialista
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase font-black tracking-widest">
                    {activeRecommendations.length} Recomendações Pendentes
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {activeRecommendations.map((rec, index) => (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-[28px] bg-slate-900 border border-slate-800 hover:border-primary-500/30 transition-all duration-300"
                        >
                            <div className="flex flex-col md:flex-row items-stretch min-h-[160px]">
                                {/* Ad Preview Section */}
                                <div className="w-full md:w-48 bg-slate-800 relative overflow-hidden flex-shrink-0">
                                    {rec.adImage ? (
                                        <img
                                            src={rec.adImage}
                                            alt={rec.targetName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 italic text-[10px] text-center p-4">
                                            Sem prévia visual disponível
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${rec.type === 'scale_up' ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'
                                                    }`}>
                                                    {rec.type === 'scale_up' ? 'Escala Sugerida' : 'Otimização de Verba'}
                                                </span>
                                                <h4 className="text-lg font-bold text-white mt-1 group-hover:text-primary-400 transition-colors">
                                                    {rec.targetName}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary-400 text-xs font-bold">
                                                <TrendingUp className="h-4 w-4" />
                                                Impacto: {rec.impact}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                                            {rec.reason}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex items-center gap-4">
                                        <Button
                                            onClick={() => handleAction(rec.id, 'apply')}
                                            className="bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl px-6 h-10 gap-2 active:scale-95 transition-all"
                                        >
                                            <Check className="h-4 w-4" />
                                            {rec.type === 'scale_up' ? `Aumentar para R$ ${(rec.suggestedBudget || 0).toFixed(2)}` : 'Aplicar Pausa'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleAction(rec.id, 'reject')}
                                            className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl px-4 h-10 gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Ignorar
                                        </Button>

                                        <div className="ml-auto hidden xl:flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Info className="h-3 w-3" />
                                            Análise Expert
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thought Overlay (Glassmorphism) */}
                            {rec.thought && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl max-w-xs text-[10px] leading-tight text-slate-300">
                                        <span className="text-primary-400 font-bold block mb-1">Raciocínio:</span>
                                        {rec.thought}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
