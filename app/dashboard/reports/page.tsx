import { BarChart3, TrendingUp, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
    return (
        <div className="max-w-[1600px] mx-auto space-y-8 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Relatórios e Insights
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Analise o desempenho das suas campanhas em tempo real.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Calendar className="h-4 w-4" />
                        Últimos 7 dias
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2 rounded-xl">
                        Exportar PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Investimento Total", value: "R$ 4.250,00", change: "+12%", trend: "up" },
                    { label: "CTR Médio", value: "2.45%", change: "+0.3%", trend: "up" },
                    { label: "Custo por Clique", value: "R$ 0,85", change: "-R$ 0,05", trend: "down" },
                    { label: "Conversões", value: "128", change: "+24%", trend: "up" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary-600" />
                            Evolução de Performance
                        </h2>
                    </div>
                    <div className="h-80 w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                        <p className="text-slate-400 text-sm italic font-medium">Gráfico em desenvolvimento...</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Melhores Criativos</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">Anúncio de Verão #{item}</p>
                                    <p className="text-xs text-slate-500 mt-1">ROI: 3.4x</p>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
                                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${80 - item * 10}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
