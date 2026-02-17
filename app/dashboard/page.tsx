
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, MousePointerClick, Target, TrendingUp, Layers, XCircle, Activity, BarChart3 } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getDashboardMetrics, getRecentActivity, getDailyPerformance } from "@/lib/data/metrics";
import { getIntegration, getAvailableAdAccounts } from "@/lib/data/settings";
import { AccountSelector } from "@/components/settings/AccountSelector";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { DraggableGrid } from "@/components/dashboard/DraggableGrid";
import { ManualRevenueModal } from "@/components/dashboard/ManualRevenueModal";
import { CampaignList } from "@/components/dashboard/CampaignList";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default async function DashboardPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const datePreset = typeof searchParams.date_preset === 'string' ? searchParams.date_preset : 'last_30d';
    const campaignIdRaw = typeof searchParams.campaign_id === 'string' ? searchParams.campaign_id : undefined;
    const campaignIds = campaignIdRaw ? campaignIdRaw.split(",") : [];

    const since = typeof searchParams.since === 'string' ? searchParams.since : undefined;
    const until = typeof searchParams.until === 'string' ? searchParams.until : undefined;

    const filter = {
        datePreset,
        campaignId: campaignIds.length > 0 ? campaignIds : undefined,
        since,
        until
    };

    const [metrics, recentCampaigns, dailyPerformance, integration, accounts] = await Promise.all([
        getDashboardMetrics(filter),
        getRecentActivity(),
        getDailyPerformance(filter),
        getIntegration(),
        getAvailableAdAccounts()
    ]);

    const title = campaignIds.length === 1
        ? `Campanha: ${recentCampaigns.find((c: any) => c.id === campaignIds[0])?.name || 'Selecionada'}`
        : campaignIds.length > 1
            ? `${campaignIds.length} Campanhas Selecionadas`
            : "Visão Geral";

    return (
        <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Header Section */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest mb-2">
                        <Activity className="h-3 w-3" />
                        Dashboard em Tempo Real
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                        {title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                        {campaignIds.length > 0
                            ? "Análise avançada e agregada das estratégias selecionadas no Meta Ads."
                            : "Acompanhe a performance completa da sua conta com insights gerados por IA."}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                    {/* Account Selector & Theme Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="w-[280px]">
                            <AccountSelector
                                accounts={accounts || []}
                                currentAccountId={integration?.ad_account_id}
                            />
                        </div>
                        <ModeToggle />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        {campaignIds.length > 0 && (
                            <Link
                                href="/dashboard"
                                className="px-3 py-2 flex items-center gap-2 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                            >
                                <XCircle className="h-4 w-4" />
                                Limpar Filtros
                            </Link>
                        )}
                        <DateRangeSelector />
                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/revenue">
                                <Button variant="ghost" className="gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl h-10 px-4">
                                    <History className="h-4 w-4" />
                                    Histórico
                                </Button>
                            </Link>
                            <ManualRevenueModal />
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <DraggableGrid metrics={metrics} />

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none shadow-slate-200/50 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Performance do Período</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Dados baseados no Meta Graph Analytics</p>
                            </div>
                        </div>
                        <div className="min-h-[350px]">
                            {dailyPerformance.length > 0 ? (
                                <PerformanceChart data={dailyPerformance} />
                            ) : (
                                <div className="h-[350px] w-full bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <BarChart3 className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium">Nenhum dado diário disponível para este período.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg dark:shadow-none shadow-slate-200/50 p-6">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">Suas Campanhas</h3>
                            <div className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {recentCampaigns.length} Total
                            </div>
                        </div>
                        <div className="mt-2">
                            <CampaignList campaigns={recentCampaigns} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
