
"use client";

import { useEffect, useState } from "react";
import { Coins, Plus, Check, Loader2, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveManualRevenue } from "@/actions/revenue";

interface ManualRevenueModalProps {
    initialDate?: string;
    initialAmount?: string;
    forceOpen?: boolean;
    onClose?: () => void;
}

export function ManualRevenueModal({
    initialDate,
    initialAmount,
    forceOpen = false,
    onClose
}: ManualRevenueModalProps) {
    const [isOpen, setIsOpen] = useState(forceOpen);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(initialAmount || "0");
    const [salesCount, setSalesCount] = useState("0");
    const [unitPrice, setUnitPrice] = useState("0");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setIsOpen(forceOpen);
        if (initialDate) setDate(initialDate);
        if (initialAmount) setAmount(initialAmount);
    }, [forceOpen, initialDate, initialAmount]);

    // Update total amount when sales count or unit price changes
    useEffect(() => {
        const total = parseFloat(salesCount || "0") * parseFloat(unitPrice || "0");
        setAmount(total.toFixed(2));
    }, [salesCount, unitPrice]);

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveManualRevenue(
                date,
                parseFloat(amount),
                parseInt(salesCount || "0"),
                parseFloat(unitPrice || "0")
            );
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                if (!forceOpen) {
                    setAmount("0");
                    setSalesCount("0");
                    setUnitPrice("0");
                }
                handleClose();
            }, 1000);
        } catch (err) {
            alert("Erro ao salvar faturamento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!forceOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Lançar Faturamento
                </Button>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{initialDate ? 'Editar' : 'Lançar'} Faturamento</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Cálculo de ROAS e CPA baseado no faturamento manual</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Data da Venda
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                    required
                                    disabled={!!initialDate}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Núm. Vendas
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={salesCount}
                                        onChange={(e) => setSalesCount(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Valor Unit. (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest block mb-1">
                                    Total Faturado (Multiplicação Automática)
                                </label>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    R$ {amount}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className={`flex-1 transition-all ${success ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    disabled={loading || success}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                        success ? <Check className="h-4 w-4" /> : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
