
"use client";

import { useState } from "react";
import { TrendingUp, AlertTriangle, ArrowUpRight, Octagon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyScalingAction, applyStatusAction } from "@/actions/agent-actions";

interface RecProps {
    rec: any;
}

export function RecommendationCard({ rec }: RecProps) {
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);

    const handleAction = async () => {
        setLoading(true);
        try {
            let result;
            if (rec.source === 'strategist') {
                if (rec.actionType === 'scale_up') {
                    result = await applyScalingAction(rec.actionPayload.id, rec.actionPayload.amount);
                } else if (rec.actionType === 'pause') {
                    result = await applyStatusAction(rec.actionPayload.id, 'PAUSED');
                }
            }

            if (result?.success) {
                setApplied(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isAuditOnly = rec.source === 'auditor';

    return (
        <div className={`flex gap-4 p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all ${applied ? 'opacity-50 border-green-200 bg-green-50/10' : 'hover:border-primary-100 border-slate-100 dark:border-slate-800'
            }`}>
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${rec.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                rec.type === 'optimization' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}>
                {rec.source === 'strategist' ? (
                    rec.type === 'critical' ? <Octagon className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />
                ) : (
                    rec.type === 'critical' ? <AlertTriangle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />
                )}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{rec.title}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${rec.source === 'auditor' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                            {rec.source}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.impact}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{rec.description}</p>

                {rec.thought && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 italic text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                        <span className="font-bold text-primary-500">Razão da IA:</span>
                        <span>{rec.thought}</span>
                    </div>
                )}
                <div className="pt-3">
                    {applied ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Aplicado com Sucesso
                        </div>
                    ) : (
                        <Button
                            variant={rec.type === 'critical' ? 'destructive' : 'outline'}
                            size="sm"
                            className="h-8 text-xs min-w-[120px]"
                            onClick={handleAction}
                            disabled={loading || isAuditOnly}
                        >
                            {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : null}
                            {isAuditOnly ? 'Somente Auditoria' : rec.actionLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
