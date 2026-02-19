"use client";

import { toggleStatusAction } from "@/actions/campaign";
import { getCampaignAdSetsQuery, getAdSetAdsQuery } from "@/actions/campaign-queries";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronDown, Layers, MousePointerClick, Image as ImageIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    daily_budget?: number;
    lifetime_budget?: number;
    ads?: Ad[];
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    adSets?: AdSet[];
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
    // We maintain expanded state for campaigns and adsets
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
    const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

    // We store fetched data locally to avoid re-fetching
    const [loadedAdSets, setLoadedAdSets] = useState<Record<string, AdSet[]>>({});
    const [loadedAds, setLoadedAds] = useState<Record<string, Ad[]>>({});

    // Debug errors state
    const [adSetErrors, setAdSetErrors] = useState<Record<string, string>>({});
    const [adErrors, setAdErrors] = useState<Record<string, string>>({});

    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const toggleStatus = async (id: string, type: 'CAMPAIGN' | 'ADSET' | 'AD', currentStatus: string, name: string) => {
        setLoadingIds(prev => new Set(prev).add(id));
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

        try {
            const res = await toggleStatusAction(id, type, newStatus, name);
            if (res.success) {
                toast.success(`${type === 'CAMPAIGN' ? 'Campanha' : type === 'ADSET' ? 'Conjunto' : 'Anúncio'} ${newStatus === 'ACTIVE' ? 'ativado(a)' : 'pausado(a)'}`);
                // In a real app we might update local state optimistically, but revalidatePath handles it for top level.
                // For nested items, we might need to update local state if we don't want to re-fetch everything.
                // For simplified UX, let's just toast. The server revalidation updates the page prop `campaigns`.
                // BUT nested items (loadedAdSets/Ads) are CLIENT state. We MUST update them manually.

                if (type === 'ADSET') {
                    // Update loadedAdSets
                    const parentCampaignId = Object.keys(loadedAdSets).find(cid => loadedAdSets[cid].some(as => as.id === id));
                    if (parentCampaignId) {
                        setLoadedAdSets(prev => ({
                            ...prev,
                            [parentCampaignId]: prev[parentCampaignId].map(as => as.id === id ? { ...as, status: newStatus } : as)
                        }));
                    }
                } else if (type === 'AD') {
                    // Update loadedAds
                    const parentAdSetId = Object.keys(loadedAds).find(asid => loadedAds[asid].some(ad => ad.id === id));
                    if (parentAdSetId) {
                        setLoadedAds(prev => ({
                            ...prev,
                            [parentAdSetId]: prev[parentAdSetId].map(ad => ad.id === id ? { ...ad, status: newStatus } : ad)
                        }));
                    }
                }

            } else {
                toast.error(`Erro: ${res.error}`);
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
        const isExpanded = expandedCampaigns.has(campaignId);
        const newSet = new Set(expandedCampaigns);

        if (isExpanded) {
            newSet.delete(campaignId);
            setExpandedCampaigns(newSet);
        } else {
            newSet.add(campaignId);
            setExpandedCampaigns(newSet);

            if (!loadedAdSets[campaignId]) {
                setLoadingIds(prev => new Set(prev).add(`load-${campaignId}`));
                try {
                    const res = await getCampaignAdSetsQuery(campaignId);

                    if (res?.success) {
                        setLoadedAdSets(prev => ({ ...prev, [campaignId]: res.data || [] }));
                        setAdSetErrors(prev => { const n = { ...prev }; delete n[campaignId]; return n; });
                    } else {
                        const errorVal = (res as any)?.error;
                        const msg = errorVal ? (typeof errorVal === 'string' ? errorVal : JSON.stringify(errorVal)) : "Erro desconhecido";
                        setAdSetErrors(prev => ({ ...prev, [campaignId]: msg }));
                        toast.error("Erro: " + msg);
                    }
                } catch (err: any) {
                    const msg = "Erro de conexão: " + (err.message || "Falha na requisição");
                    setAdSetErrors(prev => ({ ...prev, [campaignId]: msg }));
                    toast.error(msg);
                } finally {
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        next.delete(`load-${campaignId}`);
                        return next;
                    });
                }
            }
        }
    };

    const toggleAdSetExpand = async (adSetId: string) => {
        const isExpanded = expandedAdSets.has(adSetId);
        const newSet = new Set(expandedAdSets);

        if (isExpanded) {
            newSet.delete(adSetId);
            setExpandedAdSets(newSet);
        } else {
            newSet.add(adSetId);
            setExpandedAdSets(newSet);

            if (!loadedAds[adSetId]) {
                setLoadingIds(prev => new Set(prev).add(`load-${adSetId}`));
                try {
                    const res = await getAdSetAdsQuery(adSetId);

                    if (res?.success) {
                        setLoadedAds(prev => ({ ...prev, [adSetId]: res.data || [] }));
                        setAdErrors(prev => { const n = { ...prev }; delete n[adSetId]; return n; });
                    } else {
                        const errorVal = (res as any)?.error;
                        const msg = errorVal ? (typeof errorVal === 'string' ? errorVal : JSON.stringify(errorVal)) : "Erro desconhecido";
                        setAdErrors(prev => ({ ...prev, [adSetId]: msg }));
                        toast.error("Erro: " + msg);
                    }
                } catch (err: any) {
                    const msg = "Erro de conexão: " + (err.message || "Falha na requisição");
                    setAdErrors(prev => ({ ...prev, [adSetId]: msg }));
                    toast.error(msg);
                } finally {
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        next.delete(`load-${adSetId}`);
                        return next;
                    });
                }
            }
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50'
            : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
            }`}>
            {status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
        </Badge>
    );

    return (
        <div className="space-y-6">
            {campaigns.length === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Layers className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhuma campanha encontrada</p>
                    <p className="text-sm">Verifique sua conexão ou tente sincronizar novamente.</p>
                </div>
            ) : (
                campaigns.map((c) => (
                    <div
                        key={c.id}
                        className={`rounded-3xl border transition-all duration-200 overflow-hidden ${expandedCampaigns.has(c.id)
                            ? 'bg-white dark:bg-[#0B1120] border-indigo-500/30 shadow-lg ring-1 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        {/* CAMPAIGN HEADER */}
                        <div
                            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer group"
                            onClick={() => toggleCampaignExpand(c.id)}
                        >
                            {/* Left: Status & Main Info */}
                            <div className="flex items-start md:items-center gap-4 flex-1">
                                <div onClick={(e) => e.stopPropagation()} className="pt-1 md:pt-0">
                                    {loadingIds.has(c.id) ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    ) : (
                                        <Switch
                                            checked={c.status === 'ACTIVE'}
                                            onCheckedChange={() => toggleStatus(c.id, 'CAMPAIGN', c.status, c.name)}
                                            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent"
                                        />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-indigo-400 transition-colors">
                                            {c.name}
                                        </h3>
                                        <StatusBadge status={c.status} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                            {c.objective?.replace(/_/g, " ") || 'N/A'}
                                        </span>
                                        {c.id && <span className="text-slate-400 font-mono text-[10px]">#{c.id.slice(-6)}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Budget & Expand */}
                            <div className="flex items-center justify-between md:justify-end gap-6 pl-14 md:pl-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0 mt-2 md:mt-0 w-full md:w-auto">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 font-mono">
                                        {c.daily_budget
                                            ? `R$ ${(c.daily_budget / 100).toFixed(2)}`
                                            : c.lifetime_budget
                                                ? `R$ ${(c.lifetime_budget / 100).toFixed(2)}`
                                                : '-'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                        {c.daily_budget ? 'Diário' : c.lifetime_budget ? 'Total' : 'Orçamento'}
                                    </p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full h-8 w-8 text-slate-400 transition-transform duration-200 ${expandedCampaigns.has(c.id) ? 'rotate-180 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}
                                >
                                    <ChevronDown className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* EXPANDED AD SETS */}
                        {expandedCampaigns.has(c.id) && (
                            <div className="px-4 pb-6 md:px-6 md:pb-6 relative z-10">
                                <div className="pl-4 md:pl-8 space-y-4 border-l-2 border-slate-200 dark:border-slate-800/60 ml-3 md:ml-4">

                                    <div className="flex items-center gap-3 py-2">
                                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-8"></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conjuntos de Anúncios</span>
                                    </div>

                                    {!loadedAdSets[c.id] || loadedAdSets[c.id].length === 0 ? (
                                        <div className="text-sm p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            {adSetErrors[c.id] ? (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-red-500 font-medium flex items-center gap-2">
                                                        <XCircle className="h-4 w-4" />
                                                        Erro ao carregar conjuntos
                                                    </p>
                                                    <p className="text-xs text-red-400 font-mono bg-red-50 dark:bg-red-900/10 p-3 rounded-lg break-all border border-red-100 dark:border-red-900/20">
                                                        {adSetErrors[c.id]}
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-fit"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            setAdSetErrors(prev => { const n = { ...prev }; delete n[c.id]; return n; });
                                                            setLoadingIds(prev => new Set(prev).add(`load-${c.id}`));
                                                            const res = await getCampaignAdSetsQuery(c.id);

                                                            if (res.success && res.data) {
                                                                setLoadedAdSets(prev => ({ ...prev, [c.id]: res.data }));
                                                            } else {
                                                                const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error || "Erro desconhecido");
                                                                setAdSetErrors(prev => ({ ...prev, [c.id]: msg }));
                                                            }
                                                            setLoadingIds(prev => { const next = new Set(prev); next.delete(`load-${c.id}`); return next; });
                                                        }}
                                                    >
                                                        Tentar Novamente
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                                                    <Layers className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="italic">Nenhum conjunto encontrado nesta campanha.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {loadedAdSets[c.id].map(adSet => (
                                                <div key={adSet.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111827] overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
                                                    {/* AD SET HEADER */}
                                                    <div
                                                        className="flex items-center p-4 gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group/adset"
                                                        onClick={() => toggleAdSetExpand(adSet.id)}
                                                    >
                                                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold group-hover/adset:bg-indigo-500 group-hover/adset:text-white transition-colors">
                                                            {expandedAdSets.has(adSet.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                        </span>

                                                        <div className="flex items-center gap-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                                            {loadingIds.has(adSet.id) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                            ) : (
                                                                <Switch
                                                                    checked={adSet.status === 'ACTIVE'}
                                                                    onCheckedChange={() => toggleStatus(adSet.id, 'ADSET', adSet.status, adSet.name)}
                                                                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 scale-90"
                                                                />
                                                            )}
                                                            <StatusBadge status={adSet.status} />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover/adset:text-indigo-400 transition-colors">
                                                                {adSet.name}
                                                            </p>
                                                        </div>

                                                        <Badge variant="secondary" className="hidden sm:flex text-[10px] font-mono font-normal">
                                                            {adSet.billing_event || 'Unknown'}
                                                        </Badge>
                                                    </div>

                                                    {/* ADS LIST */}
                                                    {expandedAdSets.has(adSet.id) && (
                                                        <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 p-3 pl-4 sm:pl-12">
                                                            <h5 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-1">
                                                                <MousePointerClick className="h-3 w-3" /> Anúncios
                                                            </h5>

                                                            {!loadedAds[adSet.id] || loadedAds[adSet.id].length === 0 ? (
                                                                <div className="text-sm p-4 text-center border dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                                    {adErrors[adSet.id] ? (
                                                                        <span className="text-red-400 text-xs">{adErrors[adSet.id]}</span>
                                                                    ) : (
                                                                        <p className="text-xs text-slate-400 italic">Nenhum anúncio encontrado.</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="grid gap-2">
                                                                    {loadedAds[adSet.id].map(ad => (
                                                                        <div key={ad.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-indigo-500/30 transition-all group/ad">
                                                                            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                                {ad.creative?.thumbnail_url ? (
                                                                                    <img src={ad.creative.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                                                                ) : (
                                                                                    <ImageIcon className="h-5 w-5 text-slate-400" />
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover/ad:text-indigo-400 transition-colors">
                                                                                    {ad.name}
                                                                                </p>
                                                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                                    {ad.creative?.title || 'Sem título'}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                                                <StatusBadge status={ad.status} />
                                                                                {loadingIds.has(ad.id) ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                                                ) : (
                                                                                    <Switch
                                                                                        checked={ad.status === 'ACTIVE'}
                                                                                        onCheckedChange={() => toggleStatus(ad.id, 'AD', ad.status, ad.name)}
                                                                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 scale-75"
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
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
