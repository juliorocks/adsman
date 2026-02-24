import { NextResponse } from 'next/server';
import { runAutonomousOptimization } from '@/lib/agents/orchestrator';

export async function GET(request: Request) {
    // Basic security for CRON (e.g., from Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting autonomous agents CRON execution...");
        const result = await runAutonomousOptimization();

        return NextResponse.json({
            success: true,
            status: result.success ? "executed" : "skipped",
            details: result
        });
    } catch (error: any) {
        console.error("CRON execution failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Execution failed"
        }, { status: 500 });
    }
}
