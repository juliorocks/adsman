
import { ConnectMetaButton } from "@/components/settings/ConnectMetaButton";
import { getIntegration } from "@/lib/data/settings";

export default async function SettingsPage() {
    const integration = await getIntegration();
    const isConnected = !!integration && integration.status === "active";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
                <p className="text-slate-500">Gerencie suas conexões e preferências.</p>
            </div>

            <section className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900">Integrações</h3>
                <ConnectMetaButton isConnected={isConnected} />
            </section>
        </div>
    );
}
