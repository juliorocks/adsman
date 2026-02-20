
import { Zap } from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/metrics";
import { runPerformanceAudit } from "@/lib/agents/auditor";
import { runScaleStrategy } from "@/lib/agents/strategist";

export async function HiveSummarySection() {
    let auditScore = 0;
    let scalingCount = 0;

    try {
        const metrics = await getDashboardMetrics({ datePreset: 'last_30d' });
        const [audit, scaling] = await Promise.all([
            runPerformanceAudit(metrics),
            runScaleStrategy(metrics)
        ]);
        auditScore = audit.score || 0;
        scalingCount = scaling?.length || 0;
    } catch (error) {
        console.error("HiveSummarySection error:", error);
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white font-sans">Resumo da Colmeia</h3>
            <div className="p-6 rounded-[24px] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Saúde das Campanhas</p>
                        <p className="text-lg font-bold text-white font-sans">{auditScore}% Estável</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-blue-400 transition-all duration-1000"
                            style={{ width: `${auditScore}%` }}
                        />
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-xs leading-relaxed text-slate-400 font-medium">
                            <span className="font-bold text-slate-200">Insight:</span> A colmeia detectou {scalingCount} oportunidades de escala. O Auditor recomenda focar nos criativos da campanha.
                        </p>
                    </div>
                </div>

                <p className="text-[9px] text-center text-slate-600 uppercase tracking-widest font-black">
                    Monitoramento automático ativo
                </p>
            </div>
        </div>
    );
}
