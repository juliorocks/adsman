
import { Suspense } from "react";
import { Bot, ShieldCheck, Zap, Sparkles, TrendingUp, CheckCircle2, PenTool } from "lucide-react";
import { getIntegration } from "@/lib/data/settings";
import { AgentsFactory } from "@/components/dashboard/AgentsFactory";
import { AgentsPageSkeleton } from "@/components/dashboard/AgentsPageSkeleton";
import { NeuralLoadingState } from "@/components/dashboard/NeuralLoadingState";
import { ExpertAnalysisSection } from "@/components/dashboard/sections/ExpertAnalysisSection";
import { CreativeStudioSection } from "@/components/dashboard/sections/CreativeStudioSection";
import { HiveSummarySection } from "@/components/dashboard/sections/HiveSummarySection";

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
    const integration = await getIntegration();

    if (!integration?.ad_account_id) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Bot className="h-16 w-16 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-900 font-sans">Nenhuma conta selecionada</h2>
                <p className="text-slate-500 max-w-xs text-center font-sans">
                    Conecte e selecione uma conta de anúncios para ativar seus Agentes de IA.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 p-4 md:p-0">
            {/* STATIC HEADER - Renders Immediately */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-500/10 rounded-2xl">
                            <Sparkles className="h-6 w-6 text-primary-400" />
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight">Fábrica de Agentes</h2>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl font-medium">
                        Sua colmeia de especialistas está analisando dados em tempo real para maximizar seu ROAS.
                    </p>
                </div>
            </div>

            {/* FACTORY INTERFACE - Renders Immediately */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-600 rounded-[42px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <AgentsFactory />
            </div>

            {/* DYNAMIC SECTIONS - Suspended and Streamed separately */}
            <div className="space-y-10">
                <Suspense fallback={<div className="h-64 w-full bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />}>
                    <ExpertAnalysisSection adAccountId={integration.ad_account_id} />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-800">
                    <div className="lg:col-span-2">
                        <Suspense fallback={<div className="h-96 w-full bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800 flex items-center justify-center text-slate-500 uppercase text-[10px] font-black tracking-widest">Estúdio Criativo Processando...</div>}>
                            <CreativeStudioSection />
                        </Suspense>
                    </div>
                    <div>
                        <Suspense fallback={<div className="h-64 w-full bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />}>
                            <HiveSummarySection />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
