
import { RevenueList } from "@/components/dashboard/RevenueList";
import { getManualRevenue } from "@/actions/revenue";
import { getIntegration } from "@/lib/data/settings";
import { redirect } from "next/navigation";

export default async function RevenuePage() {
    const integration = await getIntegration();

    if (!integration?.ad_account_id) {
        redirect("/dashboard");
    }

    const records = await getManualRevenue(integration.ad_account_id);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <RevenueList records={records as any} />
        </div>
    );
}
