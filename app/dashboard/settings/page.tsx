import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton";
import { getIntegration, getOpenAIKey, getGeminiKey, getAIProvider, getGoogleIntegration, getCurrentUserId } from "@/lib/data/settings";
import { AIProviderForm } from "@/components/settings/AIProviderForm";
import { GoogleDriveCard } from "@/components/settings/GoogleDriveCard";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { getTeamMembers } from "@/actions/team";
import { Users2, UserCircle, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    let integration: any = null;
    let openAIKey: string | null = null;
    let userId: string | null = null;
    let teamMembers: any[] = [];
    let metaIntegrations: any[] = [];
    let currentUser: any = null;
    let isMember = false;

    const MOCK_USER_ID = "de70c0de-ad00-4000-8000-000000000000";

    try {
        userId = await getCurrentUserId();
        integration = await getIntegration();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const devSession = cookies().get("dev_session");

        if (user) {
            currentUser = {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
                email: user.email || "",
            };

            // Check if this user is a team member or owner
            const adminDb = createAdminClient();
            const { data: membership } = await adminDb
                .from("team_members")
                .select("owner_id")
                .eq("user_id", user.id)
                .maybeSingle();

            isMember = !!membership;

            // Only owners can manage their team
            if (!isMember) {
                teamMembers = await getTeamMembers();

                // Fetch meta integrations to show in team member access management
                const { data: integrationsData } = await adminDb
                    .from("integrations")
                    .select("id, client_name, ad_account_id")
                    .eq("user_id", user.id)
                    .eq("platform", "meta")
                    .eq("status", "active");
                metaIntegrations = integrationsData || [];
            }
        } else if (devSession) {
            currentUser = { name: "Dev User", email: "dev@local" };
        }
    } catch (e) {
        console.error("SettingsPage: Error loading data:", e);
    }

    const googleIntegration = await getGoogleIntegration();

    let geminiKey: string | null = null;
    let activeProvider: 'openai' | 'gemini' = 'openai';
    try {
        openAIKey = await getOpenAIKey();
        geminiKey = await getGeminiKey();
        activeProvider = await getAIProvider();
    } catch (e) {
        console.error("SettingsPage: Error loading AI keys:", e);
    }

    const isConnected = !!integration && integration.status === "active";
    const hasOpenAI = !!openAIKey;
    const hasGemini = !!geminiKey;
    const isMockUser = userId === MOCK_USER_ID;

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Configurações</h2>
                <p className="text-slate-500">Gerencie suas conexões e preferências da plataforma.</p>
            </div>

            {/* Profile */}
            {currentUser && !isMockUser && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <UserCircle className="text-slate-400 h-5 w-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Meu Perfil</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <ProfileForm currentName={currentUser.name} email={currentUser.email} />
                </section>
            )}

            {/* Password — for all real users (especially invited members) */}
            {currentUser && !isMockUser && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <KeyRound className="text-slate-400 h-5 w-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Segurança</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <PasswordForm />
                </section>
            )}

            {/* Team — only visible to workspace owners */}
            {!isMember && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Users2 className="text-slate-400 h-5 w-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciamento de Equipe</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <TeamManagement members={teamMembers} integrations={metaIntegrations} />
                </section>
            )}

            {/* Data sources — owners only (members inherit from owner) */}
            {!isMember && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fonte de Dados</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <ConnectMetaButton isConnected={isConnected} />
                    <GoogleDriveCard isConnected={!!googleIntegration} userId={userId} />
                </section>
            )}

            {/* AI — owners only */}
            {!isMember && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inteligência Artificial</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <AIProviderForm hasOpenAI={hasOpenAI} hasGemini={hasGemini} activeProvider={activeProvider} />
                </section>
            )}
        </div>
    );
}
