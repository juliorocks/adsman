import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton";
import { getIntegration, getOpenAIKey, getModalKey, getAIPreference } from "@/lib/data/settings";
import { OpenAIKeyForm } from "@/components/settings/OpenAIKeyForm";
import { ModalKeyForm } from "@/components/settings/ModalKeyForm";
import { AIProviderSelector } from "@/components/settings/AIProviderSelector";

export default async function SettingsPage() {
    const integration = await getIntegration();
    const openAIKey = await getOpenAIKey();
    const modalKey = await getModalKey();
    const aiPreference = await getAIPreference();

    const isConnected = !!integration && integration.status === "active";
    const hasOpenAI = !!openAIKey;
    const hasModal = !!modalKey;

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Configurações</h2>
                <p className="text-slate-500 font-sans font-medium">Gerencie suas conexões e preferências da plataforma.</p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Fonte de Dados</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                <ConnectMetaButton isConnected={isConnected} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Motor Neural</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <AIProviderSelector initialPreference={aiPreference} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <OpenAIKeyForm hasKey={hasOpenAI} />
                    <ModalKeyForm hasKey={hasModal} />
                </div>
            </section>
        </div>
    );
}
