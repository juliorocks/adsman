
import { RevenueList } from "@/components/dashboard/RevenueList";
import { getManualRevenue } from "@/actions/revenue";
import { getIntegration } from "@/lib/data/settings";
import { redirect } from "next/navigation";

export default async function RevenuePage() {
    let integration: any = null;
    try {
        integration = await getIntegration();
    } catch (e) {
        console.error("RevenuePage: Error loading integration:", e);
    }

    if (!integration?.ad_account_id) {
        redirect("/dashboard");
    }

    let records: any[] = [];
    try {
        records = await getManualRevenue(integration.ad_account_id);
    } catch (e) {
        console.error("RevenuePage: Error loading revenue:", e);
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <RevenueList records={records as any} />
        </div>
    );
}
