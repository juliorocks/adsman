
export const META_API_VERSION = "v21.0";
export const META_GRAPH_URL = "https://graph.facebook.com";

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
    // Note: instagram_actor_id is DEPRECATED, we focus on instagram_business_account
    const fields = "id,name,connected_instagram_account,instagram_business_account";

    // 0. Fetch Ad Account's authorized accounts
    let authorizedIgs: { id: string, username: string }[] = [];
    if (adAccountId) {
        try {
            const accRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}?fields=name,instagram_accounts{id,username}&access_token=${accessToken}`);
            const accData = await accRes.json();
            if (accData.name) debugInfo += `_acc_${accData.name}_`;
            if (accData.instagram_accounts?.data) {
                authorizedIgs = accData.instagram_accounts.data;
                debugInfo += `_authIgs_${authorizedIgs.length}_[${authorizedIgs.map(ig => `${ig.username}:${ig.id}`).join('|')}]_`;
            }
        } catch (e) { }
    }

    // 1. Fetch promote_pages
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

    // Normalizing pages with smart discovery
    let pages = await Promise.all(rawPages.map(async (p) => {
        let igId: string | undefined = p.instagram_business_account?.id; // PRIORITY 1: Modern Business ID
        let source = igId ? "page_biz_field" : "none";

        if (!igId) {
            // PRIORITY 2: Page-linked endpoint (The shadow ID source)
            try {
                const igRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${p.id}/instagram_accounts?fields=id,username&access_token=${accessToken}`);
                const igData = await igRes.json();
                if (igData.data?.[0]?.id) {
                    igId = igData.data[0].id;
                    source = "page_endpoint";
                }
            } catch (e) { }
        }

        if (!igId) {
            // PRIORITY 3: Legacy connected account field
            igId = p.connected_instagram_account?.id;
            if (igId) source = "page_legacy_field";
        }

        return {
            id: p.id,
            name: p.name,
            connected_instagram_account: igId ? { id: igId } : undefined,
            alternative_instagram_ids: authorizedIgs,
            ig_source: source
        };
    }));

    debugInfo += `_pages_[${pages.map(p => `${p.name}:${p.connected_instagram_account?.id || 'NO_IG'}`).join('|')}]_`;

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
    if (data.error) throw new Error(`ImageUpload: ${data.error.message}`);
    const images = data.images;
    if (images) {
        const firstKey = Object.keys(images)[0];
        const imgData = images[firstKey];
        return { hash: imgData.hash, url: imgData.url || '' };
    }
    throw new Error('ImageUpload: No hash returned from Meta');
}

// Upload an image to the ad account from a URL and return the image hash + url
export async function uploadAdImageFromUrl(adAccountId: string, imageUrl: string, accessToken: string): Promise<{ hash: string; url: string }> {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adimages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: imageUrl,
            access_token: accessToken
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`ImageUploadFromUrl: ${data.error.message}`);
    const images = data.images;
    if (images) {
        const firstKey = Object.keys(images)[0];
        const imgData = images[firstKey];
        return { hash: imgData.hash, url: imgData.url || '' };
    }
    throw new Error('ImageUploadFromUrl: No hash returned from Meta');
}

// Upload a video to the ad account from a URL and return the video ID
export async function uploadAdVideoFromUrl(adAccountId: string, videoUrl: string, accessToken: string): Promise<{ id: string }> {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/advideos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_url: videoUrl,
            access_token: accessToken
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(`VideoUploadFromUrl: ${data.error.message}`);
    return { id: data.id || data.video_id };
}

