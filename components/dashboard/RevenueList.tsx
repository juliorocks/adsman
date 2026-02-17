
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
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-2 text-sm">
                        <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Histórico de Faturamento</h2>
                    <p className="text-slate-500">Gerencie os lançamentos manuais usados no cálculo do ROAS.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700">Data</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700">Valor Faturado</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                    Nenhum lançamento encontrado para esta conta.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-emerald-600">
                                            <Coins className="h-4 w-4" />
                                            R$ {Number(record.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingRecord(record)}
                                                className="text-slate-300 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50"
                                                title="Editar Lançamento"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={deleting === record.id}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
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
