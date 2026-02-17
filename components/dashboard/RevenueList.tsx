
"use client";

import { useState } from "react";
import { Trash2, Calendar, Coins, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteManualRevenue } from "@/actions/revenue";
import { ManualRevenueModal } from "./ManualRevenueModal";
import Link from "next/link";

interface RevenueRecord {
    id: string;
    date: string;
    revenue: number;
}

export function RevenueList({ records }: { records: RevenueRecord[] }) {
    const [deleting, setDeleting] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<RevenueRecord | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) return;
        setDeleting(id);
        try {
            await deleteManualRevenue(id);
        } catch (err) {
            alert("Erro ao excluir");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-2 text-sm">
                        <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Histórico de Faturamento</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie os lançamentos manuais usados no cálculo do ROAS.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Data</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Valor Faturado</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    Nenhum lançamento encontrado para esta conta.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                            {new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                                            <Coins className="h-4 w-4" />
                                            R$ {Number(record.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingRecord(record)}
                                                className="text-slate-300 dark:text-slate-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                                title="Editar Lançamento"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={deleting === record.id}
                                                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Excluir Lançamento"
                                            >
                                                <Trash2 className={`h-5 w-5 ${deleting === record.id ? 'animate-pulse' : ''}`} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingRecord && (
                <ManualRevenueModal
                    initialDate={editingRecord.date}
                    initialAmount={editingRecord.revenue.toString()}
                    forceOpen={true}
                    onClose={() => setEditingRecord(null)}
                />
            )}
        </div>
    );
}
