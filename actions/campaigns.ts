
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaign(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    const name = formData.get("name") as string || "Nova Campanha";
    const objective = formData.get("objective") as string;
    const budget = parseFloat(formData.get("budget") as string);
    const targeting = formData.get("targeting") as string; // JSON string

    // 1. Get Integration (Mock: Create if not exists for prototype)
    // In real app, we would select existing integration.
    let { data: integration } = await supabase
        .from("integrations")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!integration) {
        const { data: newIntegration, error: intError } = await supabase
            .from("integrations")
            .insert({
                user_id: user.id,
                platform: 'meta',
                status: 'active'
            })
            .select()
            .single();

        if (intError) return { error: "Failed to create integration context" };
        integration = newIntegration;
    }

    if (!integration) {
        return { error: "Failed to resolve integration" };
    }

    // 2. Create Campaign
    const { data: campaign, error: campError } = await supabase
        .from("campaigns")
        .insert({
            meta_campaign_id: `mock_camp_${Date.now()}`, // Mock ID since we don't call Meta API yet
            integration_id: integration.id,
            name: name,
            status: "PAUSED", // Default logic
            objective: objective,
            daily_budget: budget
        })
        .select()
        .single();

    if (campError) {
        console.error(campError);
        return { error: "Failed to create campaign" };
    }

    // 3. Create Ad Set (Mock)
    await supabase
        .from("ad_sets")
        .insert({
            meta_adset_id: `mock_adset_${Date.now()}`,
            campaign_id: campaign.id,
            name: `${name} - Ad Set 1`,
            status: "PAUSED",
            targeting: JSON.parse(targeting || '{}'),
            optimization_goal: objective === "CONVERSIONS" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS"
        });

    revalidatePath("/dashboard");
    return { success: true, campaignId: campaign.id };
}
