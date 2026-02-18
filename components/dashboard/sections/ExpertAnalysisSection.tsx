
import { getDashboardMetrics } from "@/lib/data/metrics";
import { runPerformanceAudit } from "@/lib/agents/auditor";
import { runScaleStrategy } from "@/lib/agents/strategist";
import { ExpertActionList } from "../ExpertActionList";
import { getAdCreatives } from "@/lib/meta/api";
import { getIntegration } from "@/lib/data/settings";
import { decrypt } from "@/lib/security/vault";

export async function ExpertAnalysisSection({ adAccountId }: { adAccountId: string }) {
    const integration = await getIntegration();
    if (!integration) return null;

    const accessToken = decrypt(integration.access_token_ref);

    // Parallel fetch for analysis and creatives
    const [metrics, creatives] = await Promise.all([
        getDashboardMetrics({ datePreset: 'last_30d' }),
        getAdCreatives(adAccountId, accessToken)
    ]);

    // Run agents sequentially to support Modal's concurrent request limits
    const audit = await runPerformanceAudit(metrics);
    const scaling = await runScaleStrategy(metrics);

    // Concatenate all expert findings: Audit (Ad level) + Scaling (Adset level)
    const combinedActions = [
        ...(audit?.recommendations || []).map((r: any) => ({
            id: r?.id || Math.random().toString(),
            type: r?.type === 'critical' ? 'pause' : 'optimization',
            targetName: r?.title || 'Anúncio sem nome',
            targetId: r?.targetId || '',
            reason: r?.description || '',
            impact: r?.impact || 'Análise técnica',
            thought: r?.thought || '',
            adImage: r?.adImage || '',
            actionLabel: r?.actionLabel || 'Ver anúncio',
            suggestedBudget: 0,
            currentBudget: 0,
            isAdLevel: true
        })),
        ...(scaling || []).map((s: any) => {
            const adImage = Array.isArray(creatives)
                ? creatives.find((c: any) =>
                    (c.name && s.targetName && (c.name.includes(s.targetName) || s.targetName.includes(c.name)))
                )?.thumbnail_url
                : undefined;
            return {
                ...s,
                targetId: s?.targetId || '',
                adImage: adImage || ''
            };
        })
    ];

    return (
        <ExpertActionList
            recommendations={combinedActions}
            audit={audit}
            isAutonomous={integration.is_autonomous}
        />
    );
}
