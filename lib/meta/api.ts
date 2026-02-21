
const META_API_VERSION = "v19.0";
const META_GRAPH_URL = "https://graph.facebook.com";

export interface AdAccount {
    id: string;
    name: string;
    account_id: string;
    currency: string;
}

export function getAuthUrl(state: string) {
    const appId = process.env.META_APP_ID?.trim() || "";
    const redirectUri = process.env.META_REDIRECT_URI?.trim() || "";

    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        state: state,
        scope: "email,ads_management,ads_read,business_management",
        response_type: "code",
    });

    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
    const appId = process.env.META_APP_ID?.trim() || "";
    const appSecret = process.env.META_APP_SECRET?.trim() || "";
    const redirectUri = process.env.META_REDIRECT_URI?.trim() || "";

    const params = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code,
    });

    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/oauth/access_token?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.access_token;
}

export async function getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    const fields = "id,name,account_id,currency";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/me/adaccounts?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    let accounts: AdAccount[] = data.data || [];

    try {
        const bizUrl = `${META_GRAPH_URL}/${META_API_VERSION}/me/businesses?fields=id,name,owned_ad_accounts{id,name,account_id,currency},client_ad_accounts{id,name,account_id,currency}&access_token=${accessToken}`;
        const bizResponse = await fetch(bizUrl);
        const bizData = await bizResponse.json();

        if (bizData.data) {
            bizData.data.forEach((business: any) => {
                if (business.owned_ad_accounts?.data) {
                    accounts.push(...business.owned_ad_accounts.data);
                }
                if (business.client_ad_accounts?.data) {
                    accounts.push(...business.client_ad_accounts.data);
                }
            });
        }
    } catch (bizErr) {
        // Fallback or log
    }

    return Array.from(new Map(accounts.map(acc => [acc.id, acc])).values());
}

