
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getIntegration } from "@/lib/data/settings";

export async function saveManualRevenue(date: string, amount: number, salesCount: number = 0, unitPrice: number = 0) {
    const integration = await getIntegration();
    if (!integration || !integration.ad_account_id) {
        throw new Error("Ad account not selected");
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from("manual_revenue")
        .upsert({
            ad_account_id: integration.ad_account_id,
            date: date,
            revenue: amount,
            sales_count: salesCount,
            unit_price: unitPrice,
            updated_at: new Date().toISOString()
        }, { onConflict: 'ad_account_id,date' });

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error("Failed to save revenue data");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/revenue");
    return { success: true };
}

export async function deleteManualRevenue(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("manual_revenue")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error("Failed to delete revenue record");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/revenue");
    return { success: true };
}

export async function getManualRevenue(adAccountId: string, startDate?: string, endDate?: string) {
    const supabase = await createClient();

    let query = supabase
        .from("manual_revenue")
        .select("id, revenue, date, sales_count")
        .eq("ad_account_id", adAccountId)
        .order('date', { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;
    if (error) {
        console.error("Fetch Error:", error);
        return [];
    }

    return data;
}
