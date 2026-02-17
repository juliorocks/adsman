
import { runPerformanceAudit } from "./auditor";
import { runScaleStrategy } from "./strategist";
import { generateCreativeIdeas } from "./creative";
import { getDashboardMetrics } from "../data/metrics";

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
