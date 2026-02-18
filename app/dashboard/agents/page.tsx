import { Bot, ShieldCheck, Zap, Sparkles, TrendingUp, CheckCircle2, PenTool } from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/metrics";
import { runPerformanceAudit } from "@/lib/agents/auditor";
import { runScaleStrategy } from "@/lib/agents/strategist";
import { generateCreativeIdeas } from "@/lib/agents/creative";
import { getIntegration } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import { CreativeCard } from "@/components/dashboard/CreativeCard";
import { AgentsFactory } from "@/components/dashboard/AgentsFactory";
import { getAdCreatives } from "@/lib/meta/api";
import { decrypt } from "@/lib/security/vault";
import { ExpertActionList } from "@/components/dashboard/ExpertActionList";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
    const integration = await getIntegration();

    if (!integration?.ad_account_id) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Bot className="h-16 w-16 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-900">Nenhuma conta selecionada</h2>
                <p className="text-slate-500 max-w-xs text-center">
                    Conecte e selecione uma conta de anúncios para ativar seus Agentes de IA.
                </p>
            </div>
        );
    }

    const accessToken = decrypt(integration.access_token_ref);

    // Parallel fetch for all data
    const [metrics, creatives, integrationData] = await Promise.all([
        getDashboardMetrics({ datePreset: 'last_30d' }),
        getAdCreatives(integration.ad_account_id, accessToken),
        getIntegration()
    ]);

    const audit = await runPerformanceAudit(metrics);
    const scaling = await runScaleStrategy(metrics);
    const creativeIdeas = await generateCreativeIdeas();

    // Mapping recommendations with images
    const recommendationsWithImages = scaling.map((s: any) => {
        // Try to find a matching ad image if possible (simplistic matching for now)
        const adImage = creatives.find((c: any) => c.name.includes(s.targetName) || s.targetName.includes(c.name))?.thumbnail_url;
        return {
            ...s,
            adImage
        };
    });

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20">
                            <Bot className="h-7 w-7 text-primary-500" />
                        </div>
                        Seus Agentes de IA
                    </h2>
                    <p className="text-slate-500 mt-1">Inteligência neural operando em {integration.ad_account_id}.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-xs font-black border border-green-500/20 uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4" />
                    Live & Sincronizado
                </div>
            </div>

            <div className="w-full">
                <AgentsFactory />
            </div>

            {/* NEW SECTION: Expert Action List (opened after analysis) */}
            <ExpertActionList recommendations={recommendationsWithImages} audit={audit} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-800">
                <div className="lg:col-span-2 space-y-12">
                    {/* Generative Copy Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-purple-400" />
                            Sugestões do Estúdio Criativo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creativeIdeas.map((c) => (
                                <CreativeCard key={c.id} creative={c} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Resumo da Colmeia</h3>
                    <div className="p-6 rounded-[24px] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-primary-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Saúde das Campanhas</p>
                                <p className="text-lg font-bold text-white">{audit.score}% Estável</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-blue-400"
                                    style={{ width: `${audit.score}%` }}
                                />
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-xs leading-relaxed text-slate-400">
                                    <span className="font-bold text-slate-200">Insight:</span> A colmeia detectou {scaling.length} oportunidades de escala. O Auditor recomenda focar nos criativos da campanha de Retargeting.
                                </p>
                            </div>
                        </div>

                        <p className="text-[9px] text-center text-slate-600 uppercase tracking-widest font-black">
                            Monitoramento automático ativo
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
