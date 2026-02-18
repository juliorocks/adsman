
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldAlert, Sparkles, ArrowUpRight, TrendingUp, Info, Zap, Settings2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyRecommendationAction, applyAllRecommendationsAction } from "@/actions/recommendations";
import { toggleAutonomousMode } from "@/actions/settings";
import { toast } from "sonner";

interface ExpertActionListProps {
    recommendations: any[];
    audit: any;
    isAutonomous?: boolean;
}

export function ExpertActionList({ recommendations, audit, isAutonomous: initialAutonomous }: ExpertActionListProps) {
    const [hiddenActions, setHiddenActions] = useState<string[]>([]);
    const [isAutonomous, setIsAutonomous] = useState(initialAutonomous || false);
    const [applyingAll, setApplyingAll] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const activeRecommendations = recommendations.filter(r => !hiddenActions.includes(r.id));

    const handleAction = async (rec: any, type: 'apply' | 'reject') => {
        if (type === 'reject') {
            setHiddenActions(prev => [...prev, rec.id]);
            return;
        }

        setApplyingId(rec.id);
        const res = await applyRecommendationAction(rec.id, rec.type, rec.targetId, rec.currentBudget, rec.suggestedBudget);
        setApplyingId(null);

        if (res.success) {
            toast.success(res.message || "Ação aplicada com sucesso no Meta Ads!");
            setHiddenActions(prev => [...prev, rec.id]);
        } else {
            toast.error(`Erro ao aplicar: ${res.error}`);
        }
    };

    const handleApplyAll = async () => {
        setApplyingAll(true);
        const res = await applyAllRecommendationsAction(activeRecommendations);
        setApplyingAll(false);

        if (res.success) {
            toast.success(`${activeRecommendations.length} ações aplicadas com sucesso!`);
            setHiddenActions(prev => [...prev, ...activeRecommendations.map(r => r.id)]);
        } else {
            toast.error(`Erro ao aplicar todas: ${res.error}`);
        }
    };

    const handleToggleAutonomous = async () => {
        const newValue = !isAutonomous;
        setIsAutonomous(newValue);
        const res = await toggleAutonomousMode(newValue);
        if (res.success) {
            toast.success(newValue ? "Modo Autônomo ATIVADO. A IA agora cuidará de tudo 24x7!" : "Modo Autônomo desativado.");
        } else {
            setIsAutonomous(!newValue);
            toast.error("Falha ao alterar modo autônomo.");
        }
    };

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-orange-500" />
                        Plano de Ação do Especialista
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                        {activeRecommendations.length} Recomendações Críticas Pendentes
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Autonomous Mode Toggle */}
                    <button
                        onClick={handleToggleAutonomous}
                        className={`group flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isAutonomous
                            ? 'bg-primary-500/10 border-primary-500/50 text-primary-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors ${isAutonomous ? 'bg-primary-500 text-white animate-pulse' : 'bg-slate-800'}`}>
                            <Zap className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Modo Autônomo</p>
                            <p className="text-[9px] font-bold opacity-60 leading-tight mt-0.5">{isAutonomous ? 'Agente Ativo 24x7' : 'Ativar IA Autônoma'}</p>
                        </div>
                    </button>

                    <Button
                        onClick={handleApplyAll}
                        disabled={applyingAll}
                        className="bg-white text-black hover:bg-slate-200 font-black rounded-2xl px-6 h-12 shadow-xl active:scale-95 transition-all text-xs"
                    >
                        {applyingAll ? 'Escalando...' : 'Aplicar Todas as Sugestões'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence initial={false}>
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
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${rec.type === 'scale_up' ? 'text-green-400 bg-green-400/10' :
                                                    rec.type === 'pause' || rec.type === 'critical' ? 'text-red-400 bg-red-400/10' :
                                                        'text-orange-400 bg-orange-400/10'
                                                    }`}>
                                                    {rec.type === 'scale_up' ? 'Escala Sugerida' :
                                                        rec.type === 'pause' || rec.type === 'critical' ? 'Ação Crítica' :
                                                            'Otimização Expert'}
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
                                            onClick={() => handleAction(rec, 'apply')}
                                            disabled={applyingId === rec.id}
                                            className={`font-black rounded-xl px-6 h-10 gap-2 active:scale-95 transition-all ${rec.type === 'pause' || rec.type === 'critical'
                                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_5px_15px_rgba(239,68,68,0.3)]'
                                                : rec.type === 'scale_up'
                                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_5px_15px_rgba(34,197,94,0.3)]'
                                                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-[0_5px_15px_rgba(59,130,246,0.3)]'
                                                }`}
                                        >
                                            {applyingId === rec.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            {rec.type === 'scale_up' ? `Aumentar para R$ ${(rec.suggestedBudget || 0).toFixed(2)}` : (rec.actionLabel || 'Aplicar Ação')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleAction(rec, 'reject')}
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
