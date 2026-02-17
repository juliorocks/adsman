
"use client";

import { useTransition } from "react";
import { selectAdAccount } from "@/actions/settings";
import { AdAccount } from "@/lib/meta/api";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountSelector({
    accounts,
    currentAccountId
}: {
    accounts: AdAccount[],
    currentAccountId?: string
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const selectedAccount = accounts.find(a => a.id === currentAccountId);

    const handleSelect = (accountId: string) => {
        startTransition(async () => {
            try {
                // We pass null for formData since our action doesn't strictly need it if we change the signature
                // Actually let's just create a new action or fix the signature
                await selectAdAccount(accountId, new FormData());
                router.refresh();
            } catch (error) {
                alert("Erro ao trocar de conta.");
            }
        });
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                Trocar Conta de Anúncios
                {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary-600" />}
            </label>
            <div className="flex gap-2">
                <select
                    value={currentAccountId || ""}
                    onChange={(e) => handleSelect(e.target.value)}
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled>Selecione uma conta...</option>
                    {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.id})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
