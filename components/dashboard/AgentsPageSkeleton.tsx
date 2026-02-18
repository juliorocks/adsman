
import { Bot, ShieldCheck, Zap, Sparkles, TrendingUp, CheckCircle2, PenTool } from "lucide-react";

export function AgentsPageSkeleton() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-slate-800 rounded-2xl"></div>
                        <div className="h-10 w-48 bg-slate-800 rounded-xl"></div>
                    </div>
                    <div className="h-6 w-96 bg-slate-800 rounded-lg"></div>
                </div>
            </div>

            <div className="h-40 w-full bg-slate-900 border border-slate-800 rounded-[42px]"></div>

            <div className="space-y-6">
                <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-900 border border-slate-800 rounded-[32px]"></div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-800">
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="h-8 w-32 bg-slate-800 rounded-lg"></div>
                    <div className="h-64 bg-slate-900 border border-slate-800 rounded-[24px]"></div>
                </div>
            </div>
        </div>
    );
}
