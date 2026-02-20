import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton";
import { getIntegration, getOpenAIKey } from "@/lib/data/settings";
import { OpenAIKeyForm } from "@/components/settings/OpenAIKeyForm";

export default async function SettingsPage() {
    let integration: any = null;
    let openAIKey: string | null = null;

    try {
        integration = await getIntegration();
    } catch (e) {
        console.error("SettingsPage: Error loading integration:", e);
    }

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
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fonte de Dados</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                <ConnectMetaButton isConnected={isConnected} />
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
