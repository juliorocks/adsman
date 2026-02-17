
import { Bot, ShieldCheck, Zap, Sparkles, TrendingUp, CheckCircle2, PenTool } from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/metrics";
import { runPerformanceAudit } from "@/lib/agents/auditor";
import { runScaleStrategy } from "@/lib/agents/strategist";
import { generateCreativeIdeas } from "@/lib/agents/creative";
import { getIntegration } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { CreativeCard } from "@/components/dashboard/CreativeCard";
import { AgentsFactory } from "@/components/dashboard/AgentsFactory";

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
    const metrics = await getDashboardMetrics({ datePreset: 'last_30d' });
    const audit = await runPerformanceAudit(metrics);
    const scaling = await runScaleStrategy(metrics);
    const creatives = await generateCreativeIdeas();
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

    const allRecommendations = [
        ...audit.recommendations.map(r => ({
            ...r,
            source: 'auditor',
            actionType: null,
            actionPayload: null,
            thought: (r as any).thought
        })),
        ...scaling.map(s => ({
            id: s.id,
            type: s.type === 'scale_up' ? 'optimization' : 'critical' as any,
            title: `${s.type === 'scale_up' ? 'Escalar' : 'Pausar'}: ${s.targetName}`,
            description: s.reason,
            actionLabel: s.type === 'scale_up' ? `Aumentar para R$ ${s.suggestedBudget?.toFixed(2)}` : 'Pausar Agora',
            impact: s.impact,
            source: 'strategist',
            actionType: s.type,
            actionPayload: {
                id: s.targetId,
                amount: s.suggestedBudget
            },
            thought: s.thought
        }))
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                        Seus Agentes de IA
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Automação e inteligência 24/7 trabalhando nas suas campanhas.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400 rounded-full text-sm font-semibold border border-primary-100 dark:border-primary-900/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Sincronizado com Meta Ads
                </div>
            </div>

            <div className="w-full">
                <AgentsFactory />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Recommendations Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Feed de Inteligência
                        </h3>
                        <div className="space-y-4">
                            {allRecommendations.map((rec) => (
                                <RecommendationCard key={rec.id} rec={rec} />
                            ))}
                        </div>
                    </div>

                    {/* Generative Copy Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <PenTool className="h-5 w-5" />
                            Sugestões do Estúdio Criativo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creatives.map((c) => (
                                <CreativeCard key={c.id} creative={c} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Combined Sidebar Summary */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Relatório da Colmeia</h3>
                    <div className="p-6 rounded-xl bg-slate-900 text-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Sistema Multi-Agente</p>
                                <p className="text-sm font-medium">Operação 100% Sincronizada</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Saúde da Conta</span>
                                    <span className="text-green-400 font-bold">{audit.score}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${audit.score}%` }} />
                                </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-xs text-slate-400 mb-1">Status Interno:</p>
                                <p className="text-xs leading-relaxed text-slate-300">
                                    A colmeia detectou {scaling.length} oportunidades de escala. O Auditor sugere priorizar o ajuste no CTR antes de subir o budget nas campanhas marcadas.
                                </p>
                            </div>
                        </div>

                        <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white h-11">
                            Executar Otimizações em Massa
                        </Button>

                        <p className="text-[10px] text-center text-slate-500">
                            Monitoramento realizado a cada 60 minutos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
