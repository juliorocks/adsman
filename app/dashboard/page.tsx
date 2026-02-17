
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, MousePointerClick, Target, TrendingUp, Layers, XCircle, Activity, BarChart3 } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getDashboardMetrics, getRecentActivity } from "@/lib/data/metrics";
import { getIntegration, getAvailableAdAccounts } from "@/lib/data/settings";
import { AccountSelector } from "@/components/settings/AccountSelector";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { DraggableGrid } from "@/components/dashboard/DraggableGrid";
import { ManualRevenueModal } from "@/components/dashboard/ManualRevenueModal";
import { CampaignList } from "@/components/dashboard/CampaignList";
import { History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

    const metrics = await getDashboardMetrics({
        datePreset,
        campaignId: campaignIds.length > 0 ? campaignIds : undefined,
        since,
        until
    });
    const recentCampaigns = await getRecentActivity();
    const integration = await getIntegration();
    const accounts = await getAvailableAdAccounts();

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
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        {title}
                    </h2>
                    <p className="text-slate-500 font-medium max-w-xl">
                        {campaignIds.length > 0
                            ? "Análise avançada e agregada das estratégias selecionadas no Meta Ads."
                            : "Acompanhe a performance completa da sua conta com insights gerados por IA."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    {campaignIds.length > 0 && (
                        <Link
                            href="/dashboard"
                            className="px-3 py-2 flex items-center gap-2 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Limpar Filtros
                        </Link>
                    )}
                    <DateRangeSelector />
                    <div className="h-8 w-px bg-slate-100 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/revenue">
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:bg-slate-50 rounded-xl h-10 px-4">
                                <History className="h-4 w-4" />
                                Histórico
                            </Button>
                        </Link>
                        <ManualRevenueModal />
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <DraggableGrid metrics={metrics} />

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Performance do Período</h3>
                                <p className="text-sm text-slate-500">Dados baseados no Meta Graph Analytics</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs font-bold border-slate-200">Hoje</Button>
                                <Button variant="ghost" size="sm" className="rounded-full h-8 px-4 text-xs font-bold text-slate-400">7 Dias</Button>
                            </div>
                        </div>
                        <div className="h-[350px] w-full bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 overflow-hidden relative group hover:border-primary-300 transition-all duration-500">
                            <div className="absolute inset-x-8 bottom-12 top-20 flex items-end justify-between gap-3">
                                {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-full bg-gradient-to-t from-primary-500/80 to-primary-400/40 rounded-t-lg transition-all duration-1000 ease-out animate-in slide-in-from-bottom"
                                        style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                                    />
                                ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <BarChart3 className="h-10 w-10 mx-auto mb-3 text-primary-600 animate-bounce" />
                                    <p className="font-bold text-slate-900 tracking-tight">Otimizando sua Visão Geral...</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Sincronizando com Meta Ads API</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50 p-6">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="font-bold text-slate-900">Suas Campanhas</h3>
                            <div className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {recentCampaigns.length} Total
                            </div>
                        </div>
                        <div className="max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                            <CampaignList campaigns={recentCampaigns} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
