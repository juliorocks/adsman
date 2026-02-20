
import { createClient } from "@/lib/supabase/server";

import { cookies } from "next/headers";

export interface BusinessContext {
    id: string;
    content: string;
    category: 'brand' | 'product' | 'audience' | 'competitor' | 'context' | 'links';
    updated_at: string;
}

// Helper to get unified user (Supabase or Mock)
async function getUnifiedUser() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) return user;
    } catch (e) {
        console.error("getUnifiedUser auth error:", e);
    }

    try {
        const devSession = cookies().get("dev_session");
        if (devSession) {
            return { id: "mock_user_id_dev" } as any;
        }
    } catch (e) { }

    return null;
}

export async function getBusinessContext(): Promise<BusinessContext[]> {
    const user = await getUnifiedUser();
    if (!user) return [];

    const supabase = await createClient(); // Re-create client to ensure context is fresh if needed

    // For mock user, we still use Supabase but with the mock ID string. 
    // The table column was altered to TEXT to support this.
    const { data, error } = await supabase
        .from('business_context')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching business context:", error);
        return [];
    }

    return data || [];
}

export async function saveBusinessContext(content: string, category: BusinessContext['category']) {
    const user = await getUnifiedUser();
    if (!user) throw new Error("Unauthorized");

    const supabase = await createClient();
    const { error } = await supabase
        .from('business_context')
        .insert({
            user_id: user.id,
            content,
            category
        });

    if (error) throw error;
}

export async function deleteBusinessContext(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('business_context')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
