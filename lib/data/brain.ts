
import { createClient } from "@/lib/supabase/server";

export interface BusinessContext {
    id: string;
    content: string;
    category: 'brand' | 'product' | 'audience' | 'competitor' | 'links';
    updated_at: string;
}

export async function getBusinessContext(): Promise<BusinessContext[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

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
