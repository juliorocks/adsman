
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, MousePointerClick, Target, TrendingUp, Layers } from "lucide-react";
import { getDashboardMetrics, getRecentActivity } from "@/lib/data/metrics";

export default async function DashboardPage() {
    const metrics = await getDashboardMetrics();
    const recentCampaigns = await getRecentActivity();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Gasto Total (Mês)"
                    value={`R$ ${metrics.spend.toLocaleString('pt-BR')}`}
                    description="+20.1% vs mês anterior"
                    trend="up"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Impressões"
                    value={metrics.impressions.toLocaleString('pt-BR')}
                    description="+1800 hoje"
                    trend="up"
                    icon={Target}
                />
                <MetricCard
                    title="Cliques (Link)"
                    value={metrics.clicks.toLocaleString('pt-BR')}
                    description="-4% vs mês anterior"
                    trend="down"
                    icon={MousePointerClick}
                />
                <MetricCard
                    title="ROAS Médio"
                    value={`${metrics.roas}x`}
                    description="+0.2 vs média"
                    trend="up"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Performance Recente</h3>
                    <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400">
                        Gráfico de Linha (Placeholder)
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Campanhas Recentes</h3>
                    <div className="space-y-4">
                        {recentCampaigns.length === 0 ? (
                            <p className="text-sm text-slate-500">Nenhuma campanha criada ainda.</p>
                        ) : (
                            recentCampaigns.map((campaign: any) => (
                                <div key={campaign.id} className="flex items-center">
                                    <Layers className="h-9 w-9 p-2 rounded bg-slate-100 text-slate-500 mr-4" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none text-slate-900">{campaign.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{campaign.status.toLowerCase()}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-slate-900 text-xs">
                                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