export async function getCampaigns(adAccountId: string, accessToken: string) {
    const fields = "id,name,status,objective,daily_budget,lifetime_budget,created_time";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAdSets(adAccountId: string, accessToken: string) {
    const fields = "id,name,status,billing_event,bid_amount,daily_budget,lifetime_budget";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adsets?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAds(adAccountId: string, accessToken: string) {
    const fields = "id,name,status,adset_id,campaign_id,creative{id,name,thumbnail_url,title,body}";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/ads?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAdSetsForCampaign(campaignId: string, accessToken: string) {
    const fields = "id,name,status,billing_event,daily_budget,lifetime_budget,start_time,end_time";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${campaignId}/adsets?fields=${fields}&limit=50&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAdsForAdSet(adSetId: string, accessToken: string) {
    const fields = "id,name,status,creative{id,name,thumbnail_url,title,body}";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adSetId}/ads?fields=${fields}&limit=50&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAd(adId: string, accessToken: string) {
    const fields = "id,name,status,adset_id,campaign_id,creative{id,name,thumbnail_url,title,body,object_story_spec,image_hash,image_url}";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adId}?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

export async function getAdCreatives(adAccountId: string, accessToken: string) {
    const fields = "id,name,title,body,object_story_spec,thumbnail_url";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives?fields=${fields}&access_token=${accessToken}&limit=10`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getInsights(
    targets: string | string[],
    accessToken: string,
    datePreset: string = 'maximum',
    timeRange?: { since: string; until: string },
    timeIncrement?: number | 'all_days',
    breakdowns?: string
) {
    const fields = "ad_id,adset_id,campaign_id,spend,impressions,clicks,cpc,cpm,actions,conversions,purchase_roas,action_values,date_start,outbound_clicks,cost_per_action_type";
    const idParam = Array.isArray(targets) ? targets.join(',') : targets;

    let url;
    const limit = 500; // Increased limit to avoid truncation of long periods

    if (Array.isArray(targets) && targets.length > 1) {
        url = `${META_GRAPH_URL}/${META_API_VERSION}/?ids=${idParam}&fields=insights.limit(${limit}){${fields}${timeIncrement ? `,time_increment=${timeIncrement}` : ''}${breakdowns ? `,breakdowns=${breakdowns}` : ''}}&access_token=${accessToken}`;
    } else {
        url = `${META_GRAPH_URL}/${META_API_VERSION}/${idParam}/insights?fields=${fields}&access_token=${accessToken}&limit=${limit}${timeIncrement ? `&time_increment=${timeIncrement}` : ''}${breakdowns ? `&breakdowns=${breakdowns}` : ''}`;
    }

    if (timeRange) {
        url += `&time_range=${JSON.stringify(timeRange)}`;
    } else {
        url += `&date_preset=${datePreset}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    if (Array.isArray(targets) && targets.length > 1) {
        // Flatten insights from all requested IDs when using ?ids= batching
        const insights: any[] = [];
        Object.entries(data).forEach(([key, value]: [string, any]) => {
            if (value.insights?.data) {
                insights.push(...value.insights.data);
            }
        });
        return insights;
    }

    return data.data || [];
}

// CREATION METHODS
export async function createCampaign(adAccountId: string, name: string, objective: string, accessToken: string) {
    console.log(`[MetaAPI] Creating campaign: ${name} with objective ${objective} in account ${adAccountId}`);

    // Improved sanitization: remove all newlines and non-standard chars
    const cleanName = name
        .replace(/[\n\r]/g, ' ')
        .replace(/[^\w\s\-\.\!\?]/gi, '')
        .trim()
        .substring(0, 100);

    const body = {
        name: cleanName,
        objective,
        status: 'PAUSED',
        buying_type: 'AUCTION',
        special_ad_categories: [] as string[], // Standard for most API versions
        access_token: accessToken
    };

    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
        console.error("Meta API createCampaign Error:", JSON.stringify(data.error, null, 2));
        throw new Error(`Meta Campaign Error: ${data.error.message} (${data.error.error_subcode || 'no subcode'})`);
    }
    return data;
}

export async function createAdSet(adAccountId: string, campaignId: string, params: any, accessToken: string) {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...params,
            campaign_id: campaignId,
            status: 'PAUSED',
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) {
        console.error("Meta API createAdSet Error:", JSON.stringify(data.error, null, 2));
        throw new Error(`Meta AdSet Error: ${data.error.message} (${data.error.error_subcode || 'no subcode'})`);
    }
    return data;
}

export async function createAdCreative(adAccountId: string, name: string, objectStorySpec: any, accessToken: string) {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            object_story_spec: objectStorySpec,
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) {
        console.error("Meta API Error:", JSON.stringify(data.error, null, 2));
        throw new Error(`Meta API Error: ${data.error.message} (Subcode: ${data.error.error_subcode || 'N/A'}) - Details: ${JSON.stringify(data.error)}`);
    }
    return data;
}

export async function createAd(adAccountId: string, adSetId: string, creativeId: string, name: string, accessToken: string, status: 'ACTIVE' | 'PAUSED' = 'PAUSED') {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: status,
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

export async function updateObjectStatus(id: string, status: 'ACTIVE' | 'PAUSED', accessToken: string) {
    console.log(`[MetaAPI] Updating status of ${id} to ${status}...`);

    // Meta sometimes prefers URL params for simple field updates
    const url = `${META_GRAPH_URL}/${META_API_VERSION}/${id}?status=${status}&access_token=${accessToken}`;

    const response = await fetch(url, {
        method: 'POST'
    });

    const data = await response.json();

    if (data.error) {
        console.error(`[MetaAPI] Error updating ${id}:`, JSON.stringify(data.error, null, 2));
        throw new Error(data.error.message || "Meta API Error");
    }

    console.log(`[MetaAPI] Success updating ${id}:`, JSON.stringify(data));
    return data;
}

export async function updateAdCreativeId(adId: string, creativeId: string, accessToken: string) {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creative: { creative_id: creativeId },
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

export async function updateBudget(id: string, amount: number, type: 'daily_budget' | 'lifetime_budget', accessToken: string) {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            [type]: Math.round(amount),
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}
