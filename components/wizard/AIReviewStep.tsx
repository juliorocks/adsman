
"use client";

import { CheckCircle2, Target, Users, Globe, Loader2 } from "lucide-react";
import { StrategyResult } from "@/lib/ai/simulator";

interface AIReviewStepProps {
    onPublish: () => void;
    onBack: () => void;
    data: StrategyResult;
    isPublishing: boolean;
}

export function AIReviewStep({ onPublish, onBack, data, isPublishing }: AIReviewStepProps) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Estratégia Pronta! 🚀</h2>
                <p className="text-slate-500 mt-2">Revise o que a IA preparou para você.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-primary-600" />
                        Configuração da Campanha
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Objetivo</label>
                            <p className="text-sm font-medium text-slate-900">{data.objective}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Orçamento Diário</label>
                            <p className="text-sm font-medium text-slate-900">R$ {data.budget.toFixed(2)} <span className="text-green-600 text-xs">(Sugerido)</span></p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1">
                            <Users className="h-3 w-3 mr-1" /> Público Alvo
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {data.targeting.age_min}-{data.targeting.age_max} anos
                            </span>
                            {data.targeting.interests.map((interest) => (
                                <span key={interest} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1">
                            <Globe className="h-3 w-3 mr-1" /> Localização
                        </label>
                        <p className="text-sm text-slate-900">{data.targeting.geo_locations.join(", ")}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-3 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                    Ajustar Manualmente
                </button>
                <button
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Publicando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Publicar Campanha
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
