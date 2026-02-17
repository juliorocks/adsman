
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, MousePointerClick, Target, TrendingUp, Layers, XCircle } from "lucide-react";

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
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        {title}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {campaignIds.length > 0
                            ? "Análise agregada das campanhas selecionadas."
                            : "Acompanhe a performance da sua conta em tempo real."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {campaignIds.length > 0 && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Limpar Tudo
                        </Link>
                    )}
                    <DateRangeSelector />
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/revenue">
                            <Button variant="outline" className="gap-2 text-slate-600 border-slate-200">
                                <History className="h-4 w-4" />
                                Histórico
                            </Button>
                        </Link>
                        <ManualRevenueModal />
                    </div>
                    <div className="w-64">
                        <AccountSelector
                            accounts={accounts}
                            currentAccountId={integration?.ad_account_id}
                        />
                    </div>
                </div>
            </div>

            <DraggableGrid metrics={metrics} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Performance do Período</h3>
                    <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400">
                        Gráfico de Performance (Realtime)
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm p-6 overflow-hidden">
                    <h3 className="font-semibold text-slate-900 mb-4 px-1">Campanhas Recentes</h3>
                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <CampaignList campaigns={recentCampaigns} />
                    </div>
                </div>
            </div>
        </div>
    );
}
