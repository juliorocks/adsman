"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { finalizeIntegration } from "@/actions/settings";
import { CheckCircle2, Building2, Search } from "lucide-react";
import { toast } from "sonner";

type AdAccount = {
    id: string;
    name: string;
    account_id: string;
    currency: string;
    suggested?: boolean;
};

export function SelectAccountForm({
    integrationId,
    accounts,
    suggestedClientName,
}: {
    integrationId: string;
    accounts: AdAccount[];
    suggestedClientName: string;
}) {
    const [clientName, setClientName] = useState(suggestedClientName);
    const [selectedId, setSelectedId] = useState<string | null>(
        accounts.find(a => a.suggested)?.id ?? null
    );
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const filtered = accounts.filter(a =>
        !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.account_id.includes(search)
    );

    const suggested = filtered.filter(a => a.suggested);
    const others = filtered.filter(a => !a.suggested);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return toast.error("Selecione uma conta de anúncios.");
        if (!clientName.trim()) return toast.error("Digite o nome do cliente.");

        setLoading(true);
        try {
            await finalizeIntegration(integrationId, selectedId, clientName.trim());
        } catch (err: any) {
            toast.error(err.message || "Erro ao salvar integração.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Nome do Cliente / Conta
                </label>
                <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Carolina Michelini, Faculdade Cidade Viva..."
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                />
                <p className="text-xs text-slate-400">Este nome aparecerá no seletor de clientes no painel.</p>
            </div>

            {/* Account Selector */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                    Conta de Anúncios
                </label>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou ID..."
                        className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Suggested accounts (match authorized pages) */}
                {suggested.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider px-1">
                            Conta sugerida (corresponde às páginas autorizadas)
                        </p>
                        {suggested.map(acc => (
                            <AccountOption key={acc.id} acc={acc} selected={selectedId === acc.id} onSelect={setSelectedId} highlight />
                        ))}
                    </div>
                )}

                {/* Other accounts */}
                {others.length > 0 && (
                    <div className="space-y-1.5">
                        {suggested.length > 0 && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
                                Outras contas acessíveis
                            </p>
                        )}
                        {others.map(acc => (
                            <AccountOption key={acc.id} acc={acc} selected={selectedId === acc.id} onSelect={setSelectedId} />
                        ))}
                    </div>
                )}

                {filtered.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-4">Nenhuma conta encontrada.</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={loading || !selectedId || !clientName.trim()}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3"
            >
                {loading ? "Salvando..." : "Confirmar e Entrar no Painel"}
            </Button>
        </form>
    );
}

function AccountOption({
    acc,
    selected,
    onSelect,
    highlight,
}: {
    acc: AdAccount;
    selected: boolean;
    onSelect: (id: string) => void;
    highlight?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(acc.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                selected
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                    : highlight
                    ? "border-green-200 bg-green-50 hover:border-green-400"
                    : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
        >
            <div className="flex flex-col">
                <span className="font-medium text-slate-900 text-sm">{acc.name}</span>
                <span className="text-xs text-slate-400">ID: {acc.account_id} · {acc.currency}</span>
            </div>
            <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${selected ? "text-primary-600" : "text-slate-200"}`} />
        </button>
    );
}
