
import { Sidebar } from "@/components/layout/Sidebar";
import { ClientSelector } from "@/components/layout/ClientSelector";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Busca os clientes disponíveis para o seletor
    let clients: any[] = [];
    let activeIntegrationId: string | null = null;

    try {
        const MOCK_USER_ID = "de70c0de-ad00-4000-8000-000000000000";
        const supabase = await createClient();
        const { data: userAuth } = await supabase.auth.getUser();
        let userId = userAuth?.user?.id;
        const devSession = cookies().get("dev_session");
        if (!userId && devSession) userId = MOCK_USER_ID;

        if (userId) {
            const adminDb = createAdminClient();
            const { data } = await adminDb
                .from("integrations")
                .select("id, client_name, ad_account_id")
                .eq("user_id", userId)
                .eq("platform", "meta")
                .order("client_name");

            clients = data || [];

            // Pega o cliente ativo do cookie
            activeIntegrationId = cookies().get("active_integration_id")?.value || null;

            // Se não houver cookie, define o primeiro como padrão
            if (!activeIntegrationId && clients.length > 0) {
                activeIntegrationId = clients[0].id;
            }
        }
    } catch (e) {
        // silencia erros de carregamento do layout
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <Sidebar
                clientSelector={
                    <ClientSelector
                        clients={clients}
                        activeIntegrationId={activeIntegrationId}
                    />
                }
            />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
