
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, MousePointerClick, Target, TrendingUp, Layers, XCircle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getDashboardMetrics, getRecentActivity } from "@/lib/data/metrics";
import { getIntegration, getAvailableAdAccounts } from "@/lib/data/settings";
import { AccountSelector } from "@/components/settings/AccountSelector";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import Link from "next/link";

export default async function DashboardPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const datePreset = typeof searchParams.date_preset === 'string' ? searchParams.date_preset : 'last_30d';
    const campaignId = typeof searchParams.campaign_id === 'string' ? searchParams.campaign_id : undefined;

    const metrics = await getDashboardMetrics({ datePreset, campaignId });
    const recentCampaigns = await getRecentActivity();
    const integration = await getIntegration();
    const accounts = await getAvailableAdAccounts();

    const selectedCampaign = recentCampaigns.find((c: any) => c.id === campaignId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        {selectedCampaign ? `Campanha: ${selectedCampaign.name}` : "Visão Geral"}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {selectedCampaign
                            ? "Relatórios específicos desta campanha."
                            : "Acompanhe a performance da sua conta em tempo real."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {campaignId && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Limpar Filtro
                        </Link>
                    )}
                    <DateRangeSelector />
                    <div className="w-64">
                        <AccountSelector
                            accounts={accounts}
                            currentAccountId={integration?.ad_account_id}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Gasto Total"
                    value={`R$ ${metrics.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    description="Período selecionado"
                    trend="up"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Impressões"
                    value={metrics.impressions.toLocaleString('pt-BR')}
                    description="Visualizações totais"
                    trend="up"
                    icon={Target}
                />
                <MetricCard
                    title="Cliques (Link)"
                    value={metrics.clicks.toLocaleString('pt-BR')}
                    description="Interações únicas"
                    trend="up"
                    icon={MousePointerClick}
                />
                <MetricCard
                    title="ROAS Estimado"
                    value={`${metrics.roas}x`}
                    description="Retorno sobre investimento"
                    trend="up"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Performance do Período</h3>
                    <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400">
                        Gráfico de Performance (Realtime)
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Campanhas Recentes</h3>
                    <div className="space-y-4">
                        {recentCampaigns.length === 0 ? (
                            <p className="text-sm text-slate-500">Nenhuma campanha encontrada.</p>
                        ) : (
                            recentCampaigns.map((campaign: any) => (
                                <Link
                                    key={campaign.id}
                                    href={`/dashboard?campaign_id=${campaign.id}&date_preset=${datePreset}`}
                                    className={`flex items-center p-2 rounded-lg transition-colors group ${campaignId === campaign.id ? 'bg-primary-50 border border-primary-100' : 'hover:bg-slate-50'}`}
                                >
                                    <Layers className={`h-9 w-9 p-2 rounded mr-4 ${campaignId === campaign.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600'}`} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none text-slate-900">{campaign.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{campaign.status.toLowerCase()}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-slate-900 text-xs">
                                        {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
