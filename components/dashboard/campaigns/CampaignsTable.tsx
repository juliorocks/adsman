"use client";

import { useState, useEffect } from "react";
import {
    ChevronDown,
    ChevronUp,
    Layers,
    MousePointerClick,
    Loader2,
    AlertCircle,
    Sparkles,
    BarChart3,
    Target,
    Image as ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleStatusAction } from "@/actions/campaign";
import { getCampaignAdSetsQuery, getAdSetAdsQuery } from "@/actions/campaign-queries";

interface Ad {
    id: string;
    name: string;
    status: string;
    creative?: {
        thumbnail_url?: string;
        title?: string;
        body?: string;
    };
}

interface AdSet {
    id: string;
    name: string;
    status: string;
    billing_event?: string;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: number;
    lifetime_budget?: number;
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
    const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

    const [loadedAdSets, setLoadedAdSets] = useState<Record<string, AdSet[]>>({});
    const [loadedAds, setLoadedAds] = useState<Record<string, Ad[]>>({});

    const [loadingAdSets, setLoadingAdSets] = useState<Set<string>>(new Set());
    const [loadingAds, setLoadingAds] = useState<Set<string>>(new Set());

    const [adSetErrors, setAdSetErrors] = useState<Record<string, string>>({});
    const [adErrors, setAdErrors] = useState<Record<string, string>>({});

    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const toggleStatus = async (id: string, type: 'CAMPAIGN' | 'ADSET' | 'AD', currentStatus: string, name: string) => {
        setLoadingIds(prev => new Set(prev).add(id));
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

        try {
            const result = await toggleStatusAction(id, type, newStatus, name);
            if (!result.success) {
                toast.error(result.error || "Erro ao atualizar status.");
            } else {
                toast.success(`${name} ${newStatus === 'ACTIVE' ? 'ativado' : 'pausado'}.`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro de conexão.");
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const toggleCampaignExpand = async (campaignId: string) => {
        const isExpanding = !expandedCampaigns.has(campaignId);

        setExpandedCampaigns(prev => {
            const next = new Set(prev);
            if (isExpanding) next.add(campaignId);
            else next.delete(campaignId);
            return next;
        });

        if (isExpanding && !loadedAdSets[campaignId]) {
            setLoadingAdSets(prev => new Set(prev).add(campaignId));
            setAdSetErrors(prev => ({ ...prev, [campaignId]: "" }));

            const result = await getCampaignAdSetsQuery(campaignId);
            if (result.success) {
                setLoadedAdSets(prev => ({ ...prev, [campaignId]: result.data }));
            } else {
                setAdSetErrors(prev => ({ ...prev, [campaignId]: result.error || "Erro ao carregar conjuntos." }));
            }
            setLoadingAdSets(prev => {
                const next = new Set(prev);
                next.delete(campaignId);
                return next;
            });
        }
    };

    const toggleAdSetExpand = async (adSetId: string) => {
        const isExpanding = !expandedAdSets.has(adSetId);

        setExpandedAdSets(prev => {
            const next = new Set(prev);
            if (isExpanding) next.add(adSetId);
            else next.delete(adSetId);
            return next;
        });

        if (isExpanding && !loadedAds[adSetId]) {
            setLoadingAds(prev => new Set(prev).add(adSetId));
            setAdErrors(prev => ({ ...prev, [adSetId]: "" }));

            const result = await getAdSetAdsQuery(adSetId);
            if (result.success) {
                setLoadedAds(prev => ({ ...prev, [adSetId]: result.data }));
            } else {
                setAdErrors(prev => ({ ...prev, [adSetId]: result.error || "Erro ao carregar anúncios." }));
            }
            setLoadingAds(prev => {
                const next = new Set(prev);
                next.delete(adSetId);
                return next;
            });
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0 border shadow-sm ${status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800'
            }`}>
            {status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
        </Badge>
    );

    if (!mounted) {
        return (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium">Carregando campanhas...</p>
            </div>
        );
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nenhuma campanha encontrada</h3>
                <p className="text-slate-500 text-sm">Conecte sua conta de anúncios nas configurações.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {campaigns.map((c) => (
                <div
                    key={c.id}
                    className={`group border transition-all duration-300 rounded-3xl overflow-hidden ${expandedCampaigns.has(c.id)
                        ? 'border-indigo-500/30 bg-slate-50/30 dark:bg-slate-900/30 shadow-lg'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                >
                    {/* CAMPAIGN HEADER */}
                    <div
                        className="flex items-center gap-4 p-4 cursor-pointer"
                        onClick={() => toggleCampaignExpand(c.id)}
                    >
                        <div className={`p-3 rounded-2xl transition-colors ${expandedCampaigns.has(c.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                            }`}>
                            <Layers className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate text-base lg:text-lg">
                                    {c.name}
                                </h3>
                                <StatusBadge status={c.status} />
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tighter">
                                    {c.objective?.replace(/_/g, " ") || 'N/A'}
                                </span>
                                {c.id && <span className="text-slate-400 font-mono">#{String(c.id).slice(-6)}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
                            <div className="hidden md:block text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Orçamento</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {c.daily_budget
                                        ? `R$ ${(c.daily_budget / 100).toFixed(2)}`
                                        : c.lifetime_budget
                                            ? `R$ ${(c.lifetime_budget / 100).toFixed(2)}`
                                            : '-'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                                {loadingIds.has(c.id) ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                ) : (
                                    <Switch
                                        checked={c.status === 'ACTIVE'}
                                        onCheckedChange={() => toggleStatus(c.id, 'CAMPAIGN', c.status, c.name)}
                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
                                    />
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                                    onClick={() => toggleCampaignExpand(c.id)}
                                >
                                    {expandedCampaigns.has(c.id) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* AD SETS LIST */}
                    {expandedCampaigns.has(c.id) && (
                        <div className="bg-white/50 dark:bg-black/10 border-t border-slate-100 dark:border-slate-800">
                            {loadingAdSets.has(c.id) ? (
                                <div className="flex items-center justify-center p-12 gap-3 text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Carregando Conjuntos...</span>
                                </div>
                            ) : adSetErrors[c.id] ? (
                                <div className="flex items-center justify-center p-8 gap-2 text-rose-500 italic text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {adSetErrors[c.id]}
                                </div>
                            ) : !loadedAdSets[c.id] || loadedAdSets[c.id].length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic text-sm">
                                    Nenhum conjunto de anúncios encontrado.
                                </div>
                            ) : (
                                <div className="p-2 sm:p-4 space-y-2">
                                    <div className="px-4 py-2 flex items-center gap-2">
                                        <MousePointerClick className="h-3 w-3 text-slate-400" />
                                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Conjuntos de Anúncios</h4>
                                    </div>
                                    {loadedAdSets[c.id].map(adSet => (
                                        <div
                                            key={adSet.id}
                                            className={`rounded-2xl border transition-all ${expandedAdSets.has(adSet.id)
                                                ? 'border-indigo-500/20 bg-white dark:bg-slate-900 shadow-sm'
                                                : 'border-transparent bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div
                                                className="flex items-center gap-4 p-3 cursor-pointer group/adset"
                                                onClick={() => toggleAdSetExpand(adSet.id)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg"
                                                >
                                                    {expandedAdSets.has(adSet.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>

                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${expandedAdSets.has(adSet.id) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                        }`}>
                                                        <StatusBadge status={adSet.status} />
                                                    </div>
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate flex-1 text-sm sm:text-base">
                                                        {adSet.name}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 ml-auto" onClick={(e) => e.stopPropagation()}>
                                                    <div className="hidden sm:block text-right">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billing</p>
                                                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase">{adSet.billing_event || '-'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {loadingIds.has(adSet.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                                        ) : (
                                                            <Switch
                                                                checked={adSet.status === 'ACTIVE'}
                                                                onCheckedChange={() => toggleStatus(adSet.id, 'ADSET', adSet.status, adSet.name)}
                                                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 scale-90"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ADS LIST */}
                                            {expandedAdSets.has(adSet.id) && (
                                                <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 p-4 pl-12 sm:pl-16">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Target className="h-3 w-3 text-slate-400" />
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Anúncios</h5>
                                                    </div>

                                                    {loadingAds.has(adSet.id) ? (
                                                        <div className="flex items-center gap-2 p-4 text-slate-400">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span className="text-[10px] font-bold uppercase">Carregando Anúncios...</span>
                                                        </div>
                                                    ) : adErrors[adSet.id] ? (
                                                        <div className="p-4 text-rose-500 italic text-xs flex items-center gap-2">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {adErrors[adSet.id]}
                                                        </div>
                                                    ) : !loadedAds[adSet.id] || loadedAds[adSet.id].length === 0 ? (
                                                        <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs italic">
                                                            Nenhum anúncio encontrado.
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {loadedAds[adSet.id].map(ad => (
                                                                <div
                                                                    key={ad.id}
                                                                    className="grid grid-cols-[auto_1fr_auto] gap-4 items-center p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-md transition-all group/ad"
                                                                >
                                                                    {/* Thumbnail */}
                                                                    <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm group-hover/ad:scale-105 transition-transform duration-500">
                                                                        {ad.creative?.thumbnail_url ? (
                                                                            <img src={ad.creative.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <ImageIcon className="h-6 w-6 text-slate-300 m-auto mt-4" />
                                                                        )}
                                                                    </div>

                                                                    {/* Name and Title */}
                                                                    <div className="min-w-0 pr-2">
                                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-full group-hover/ad:text-indigo-500 transition-colors">
                                                                                {ad.name}
                                                                            </p>
                                                                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0 border ${ad.status === 'ACTIVE'
                                                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                                                }`}>
                                                                                {ad.status === 'ACTIVE' ? 'ATIVO' : 'PAUSADO'}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-400 truncate font-medium opacity-80">
                                                                            {ad.creative?.title || 'Anúncio sem título'}
                                                                        </p>
                                                                    </div>

                                                                    {/* Controls */}
                                                                    <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="hidden xl:block text-right">
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Controle</p>
                                                                            <span className={`text-[8px] font-bold uppercase ${ad.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                                                {ad.status === 'ACTIVE' ? 'Online' : 'Offline'}
                                                                            </span>
                                                                        </div>
                                                                        {loadingIds.has(ad.id) ? (
                                                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                                                        ) : (
                                                                            <Switch
                                                                                checked={ad.status === 'ACTIVE'}
                                                                                onCheckedChange={() => toggleStatus(ad.id, 'AD', ad.status, ad.name)}
                                                                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 shadow-sm scale-110"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
