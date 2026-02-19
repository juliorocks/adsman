"use client";

import type { ActivityLog } from "@/lib/data/logs";
import { User, Sparkles, Brain, Bot, FileText } from "lucide-react";
import { useEffect, useState } from "react";

const AgentIcon = ({ agent }: { agent: string }) => {
    const safeAgent = (agent || 'SYSTEM').toUpperCase();
    switch (safeAgent) {
        case 'AUDITOR': return <Brain className="h-5 w-5 text-purple-500" />;
        case 'CREATIVE': return <Sparkles className="h-5 w-5 text-pink-500" />;
        case 'STRATEGIST': return <Bot className="h-5 w-5 text-blue-500" />;
        case 'SYSTEM': return <FileText className="h-5 w-5 text-slate-500" />;
        default: return <User className="h-5 w-5 text-slate-500" />;
    }
};

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!logs || logs.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
                Nenhuma atividade recente registrada.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <AgentIcon agent={log.agent} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                                    {(log.agent || 'SYSTEM').toUpperCase() === 'USER' ? 'Usuário' : (log.agent || 'SYSTEM').toLowerCase()}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${log.status === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    }`}>
                                    {log.status === 'SUCCESS' ? 'Sucesso' : 'Falha'}
                                </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                                {mounted ? new Date(log.created_at).toLocaleString('pt-BR') : '...'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {log.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${log.action_type === 'ACTIVATE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                log.action_type === 'PAUSE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    log.action_type === 'CREATIVE' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                                        log.action_type === 'BUDGET' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                } dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400`}>
                                {log.action_type}
                            </span>
                            {log.target_name && (
                                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                    → {log.target_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
