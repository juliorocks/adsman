import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { ActivityLog } from "@/types/logs";

// Helper to get unified user (Supabase or Mock)
async function getUnifiedUser() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return user;
    } catch (e) {
        console.error("Auth error in getUnifiedUser:", e);
    }

    try {
        const devSession = cookies().get("dev_session");
        if (devSession) {
            return { id: "mock_user_id_dev" } as any;
        }
    } catch (e) {
        // ignore cookies error in some contexts
    }

    return null;
}

export async function createLog(log: Omit<ActivityLog, 'id' | 'created_at' | 'user_id'>) {
    const user = await getUnifiedUser();
    if (!user) return; // Should allow guest logs? Maybe not.

    const supabase = await createClient();

    const { error } = await supabase
        .from('activity_logs')
        .insert({
            user_id: user.id,
            action_type: log.action_type,
            description: log.description,
            target_id: log.target_id,
            target_name: log.target_name,
            agent: log.agent,
            status: log.status,
            metadata: log.metadata
        });

    if (error) {
        console.error("Error creating log:", error);
    }
}

export async function getLogs(limit = 100): Promise<ActivityLog[]> {
    const user = await getUnifiedUser();
    if (!user) return [];

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Error fetching logs:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Unexpected error in getLogs:", err);
        return [];
    }
}
