
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";
import { getCampaigns } from "@/lib/meta/api";
import { getLogs } from "@/lib/data/logs";
import { CampaignsTable } from "@/components/dashboard/campaigns/CampaignsTable";
import { ActivityFeed } from "@/components/dashboard/campaigns/ActivityFeed";


import { unstable_noStore as noStore } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
    noStore();
    let integration = null;
    let campaigns: any[] = [];
    let error: string | null = null; // Explicit type for error

    try {
        integration = await getIntegration();
    } catch (e) {
        console.error("Error loading integration:", e);
        error = "Erro ao carregar configurações de integração.";
    }

    if (integration && integration.access_token_ref && integration.ad_account_id) {
        try {
            let accessToken: string;
            try {
                accessToken = decrypt(integration.access_token_ref);
            } catch (decryptErr) {
                console.error("Error decrypting token:", decryptErr);
                error = "Erro ao descriptografar token. Reconecte sua conta Meta nas configurações.";
                accessToken = "";
            }

            if (accessToken) {
                campaigns = await getCampaigns(integration.ad_account_id, accessToken);
            }
        } catch (err: any) {
            console.error("Error fetching campaigns:", err);
            error = "Não foi possível carregar as campanhas. Verifique a conexão com a Meta.";
        }
    }

    let logs: any[] = [];
    try {
        logs = await getLogs(50);
    } catch (e) {
        console.error("Error fetching logs:", e);
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Minhas Campanhas
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Gerencie suas campanhas ativas e acompanhe o histórico de alterações dos agentes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Campaigns List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Campanhas Ativas
                            </h2>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                {campaigns.length} Total
                            </span>
                        </div>

                        {error ? (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                                {error}
                            </div>
                        ) : (
                            <CampaignsTable campaigns={campaigns} />
                        )}
                    </div>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                            Histórico de Atividades
                        </h2>
                        <ActivityFeed logs={logs} />
                    </div>
                </div>
            </div>
        </div>
    );
}
