
import { Bot, ShieldCheck, Zap, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/metrics";
import { runPerformanceAudit } from "@/lib/agents/auditor";
import { getIntegration } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
    const metrics = await getDashboardMetrics({ datePreset: 'last_30d' });
    const audit = await runPerformanceAudit(metrics);
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

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Bot className="h-8 w-8 text-primary-600" />
                    Seus Agentes de IA
                </h2>
                <p className="text-slate-500">Automação e inteligência 24/7 trabalhando nas suas campanhas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Agent 1: Auditor de Performance */}
                <div className="relative overflow-hidden group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">Ativo</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Auditor de Performance</h3>
                    <p className="text-sm text-slate-500 mb-6">Monitora anomalias e sugere melhorias estruturais nos anúncios.</p>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs border-t pt-3">
                            <span className="text-slate-400">Status da Conta:</span>
                            <span className={`font-semibold ${audit.status === 'good' ? 'text-green-600' : 'text-orange-600'}`}>
                                {audit.status.toUpperCase()} ({audit.score}/100)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Agent 2: Otimizador de Orçamento */}
                <div className="relative overflow-hidden group rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-60">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Zap className="h-6 w-6" />
                        </div>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-400">Em breve</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Estrategista de Escala</h3>
                    <p className="text-sm text-slate-500 mb-6">Aumenta o orçamento de quem vende e pausa quem gasta sem retorno.</p>
                </div>

                {/* Agent 3: IA Generativa */}
                <div className="relative overflow-hidden group rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-60">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-400">Em breve</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Estúdio Criativo</h3>
                    <p className="text-sm text-slate-500 mb-6">Gera variações de copy e imagens focadas em alta conversão.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recomendações Recentes
                    </h3>

                    <div className="space-y-4">
                        {audit.recommendations.map((rec) => (
                            <div key={rec.id} className="flex gap-4 p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary-100 transition-colors">
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${rec.type === 'critical' ? 'bg-red-50 text-red-600' :
                                        rec.type === 'optimization' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {rec.type === 'critical' ? <AlertTriangle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                                        <span className="text-[10px] text-slate-400 font-mono">{rec.impact}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{rec.description}</p>
                                    <div className="pt-3">
                                        <Button variant="outline" size="sm" className="h-8 text-xs">
                                            {rec.actionLabel}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Resumo do Auditor</h3>
                    <div className="p-6 rounded-xl bg-slate-900 text-white space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Análise realizada agora</p>
                                <p className="text-sm font-medium">IA em tempo real</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300 italic">
                            "{audit.summary}"
                        </p>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                12 filtros aplicados
                            </div>
                            <Button variant="ghost" className="text-xs h-7 text-slate-400 hover:text-white">
                                Detalhes técnicos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
