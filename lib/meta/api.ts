
const META_API_VERSION = "v21.0";
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
        scope: "email,ads_management,ads_read,business_management,pages_show_list,pages_read_engagement",
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

// Fetch Facebook Pages that can be used for ads (tries multiple sources)
export async function getPages(accessToken: string, adAccountId?: string): Promise<{ pages: { id: string; name: string; connected_instagram_account?: { id: string }, alternative_instagram_ids?: { id: string, username: string }[] }[], debug: string }> {
    let rawPages: any[] = [];
    let debugInfo = "";
    const fields = "id,name,connected_instagram_account,instagram_business_account";

    // 0. Fetch Ad Account's authorized Instagram accounts - FOR REFERENCE ONLY
    let authorizedIgs: { id: string, username: string }[] = [];
    if (adAccountId) {
        try {
            const accRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}?fields=name,instagram_accounts{id,username}&access_token=${accessToken}`);
            const accData = await accRes.json();
            if (accData.name) {
                debugInfo += `_acc_${accData.name}_`;
            }
            if (accData.instagram_accounts?.data) {
                authorizedIgs = accData.instagram_accounts.data;
                debugInfo += `_authIgs_${authorizedIgs.length}_[${authorizedIgs.map(ig => `${ig.username}:${ig.id}`).join('|')}]_`;
            }
        } catch (e) { }
    }

    // 1. Try ad account's promote_pages
    if (adAccountId) {
        try {
            const res = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/promote_pages?fields=${fields}&access_token=${accessToken}`);
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                rawPages = data.data;
                debugInfo += `_pp_${data.data.length}_`;
            }
        } catch (e: any) { debugInfo += `_pperr_${e.message}_`; }
    }

    const accKeywords = debugInfo.toLowerCase().split('_').join(' ').split(' ');

    // Normalizing pages with smart IG lookup
    let pages = await Promise.all(rawPages.map(async (p) => {
        let igId: string | undefined = undefined;
        let source = "none";

        // PRIORITY 1: Explicitly check the page's linked instagram_accounts endpoint
        // CRITICAL: We NO LONGER filter this against authorizedIgs because Meta often 
        // expects a Page-Scoped ID that doesn't appear in the Ad Account asset list.
        try {
            const igRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${p.id}/instagram_accounts?fields=id,username&access_token=${accessToken}`);
            const igData = await igRes.json();
            const foundId = igData.data?.[0]?.id;
            if (foundId) {
                igId = foundId;
                source = "page_endpoint_direct";
            }
        } catch (e) { }

        // PRIORITY 2: Business fields (Verify if possible, but use anyway if endpoint failed)
        if (!igId) {
            const fieldId = p.instagram_business_account?.id || p.connected_instagram_account?.id;
            if (fieldId) {
                igId = fieldId;
                source = "page_field";
            }
        }

        // PRIORITY 3: Keyword match from authorized list (The Brute-Force Fallback)
        if (!igId && authorizedIgs.length > 0) {
            const pName = p.name.toLowerCase();
            const bestVerified = authorizedIgs.find(ig =>
                pName.includes(ig.username.toLowerCase()) ||
                ig.username.toLowerCase().includes(pName.substring(0, 5)) ||
                accKeywords.some(kw => kw.length > 3 && ig.username.toLowerCase().includes(kw))
            );
            if (bestVerified) {
                igId = bestVerified.id;
                source = "keyword_match";
            }
        }

        return {
            id: p.id,
            name: p.name,
            connected_instagram_account: igId ? { id: igId } : undefined,
            alternative_instagram_ids: authorizedIgs,
            ig_source: source
        };
    }));

    const igFound = pages.find(p => p.connected_instagram_account);
    if (igFound) {
        const matchingIg = authorizedIgs.find(ig => ig.id === igFound.connected_instagram_account?.id);
        const nameLabel = matchingIg ? matchingIg.username : `ID_${igFound.connected_instagram_account?.id}`;
        debugInfo += `_selIG_${nameLabel}_src_${igFound.ig_source}_`;
    }

    return { pages, debug: debugInfo };
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

// Upload an image to the ad account and return the image hash + url
export async function uploadAdImage(adAccountId: string, imageBase64: string, accessToken: string): Promise<{ hash: string; url: string }> {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adimages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bytes: imageBase64,
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) {
        const e = data.error;
        console.error("Meta API uploadAdImage Error:", JSON.stringify(e, null, 2));
        throw new Error(`ImageUpload: ${e.message} | ${e.error_user_msg || 'none'}`);
    }
    console.log("Meta uploadAdImage full response:", JSON.stringify(data));
    // Response format: { images: { bytes: { hash: "abc123", url: "https://..." } } }
    const images = data.images;
    if (images) {
        const firstKey = Object.keys(images)[0];
        const imgData = images[firstKey];
        return { hash: imgData.hash, url: imgData.url || '' };
    }
    throw new Error('ImageUpload: No hash returned from Meta');
}

// CREATION METHODS
export async function createCampaign(adAccountId: string, name: string, objective: string, accessToken: string) {
    const cleanName = name.replace(/[\n\r]/g, ' ').trim().substring(0, 100) || `Campaign ${Date.now()}`;

    // is_adset_budget_sharing_enabled is REQUIRED in v24.0 when not using campaign budget
    const requestBody = `name=${encodeURIComponent(cleanName)}&objective=${encodeURIComponent(objective)}&status=PAUSED&special_ad_categories=%5B%5D&is_adset_budget_sharing_enabled=0&access_token=${encodeURIComponent(accessToken)}`;

    const url = `${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/campaigns`;

    console.log(`[MetaAPI] POST ${url} (objective=${objective})`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: requestBody
    });
    const data = await response.json();

    if (data.error) {
        const e = data.error;
        // Capture EVERY field Meta returns - we need to find which parameter is invalid
        const fullError = [
            `msg: ${e.message}`,
            `type: ${e.type}`,
            `code: ${e.code}`,
            `sub: ${e.error_subcode}`,
            `title: ${e.error_user_title || 'none'}`,
            `user_msg: ${e.error_user_msg || 'none'}`,
            `trace: ${e.fbtrace_id || 'none'}`,
        ].join(' | ');

        console.error("Meta API FULL Error:", JSON.stringify(data.error, null, 2));
        throw new Error(fullError);
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
        const e = data.error;
        const fullError = [
            `msg: ${e.message}`,
            `type: ${e.type}`,
            `code: ${e.code}`,
            `sub: ${e.error_subcode}`,
            `title: ${e.error_user_title || 'none'}`,
            `user_msg: ${e.error_user_msg || 'none'}`,
            `trace: ${e.fbtrace_id || 'none'}`,
        ].join(' | ');
        console.error("Meta API createAdSet FULL Error:", JSON.stringify(data.error, null, 2));
        throw new Error(`AdSet: ${fullError}`);
    }
    return data;
}

export async function createAdCreative(adAccountId: string, name: string, objectStorySpec: any, accessToken: string, instagramActorId?: string, alternativeIgs?: { id: string, username: string }[]) {
    // Generate unique ordered list of IDs to try
    const igList = alternativeIgs || [];
    const idsToTry = Array.from(new Set([
        ...(instagramActorId ? [instagramActorId] : []),
        ...igList.map(ig => ig.id)
    ]));

    const executeAttempt = async (index: number): Promise<any> => {
        const currentIgId = idsToTry[index];
        const isLastIg = index >= idsToTry.length - 1;
        const currentIgUser = igList.find(ig => ig.id === currentIgId)?.username || 'unknown';

        const body: any = {
            name,
            object_story_spec: JSON.parse(JSON.stringify(objectStorySpec)), // Deep clone
            access_token: accessToken
        };

        if (currentIgId) {
            // TRIPLE PLACEMENT strategy: Root, Spec, and LinkData
            body.instagram_actor_id = currentIgId;
            body.object_story_spec.instagram_actor_id = currentIgId;
            if (body.object_story_spec.link_data) {
                body.object_story_spec.link_data.instagram_actor_id = currentIgId;
            }
            console.log(`DEBUG: Final Triple Attempt ${index + 1}/${idsToTry.length} with IG: ${currentIgUser}`);
        }

        const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (data.error) {
            const errorMsg = data.error.message.toLowerCase();
            const isIgError = errorMsg.includes('instagram_actor_id') ||
                data.error.code === 100 ||
                errorMsg.includes('instagram');
            const isCapabilityError = data.error.code === 3;

            // Handle Capability #3 by removing root-level and retrying specific placement
            if (isCapabilityError && currentIgId) {
                console.warn(`CAPABILITY_FIX: Triple placement was too much. Retrying internal only...`);
                const capBody = { ...body };
                delete capBody.instagram_actor_id;
                const capRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(capBody)
                });
                const capData = await capRes.json();
                if (!capData.error) return { ...capData, ig_linked: true };
            }

            if (currentIgId && (isIgError || isCapabilityError)) {
                console.warn(`RETRY_NEXT: IG ${currentIgUser} failed: ${data.error.message}`);
                if (!isLastIg) return executeAttempt(index + 1);

                // FINAL FB-ONLY FALLBACK
                console.warn(`FINAL_FALLBACK: Switching to Facebook Only after all IG fails`);
                const fbBody = { ...body };
                delete fbBody.instagram_actor_id;
                delete fbBody.object_story_spec.instagram_actor_id;
                if (fbBody.object_story_spec.link_data) delete fbBody.object_story_spec.link_data.instagram_actor_id;

                const fbRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fbBody)
                });
                const fbData = await fbRes.json();
                if (!fbData.error) return { ...fbData, ig_linked: false, ig_error: data.error.message };
                throw new Error(`Creative Full Failure: ${fbData.error.message}`);
            }

            throw new Error(`Meta API: ${data.error.message}`);
        }

        return { ...data, ig_linked: !!currentIgId };
    };

    return executeAttempt(0);
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
    if (data.error) {
        const e = data.error;
        const fullError = [
            `msg: ${e.message}`,
            `code: ${e.code}`,
            `sub: ${e.error_subcode}`,
            `title: ${e.error_user_title || 'none'}`,
            `user_msg: ${e.error_user_msg || 'none'}`,
        ].join(' | ');
        console.error("Meta API createAd FULL Error:", JSON.stringify(data.error, null, 2));
        throw new Error(`Ad: ${fullError}`);
    }
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
