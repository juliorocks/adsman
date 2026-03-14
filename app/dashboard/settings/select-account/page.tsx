import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/security/vault";
import { getAdAccounts } from "@/lib/meta/api";
import { SelectAccountForm } from "./SelectAccountForm";
import { Building2 } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

export default async function SelectAccountPage() {
    const pendingIntegrationId = cookies().get("pending_integration_id")?.value;

    if (!pendingIntegrationId) {
        redirect("/dashboard/settings");
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: integration, error: intErr } = await supabaseAdmin
        .from("integrations")
        .select("id, access_token_ref, user_id")
        .eq("id", pendingIntegrationId)
        .single();

    if (intErr || !integration) {
        redirect("/dashboard/settings?error=integration_not_found");
    }

    let accounts: any[] = [];
    let authorizedPageNames: string[] = [];
    let suggestedClientName = "";

    try {
        const token = decrypt(integration.access_token_ref);

        // Get authorized pages (only pages the user granted access to in this OAuth flow)
        const pagesRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=id,name&access_token=${token}`);
        const pagesData = await pagesRes.json();
        authorizedPageNames = (pagesData.data || []).map((p: any) => p.name as string);

        if (authorizedPageNames.length > 0) {
            suggestedClientName = authorizedPageNames[0];
        }

        // Fetch all accessible ad accounts
        const rawAccounts = await getAdAccounts(token);

        // Mark as "suggested" those whose names match authorized pages
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pageWords = authorizedPageNames.flatMap(name =>
            name.split(/\s+/).filter(w => w.length > 3).map(normalize)
        );

        accounts = rawAccounts.map(acc => ({
            ...acc,
            suggested: pageWords.some(word => normalize(acc.name).includes(word))
        }));

        // Sort: suggested first, then alphabetical
        accounts.sort((a, b) => {
            if (a.suggested && !b.suggested) return -1;
            if (!a.suggested && b.suggested) return 1;
            return a.name.localeCompare(b.name);
        });

    } catch (err) {
        console.error("SelectAccountPage: error fetching accounts", err);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 py-12 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-primary-600 px-6 py-5 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-white" />
                    <div>
                        <h1 className="text-lg font-bold text-white">Configurar Nova Conta</h1>
                        <p className="text-primary-200 text-sm">
                            {authorizedPageNames.length > 0
                                ? `Páginas autorizadas: ${authorizedPageNames.join(", ")}`
                                : "Defina o nome do cliente e selecione a conta de anúncios"}
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    {accounts.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-8">
                            Nenhuma conta de anúncios encontrada. Verifique se você tem permissão de administrador no Business Manager.
                        </div>
                    ) : (
                        <SelectAccountForm
                            integrationId={pendingIntegrationId}
                            accounts={accounts}
                            suggestedClientName={suggestedClientName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