// Upload a video to the ad account and return the video ID
export async function uploadAdVideo(adAccountId: string, videoBase64: string, accessToken: string): Promise<{ id: string }> {
    // Process base64 to binary
    const binaryData = Buffer.from(videoBase64, 'base64');
    const blob = new Blob([binaryData], { type: 'video/mp4' }); // Assuming mp4 for now

    const formData = new FormData();
    formData.append('source', blob, 'video.mp4');
    formData.append('access_token', accessToken);

    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/advideos`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.error) {
        const e = data.error;
        console.error("Meta API uploadAdVideo Error:", JSON.stringify(e, null, 2));
        throw new Error(`VideoUpload: ${e.message} | ${e.error_user_msg || 'none'}`);
    }

    return { id: data.id };
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
    const igList = alternativeIgs || [];
    const idsToTry = Array.from(new Set([
        ...(instagramActorId ? [instagramActorId] : []),
        ...igList.map(ig => ig.id)
    ]));

    const executeAttempt = async (index: number): Promise<any> => {
        const currentIgId = idsToTry[index];
        const isLastIg = index >= idsToTry.length - 1;

        // V21.0 Recommendation: instagram_user_id at root
        const body: any = {
            name,
            object_story_spec: JSON.parse(JSON.stringify(objectStorySpec)),
            access_token: accessToken
        };

        if (currentIgId) {
            body.instagram_user_id = currentIgId;
            console.log(`GAGE: [Attempt ${index}] Creative creation with IG: ${currentIgId}`);
        }

        const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (data.error) {
            const e = data.error;
            const sub = e.error_subcode;
            const code = e.code;
            const msg = (e.message || "").toLowerCase();

            // Extract as much detail as possible from Meta's complex error structure
            const blame = e.error_data?.blame_field || e.error_data?.field || e.error_user_title || 'unknown';
            const extra = e.error_data ? JSON.stringify(e.error_data) : 'none';

            // CRITICAL FIX: Only treat as identity error if it specifically mentions identity/instagram/actor
            // OR if it is one of the definitive identity subcodes.
            // Generic Code 100 (Invalid Parameter) should NOT trigger fallback unless message matches.
            const isIdentitySubcode = sub === 1443226 || sub === 1443225 || sub === 1443115 || sub === 1443552;
            const isIdentityMessage = msg.includes('instagram_user_id') ||
                msg.includes('instagram_actor_id') ||
                msg.includes('instagram_business_account') ||
                msg.includes('identity') || msg.includes('identidade') ||
                msg.includes('actor') || msg.includes('ator') ||
                msg.includes('permission') || msg.includes('permissão') ||
                msg.includes('account') || msg.includes('conta');

            // Thumbnail errors or other format errors should NOT be treated as identity errors
            const isFormattingError = msg.includes('thumbnail') || msg.includes('video') || msg.includes('aspect') || msg.includes('format') || msg.includes('url');

            const isPotentialIgError = (isIdentitySubcode || isIdentityMessage) && !isFormattingError;

            console.warn(`GAGE_ERROR: Attempt ${index} (${currentIgId || 'FB-ONLY'}) failed: ${e.message} (Code: ${code}, Sub: ${sub}, Blame: ${blame})`);

            // If we have an IG ID and it failed with anything that could be identity related...
            if (currentIgId && isPotentialIgError) {
                // FALLBACK 1: Try legacy 'instagram_actor_id' field name at root
                console.log("GAGE_RETRY: Trying alternative 'instagram_actor_id' root field...");
                const altBody = JSON.parse(JSON.stringify(body));
                delete altBody.instagram_user_id;
                altBody.instagram_actor_id = currentIgId;

                const altRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(altBody)
                });
                const altData = await altRes.json();
                if (!altData.error) return { ...altData, ig_linked: true, method: 'actor_id_root' };

                // FALLBACK 2: Try legacy 'instagram_user_id' placement inside object_story_spec
                console.log("GAGE_RETRY: Trying spec.instagram_user_id fallback...");
                const specUserBody = JSON.parse(JSON.stringify(body));
                specUserBody.object_story_spec.instagram_user_id = currentIgId;
                delete specUserBody.instagram_user_id;

                const specUserRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(specUserBody)
                });
                const specUserData = await specUserRes.json();
                if (!specUserData.error) return { ...specUserData, ig_linked: true, method: 'spec_user_id' };

                // FALLBACK 3: Try legacy 'instagram_actor_id' placement inside object_story_spec
                console.log("GAGE_RETRY: Trying spec.instagram_actor_id fallback...");
                const specActorBody = JSON.parse(JSON.stringify(body));
                specActorBody.object_story_spec.instagram_actor_id = currentIgId;
                delete specActorBody.instagram_user_id;

                const specActorRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(specActorBody)
                });
                const specActorData = await specActorRes.json();
                if (!specActorData.error) return { ...specActorData, ig_linked: true, method: 'spec_actor_id' };

                // Rotate to next available Instagram ID if any
                if (!isLastIg) {
                    console.warn(`GAGE_RETRY: Rotating to next available Instagram ID...`);
                    return executeAttempt(index + 1);
                }

                // ABSOLUTE LAST RESORT: Facebook-Only
                console.warn(`GAGE_FALLBACK: Instagram identities exhausted or rejected. Forcing FB-Only attempt...`);
                const fbOnlyBody = JSON.parse(JSON.stringify(body));

                // Deep clean all identity-related fields
                const clean = (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;
                    delete obj.instagram_user_id;
                    delete obj.instagram_actor_id;
                    delete obj.instagram_business_account;
                    Object.values(obj).forEach(val => clean(val));
                };
                clean(fbOnlyBody);

                const fbRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fbOnlyBody)
                });
                const fbData = await fbRes.json();
                if (!fbData.error) {
                    console.log("GAGE_SUCCESS: FB-Only fallback worked!");
                    return { ...fbData, ig_linked: false, ig_error: e.message };
                }

                // If even FB-only fails, throw the FB error
                throw new Error(`Meta V21.0 FB-Fallback Error: ${fbData.error.message} | Original IG Error: ${e.message}`);
            }

            // Not an IG error, OR no more fallback options, return the actual error
            throw new Error(`Meta V21.0 Error: ${e.message} (Code: ${code}, Sub: ${sub}, Blame: ${blame})`);
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
export async function getVideoStatus(videoId: string, accessToken: string) {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${videoId}?fields=status,thumbnails{uri,id,is_preferred}&access_token=${accessToken}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

export async function waitForVideoReady(videoId: string, accessToken: string, maxRetries = 10): Promise<string | null> {
    console.log(`GAGE: Waiting for video ${videoId} processing...`);
    for (let i = 0; i < maxRetries; i++) {
        const data = await getVideoStatus(videoId, accessToken);
        const status = data.status?.video_status;

        console.log(`GAGE: Video ${videoId} status: ${status} (Attempt ${i + 1}/${maxRetries})`);

        if (status === 'ready') {
            // Find preferred thumbnail or first one
            const thumbnail = data.thumbnails?.data?.find((t: any) => t.is_preferred) || data.thumbnails?.data?.[0];
            return thumbnail?.uri || null;
        }

        if (status === 'error') {
            throw new Error(`Meta Video Processing Error: ${data.status?.error_description || 'Unknown'}`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between polls
    }
    return null;
}
