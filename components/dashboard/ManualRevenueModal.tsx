
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
    const [amount, setAmount] = useState(initialAmount || "");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setIsOpen(forceOpen);
        if (initialDate) setDate(initialDate);
        if (initialAmount) setAmount(initialAmount);
    }, [forceOpen, initialDate, initialAmount]);

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveManualRevenue(date, parseFloat(amount));
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                if (!forceOpen) setAmount("");
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
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{initialDate ? 'Editar' : 'Lançar'} Faturamento</h3>
                                    <p className="text-xs text-slate-500">Para cálculo de ROAS de alta precisão</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Data da Venda
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                                    required
                                    disabled={!!initialDate} // Usually better to fix date and only edit amount, or re-add
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    Valor Faturado (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold text-slate-900"
                                    required
                                    autoFocus
                                />
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
