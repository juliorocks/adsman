"use client";

import { Brain, Sparkles, Orbit } from "lucide-react";
import { useState } from "react";
import { saveAIPreference } from "@/actions/settings";
import { toast } from "sonner";

export function AIProviderSelector({ initialPreference }: { initialPreference: 'openai' | 'modal' }) {
    const [preference, setPreference] = useState(initialPreference);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (provider: 'openai' | 'modal') => {
        if (provider === preference) return;
        setLoading(true);
        try {
            await saveAIPreference(provider);
            setPreference(provider);
            toast.success(`Preferência alterada para ${provider === 'openai' ? 'OpenAI' : 'GLM-5'}`);
        } catch (err) {
            toast.error("Erro ao salvar preferência.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-500/10 rounded-2xl">
                    <Brain className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">Central de Inteligência</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Selecione o motor neural principal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OpenAI */}
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleToggle('openai')}
                    className={`relative p-6 rounded-[24px] border transition-all text-left group ${preference === 'openai'
                            ? 'bg-white border-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <Sparkles className={`h-6 w-6 ${preference === 'openai' ? 'text-black' : 'text-slate-600'}`} />
                        {preference === 'openai' && <div className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase rounded-full">Ativo</div>}
                    </div>
                    <h4 className="font-black text-lg">OpenAI GPT-4</h4>
                    <p className="text-[10px] mt-1 font-bold opacity-60 leading-relaxed uppercase tracking-wider">Altíssima precisão • Pago por token • Recomendado</p>
                    {loading && preference !== 'openai' && (
                        <div className="absolute inset-0 bg-slate-900/40 rounded-[24px] animate-pulse" />
                    )}
                </button>

                {/* Modal GLM-5 */}
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleToggle('modal')}
                    className={`relative p-6 rounded-[24px] border transition-all text-left group ${preference === 'modal'
                            ? 'bg-primary-500 border-primary-500 text-white shadow-[0_20px_40px_rgba(59,130,246,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <Orbit className={`h-6 w-6 ${preference === 'modal' ? 'text-white' : 'text-slate-600'}`} />
                        {preference === 'modal' && <div className="px-2 py-0.5 bg-white text-primary-600 text-[8px] font-black uppercase rounded-full">Ativo</div>}
                    </div>
                    <h4 className="font-black text-lg">Modal GLM-5</h4>
                    <p className="text-[10px] mt-1 font-bold opacity-80 leading-relaxed uppercase tracking-wider">Experimental • Grátis (Plano Beta) • Baixa concorrência</p>
                    {loading && preference !== 'modal' && (
                        <div className="absolute inset-0 bg-slate-900/40 rounded-[24px] animate-pulse" />
                    )}
                </button>
            </div>

            <p className="text-[10px] text-slate-500 font-medium text-center italic">
                A IA selecionada será utilizada para Auditoria, Geração de Criativos e Estratégias de Escala.
            </p>
        </div>
    );
}
