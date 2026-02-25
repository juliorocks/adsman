import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton";
import { getIntegration, getOpenAIKey, getGoogleIntegration, getCurrentUserId } from "@/lib/data/settings";
import { OpenAIKeyForm } from "@/components/settings/OpenAIKeyForm";
import { GoogleDriveCard } from "@/components/settings/GoogleDriveCard";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { getTeamMembers } from "@/actions/team";
import { Users2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    let integration: any = null;
    let openAIKey: string | null = null;
    let userId: string | null = null;
    let teamMembers: any[] = [];

    try {
        userId = await getCurrentUserId();
        integration = await getIntegration();
        teamMembers = await getTeamMembers();
    } catch (e) {
        console.error("SettingsPage: Error loading data:", e);
    }

    const googleIntegration = await getGoogleIntegration();

    try {
        openAIKey = await getOpenAIKey();
    } catch (e) {
        console.error("SettingsPage: Error loading OpenAI key:", e);
    }

    const isConnected = !!integration && integration.status === "active";
    const hasOpenAI = !!openAIKey;

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Configurações</h2>
                <p className="text-slate-500">Gerencie suas conexões e preferências da plataforma.</p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <Users2 className="text-slate-400 h-5 w-5" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciamento de Equipe</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                <TeamManagement members={teamMembers} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fonte de Dados</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                <ConnectMetaButton isConnected={isConnected} />
                <GoogleDriveCard isConnected={!!googleIntegration} userId={userId} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inteligência Artificial</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                <OpenAIKeyForm hasKey={hasOpenAI} />
            </section>
        </div>
    );
}
