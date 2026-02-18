"use client";

import { toggleCampaignStatus } from "@/actions/campaign";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, PlayCircle, PauseCircle } from "lucide-react";

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective?: string;
    daily_budget?: number;
    lifetime_budget?: number;
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggle = async (id: string, currentStatus: string, name: string) => {
        setLoadingId(id);
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

        // Optimistic update could happen here but let's wait for server
        try {
            const res = await toggleCampaignStatus(id, newStatus, name);
            if (res.success) {
                toast.success(`Campanha ${newStatus === 'ACTIVE' ? 'ativada' : 'pausada'} com sucesso.`);
            } else {
                toast.error(`Falha ao alterar status: ${res.error}`);
            }
        } catch (error) {
            toast.error("Erro de conexão ao alterar status.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Objetivo</TableHead>
                        <TableHead className="text-right">Orçamento</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                Nenhuma campanha encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        campaigns.map((c) => (
                            <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {loadingId === c.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                        ) : (
                                            <Switch
                                                checked={c.status === 'ACTIVE'}
                                                onCheckedChange={() => handleToggle(c.id, c.status, c.name)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        )}
                                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${c.status === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50'
                                                : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                                            }`}>
                                            {c.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                                        </Badge>
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
                                        ? `R$ ${(c.daily_budget / 100).toFixed(2)} / dia`
                                        : c.lifetime_budget
                                            ? `R$ ${(c.lifetime_budget / 100).toFixed(2)} total`
                                            : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
