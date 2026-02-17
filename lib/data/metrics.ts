
import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    active_campaigns: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await createClient();

    // In a real scenario, we would aggregate data from 'performance_metrics' table.
    // For now, we return mock data with a slight random variance to simulate updates.

    return {
        spend: 4231.00,
        impressions: 45200,
        clicks: 1203,
        roas: 3.4,
        active_campaigns: 12
    };
}

export async function getRecentActivity() {
    const supabase = await createClient();
    const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    if (!campaigns || campaigns.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return [
                { id: "mock_1", name: "Campanha de Verão (Mock)", status: "ACTIVE", created_at: new Date().toISOString() },
                { id: "mock_2", name: "Retargeting (Mock)", status: "PAUSED", created_at: new Date(Date.now() - 86400000).toISOString() }
            ];
        }
    }

    return campaigns || [];
}
