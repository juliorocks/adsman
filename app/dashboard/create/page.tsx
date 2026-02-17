
import { SmartCampaignWizard } from "@/components/dashboard/SmartCampaignWizard";

export const dynamic = 'force-dynamic';

export default function CreateCampaignPage() {
    return (
        <div className="space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Criar Campanha Inteligente</h2>
                <p className="text-slate-500">A nossa IA cuidará de toda a complexidade técnica do Meta Ads para você.</p>
            </div>

            <div className="mt-8">
                <SmartCampaignWizard />
            </div>
        </div>
    );
}
