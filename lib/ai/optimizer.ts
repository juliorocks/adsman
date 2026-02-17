
import { createClient } from "@/lib/supabase/server";
import { updateObjectStatus } from "@/lib/meta/api";
import { decrypt } from "@/lib/security/vault";

export interface OptimizationRule {
    id: string;
    metric: 'roas' | 'cpc' | 'cpa';
    operator: 'lt' | 'gt';
    threshold: number;
    action: 'PAUSE' | 'SCALE';
}

export async function runOptimizationEngine() {
    const supabase = await createClient();

    // 1. Get all active campaigns and their metrics
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
            *,
            performance_metrics (
                spend,
                clicks,
                roas
            ),
            integrations (
                access_token_ref
            )
        `)
        .eq('status', 'ACTIVE');

    if (error || !campaigns) {
        console.error("Error fetching campaigns for optimization:", error);
        return;
    }

    for (const campaign of campaigns) {
        // Simple Logic for ROAS rule
        const metrics = campaign.performance_metrics?.[0]; // Usually we would group/sum by date
        if (!metrics) continue;

        const currentRoas = metrics.roas || 0;

        // Example Rule: If ROAS < 1.0, Pause
        if (currentRoas > 0 && currentRoas < 1.0) {
            console.log(`Optimization: Pausing campaign ${campaign.name} due to low ROAS (${currentRoas})`);

            const accessTokenRef = campaign.integrations?.access_token_ref;
            if (accessTokenRef) {
                const token = decrypt(accessTokenRef);
                await updateObjectStatus(campaign.meta_campaign_id, 'PAUSED', token);

                // Update local DB
                await supabase
                    .from('campaigns')
                    .update({ status: 'PAUSED' })
                    .eq('id', campaign.id);
            }
        }
    }
}
