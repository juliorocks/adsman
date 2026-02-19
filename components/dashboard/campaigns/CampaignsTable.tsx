"use client";

import { toggleStatusAction, getCampaignAdSetsAction, getAdSetAdsAction } from "@/actions/campaign";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        } catch (error) {
            toast.error("Erro de conexão.");
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
                    const res = await getCampaignAdSetsAction(campaignId);

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
                    const res = await getAdSetAdsAction(adSetId);

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
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead className="text-right">Orçamento</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                Nenhuma campanha encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        campaigns.map((c) => (
                            <>
                                <TableRow
                                    key={c.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                    onClick={() => toggleCampaignExpand(c.id)}
                                >
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => { e.stopPropagation(); toggleCampaignExpand(c.id); }}
                                        >
                                            {loadingIds.has(`load-${c.id}`) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : expandedCampaigns.has(c.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            {loadingIds.has(c.id) ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                            ) : (
                                                <Switch
                                                    checked={c.status === 'ACTIVE'}
                                                    onCheckedChange={() => toggleStatus(c.id, 'CAMPAIGN', c.status, c.name)}
                                                    className="data-[state=checked]:bg-emerald-500 scale-75"
                                                />
                                            )}
                                            <StatusBadge status={c.status} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                        {c.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-slate-500 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                            {c.objective?.replace(/_/g, " ").toLowerCase() || 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-600 dark:text-slate-300">
                                        {c.daily_budget
                                            ? `R$ ${(c.daily_budget / 100).toFixed(2)}/d`
                                            : c.lifetime_budget
                                                ? `R$ ${(c.lifetime_budget / 100).toFixed(2)} total`
                                                : 'N/A'}
                                    </TableCell>
                                </TableRow>

                                {/* AD SETS EXPANSION */}
                                {expandedCampaigns.has(c.id) && (
                                    <TableRow className="bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-50/30">
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="pl-12 pr-4 py-4 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-6 my-2">
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                                    <Layers className="h-3 w-3" /> Conjuntos de Anúncios
                                                </h4>

                                                {!loadedAdSets[c.id] || loadedAdSets[c.id].length === 0 ? (
                                                    <div className="text-sm p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        {adSetErrors[c.id] ? (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-red-500 font-medium flex items-center gap-2">
                                                                    <XCircle className="h-4 w-4" />
                                                                    Erro ao carregar conjuntos:
                                                                </p>
                                                                <p className="text-xs text-red-400 font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                                                    {adSetErrors[c.id]}
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-fit mt-2"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setAdSetErrors(prev => { const n = { ...prev }; delete n[c.id]; return n; });
                                                                        setLoadingIds(prev => new Set(prev).add(`load-${c.id}`));
                                                                        const res = await getCampaignAdSetsAction(c.id);

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
                                                            <p className="text-slate-400 italic">Nenhum conjunto encontrado nesta campanha.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-xl bg-white dark:bg-slate-950 overflow-hidden text-sm">
                                                        {loadedAdSets[c.id].map(adSet => (
                                                            <div key={adSet.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                                                                <div
                                                                    className="flex items-center p-3 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                                                    onClick={() => toggleAdSetExpand(adSet.id)}
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5"
                                                                        onClick={(e) => { e.stopPropagation(); toggleAdSetExpand(adSet.id); }}
                                                                    >
                                                                        {loadingIds.has(`load-${adSet.id}`) ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : expandedAdSets.has(adSet.id) ? (
                                                                            <ChevronDown className="h-3 w-3" />
                                                                        ) : (
                                                                            <ChevronRight className="h-3 w-3" />
                                                                        )}
                                                                    </Button>

                                                                    <div className="flex items-center gap-2 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                                                        {loadingIds.has(adSet.id) ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                                        ) : (
                                                                            <Switch
                                                                                checked={adSet.status === 'ACTIVE'}
                                                                                onCheckedChange={() => toggleStatus(adSet.id, 'ADSET', adSet.status, adSet.name)}
                                                                                className="data-[state=checked]:bg-emerald-500 scale-75"
                                                                            />
                                                                        )}
                                                                        <StatusBadge status={adSet.status} />
                                                                    </div>

                                                                    <span className="font-medium flex-1 truncate">{adSet.name}</span>

                                                                    <span className="text-xs text-slate-500 font-mono">
                                                                        {adSet.billing_event}
                                                                    </span>
                                                                </div>

                                                                {/* ADS EXPANSION */}
                                                                {expandedAdSets.has(adSet.id) && (
                                                                    <div className="pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                                                        <h5 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                                            <MousePointerClick className="h-3 w-3" /> Anúncios
                                                                        </h5>

                                                                        {!loadedAds[adSet.id] || loadedAds[adSet.id].length === 0 ? (
                                                                            <p className="text-xs text-slate-400 italic">Nenhum anúncio encontrado.</p>
                                                                        ) : (
                                                                            <div className="grid gap-2">
                                                                                {loadedAds[adSet.id].map(ad => (
                                                                                    <div key={ad.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                                            {ad.creative?.thumbnail_url ? (
                                                                                                <img src={ad.creative.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                                                                            ) : (
                                                                                                <ImageIcon className="h-4 w-4 text-slate-400" />
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs font-bold truncate">{ad.name}</p>
                                                                                            <p className="text-[10px] text-slate-500 truncate">{ad.creative?.title || 'Sem título'}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                                            {loadingIds.has(ad.id) ? (
                                                                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                                                            ) : (
                                                                                                <Switch
                                                                                                    checked={ad.status === 'ACTIVE'}
                                                                                                    onCheckedChange={() => toggleStatus(ad.id, 'AD', ad.status, ad.name)}
                                                                                                    className="data-[state=checked]:bg-emerald-500 scale-75"
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
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
