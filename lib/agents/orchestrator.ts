
import { runPerformanceAudit } from "./auditor";
import { runScaleStrategy } from "./strategist";
import { generateCreativeIdeas } from "./creative";
import { getDashboardMetrics } from "../data/metrics";

import { decrypt } from "../security/vault";
import { updateObjectStatus, updateBudget } from "../meta/api";
import { getIntegration } from "../data/settings";

export async function runAgentSquad() {
    console.log("Squad calling to action...");

    // 1. Get snapshot of current performance
    const metrics = await getDashboardMetrics({ datePreset: 'last_7d' });

    // 2. Parallel run of all agents
    const [audit, scaling, creatives] = await Promise.all([
        runPerformanceAudit(metrics),
        runScaleStrategy(metrics),
        generateCreativeIdeas()
    ]);

    // 3. Coordination Logic (The Manager)
    const criticalIssues = audit.recommendations.filter(r => r.type === 'critical');
    const scaleOps = scaling.filter(s => s.type === 'scale_up');

    return {
        timestamp: new Date().toISOString(),
        overallScore: audit.score,
        summary: audit.summary,
        decisions: {
            critical: criticalIssues,
            scaling: scaleOps,
            creatives: creatives.slice(0, 2)
        }
    };
}

/**
 * MASTER ORCHESTRATOR LOOP
 * This function is the engine for the "24x7 Autonomous Mode".
 */
export async function runAutonomousOptimization() {
    const integration = await getIntegration();

    // Safety check: is it enabled?
    if (!integration || !integration.is_autonomous) {
        return { success: false, reason: "Mode autonomous disabled or no integration" };
    }

    try {
        const accessToken = decrypt(integration.access_token_ref);
        const result = await runAgentSquad();

        // 1. Automatically apply critical fixes (High CPA/Low ROI)
        const criticalPromises = result.decisions.critical.map(rec => {
            const targetId = rec.id.replace('ai_ad_audit_', '');
            console.log(`[AUTONOMOUS] Pausing underperforming ad: ${targetId}`);
            return updateObjectStatus(targetId, 'PAUSED', accessToken);
        });

        // 2. Automatically apply scaling (High ROAS opportunities)
        const scalingPromises = result.decisions.scaling.map(rec => {
            if (rec.suggestedBudget) {
                console.log(`[AUTONOMOUS] Scaling up adset ${rec.targetId} to R$ ${rec.suggestedBudget}`);
                return updateBudget(rec.targetId, rec.suggestedBudget * 100, 'daily_budget', accessToken);
            }
            return Promise.resolve();
        });

        await Promise.all([...criticalPromises, ...scalingPromises]);

        return { success: true, count: criticalPromises.length + scalingPromises.length };
    } catch (error) {
        console.error("[AUTONOMOUS ERROR]", error);
        return { success: false, error };
    }
}
