import { Sidebar } from "@/components/layout/Sidebar";
import { ClientSelector } from "@/components/layout/ClientSelector";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceOwnerId } from "@/lib/data/settings";
import { cookies } from "next/headers";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const MOCK_USER_ID = "de70c0de-ad00-4000-8000-000000000000";

    let clients: any[] = [];
    let activeIntegrationId: string | null = null;
    let userInfo = { name: "Usuário", email: "", initials: "U", isMember: false, role: "" };

    try {
        const supabase = await createClient();
        const { data: userAuth } = await supabase.auth.getUser();
        let userId = userAuth?.user?.id;
        const devSession = cookies().get("dev_session");
        if (!userId && devSession) userId = MOCK_USER_ID;

        if (userId) {
            // Resolve user display info
            if (userId === MOCK_USER_ID) {
                userInfo = { name: "Dev User", email: "dev@local", initials: "DV", isMember: false, role: "admin" };
            } else if (userAuth?.user) {
                const u = userAuth.user;
                const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Usuário";
                const email = u.email || "";
                const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                userInfo = { name, email, initials, isMember: false, role: "admin" };
            }

            // Check if user is a team member (to show role badge)
            const adminDb = createAdminClient();
            const { data: membership } = await adminDb
                .from("team_members")
                .select("role, owner_id")
                .eq("user_id", userId)
                .maybeSingle();

            if (membership) {
                userInfo.isMember = true;
                userInfo.role = membership.role;
            }

            // Load integrations for the effective workspace owner
            const effectiveOwnerId = membership?.owner_id || userId;
            const { data } = await adminDb
                .from("integrations")
                .select("id, client_name, ad_account_id")
                .eq("user_id", effectiveOwnerId)
                .eq("platform", "meta")
                .order("client_name");

            clients = data || [];
            activeIntegrationId = cookies().get("active_integration_id")?.value || null;
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
                userInfo={userInfo}
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
