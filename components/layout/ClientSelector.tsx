"use client";

import { selectClient } from "@/actions/settings";
import { useTransition } from "react";
import { Building2, ChevronDown, Loader2 } from "lucide-react";

type ClientIntegration = {
    id: string;
    client_name: string | null;
    ad_account_id: string | null;
};

export function ClientSelector({
    clients,
    activeIntegrationId,
}: {
    clients: ClientIntegration[];
    activeIntegrationId: string | null;
}) {
    const [isPending, startTransition] = useTransition();

    const active = clients.find((c) => c.id === activeIntegrationId) || clients[0];

    if (!clients || clients.length === 0) return null;

    const handleSelect = (integrationId: string) => {
        if (integrationId === activeIntegrationId) return;
        startTransition(async () => {
            await selectClient(integrationId);
        });
    };

    return (
        <div className="mx-3 mb-3">
            <p className="px-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Cliente Ativo
            </p>
            <div className="relative">
                <div className="flex items-center gap-2 w-full rounded-xl bg-primary-600/10 border border-primary-600/20 px-3 py-2">
                    <Building2 className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    <select
                        value={active?.id || ""}
                        onChange={(e) => handleSelect(e.target.value)}
                        disabled={isPending}
                        className="bg-transparent text-sm font-semibold text-primary-700 dark:text-primary-300 outline-none w-full cursor-pointer pr-2 truncate"
                    >
                        {clients.map((c) => (
                            <option key={c.id} value={c.id} className="text-slate-900">
                                {c.client_name || c.ad_account_id || c.id.slice(0, 8)}
                            </option>
                        ))}
                    </select>
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary-500 flex-shrink-0" />
                    ) : (
                        <ChevronDown className="h-3 w-3 text-primary-500 flex-shrink-0" />
                    )}
                </div>
            </div>
        </div>
    );
}
