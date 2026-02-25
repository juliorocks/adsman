
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
        scope: "email,ads_management,ads_read,business_management,pages_show_list,pages_manage_metadata,pages_read_engagement,pages_messaging",
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

export async function getPixels(adAccountId: string, accessToken: string): Promise<{ id: string; name: string }[]> {
    try {
        const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adspixels?fields=id,name&access_token=${accessToken}`);
        const data = await response.json();
        return data.data || [];
    } catch (e) {
        console.error("Failed to fetch pixels:", e);
        return [];
    }
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

    // 1. Fetch all user pages (Discovery base)
    try {
        const res = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/me/accounts?fields=${fields}&access_token=${accessToken}`);
        const data = await res.json();
        if (data.data) {
            rawPages.push(...data.data);
            debugInfo += `_me${data.data.length}_`;
        }
    } catch (e: any) { debugInfo += `_meerr_${e.message}_`; }

    // 2. Fetch promote_pages (Account specific, overwrites to flag as authorized)
    if (adAccountId) {
        try {
            const res = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/promote_pages?fields=${fields}&access_token=${accessToken}`);
            const data = await res.json();
            if (data.data) {
                const flagged = data.data.map((p: any) => ({ ...p, _from_promote: true }));
                rawPages.push(...flagged);
                debugInfo += `_pp${data.data.length}_`;
            }
        } catch (e: any) { debugInfo += `_pperr_${e.message}_`; }
    }

    // Unique by ID (favor flagged authorized versions)
    const uniqueMap = new Map();
    rawPages.forEach(p => {
        const existing = uniqueMap.get(p.id);
        if (!existing || p._from_promote) {
            uniqueMap.set(p.id, p);
        }
    });
    rawPages = Array.from(uniqueMap.values());

    // Aggressive Discovery: Find the "Holy Grail" ID (Actor, Business, or Page-Backed)
    let pages = await Promise.all(rawPages.map(async (p) => {
        let candidateIds: string[] = [];

        // Path A: Standard Actor Accounts endpoint
        try {
            const res = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${p.id}/instagram_accounts?fields=id&access_token=${accessToken}`);
            const data = await res.json();
            if (data.data) data.data.forEach((ig: any) => candidateIds.push(String(ig.id)));
        } catch (e) { }

        // Path B: Page-Backed Instagram Accounts (Modern "New Page Experience" source)
        try {
            const res = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${p.id}/page_backed_instagram_accounts?fields=id&access_token=${accessToken}`);
            const data = await res.json();
            if (data.data) data.data.forEach((ig: any) => candidateIds.push(String(ig.id)));
        } catch (e) { }

        // Path C: Native Fields (Connected/Business)
        if (p.instagram_business_account?.id) candidateIds.push(String(p.instagram_business_account.id));
        if (p.connected_instagram_account?.id) candidateIds.push(String(p.connected_instagram_account.id));

        candidateIds = Array.from(new Set(candidateIds));

        // Path D: Apex Semantic Scoring
        const authorizedMap = new Map(authorizedIgs.map(ig => [String(ig.id), ig.username || '']));
        const authorizedIgIds = new Set(authorizedMap.keys());

        let igId: string | undefined;
        let source = "none";

        // 1. Direct Metadata Link (Primary Anchor)
        const primaryLink = p.instagram_business_account?.id || p.connected_instagram_account?.id;
        if (primaryLink && authorizedIgIds.has(String(primaryLink))) {
            igId = String(primaryLink);
            source = "primary_metadata_match";
        }

        // 2. Semantic Scoring: Find the BEST name match among authorized candidates
        if (!igId) {
            const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, '');
            const pageCore = clean(p.name);

            let bestScore = -1;
            let bestId = "";

            for (const candId of candidateIds) {
                if (!authorizedIgIds.has(candId)) continue;
                const username = clean(authorizedMap.get(candId) || '');
                if (!username) continue;

                // Score based on overlap and length (closest match wins)
                let score = 0;
                if (pageCore.includes(username)) score += 10;
                if (username.includes(pageCore)) score += 10;
                if (username === pageCore) score += 100; // Perfect match
                score -= Math.abs(username.length - pageCore.length); // Penalty for length difference

                if (score > bestScore) {
                    bestScore = score;
                    bestId = candId;
                }
            }

            if (bestId) {
                igId = bestId;
                source = "semantic_best_match";
            }
        }

        // 3. Last Resort Fallback
        if (!igId) {
            igId = candidateIds.find(id => authorizedIgIds.has(id));
            if (igId) source = "first_authorized_fallback";
        }

        // Emergency Solo Bind
        if (!igId && authorizedIgs.length === 1) {
            igId = String(authorizedIgs[0].id);
            source = "solo_emergency_bind";
        }

        return {
            id: p.id,
            name: p.name,
            _from_promote: !!p._from_promote,
            connected_instagram_account: igId ? { id: igId } : undefined,
            alternative_instagram_ids: authorizedIgs,
            ig_source: source
        };
    }));

    // SECURITY FILTER: Absolute Privacy Wall (Client Context)
    if (adAccountId) {
        const adAccName = (debugInfo.match(/_acc_(.*?)_/) || [])[1]?.toLowerCase() || "";
        const authorizedIgIds = new Set(authorizedIgs.map(ig => String(ig.id)));

        pages = pages.filter(p => {
            // 1. Must be returned by promote_pages (Authoritative link)
            if (!p._from_promote) return false;

            const pageIgId = p.connected_instagram_account?.id;

            // SECURITY RULE #1: Hard rejection of pages linked to unauthorized Instagrams
            if (pageIgId && authorizedIgs.length > 0 && !authorizedIgIds.has(pageIgId)) {
                debugInfo += `_rejectUnauthorizedIg_${p.name}_`;
                return false;
            }

            // Context Matching
            const pageName = p.name.toLowerCase();
            const relevantParts = adAccName.split(' ').filter(part => part.length > 3);
            const isNameMatch = relevantParts.length > 0 && relevantParts.some(part => pageName.includes(part));

            // SECURITY RULE #2: Strict context isolation
            if (pages.length > 1 && !isNameMatch && (!pageIgId || !authorizedIgIds.has(pageIgId))) {
                debugInfo += `_rejectUnrelatedContext_${p.name}_`;
                return false;
            }

            return true;
        });
    }

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
    const fields = "id,name,status,billing_event,bid_amount,daily_budget,lifetime_budget,created_time";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adsets?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAds(adAccountId: string, accessToken: string) {
    const fields = "id,name,status,adset_id,campaign_id,created_time,creative{id,name,thumbnail_url,title,body}";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/ads?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAdSetsForCampaign(campaignId: string, accessToken: string) {
    const fields = "id,name,status,billing_event,daily_budget,lifetime_budget,start_time,end_time,created_time";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${campaignId}/adsets?fields=${fields}&limit=50&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAdsForAdSet(adSetId: string, accessToken: string) {
    const fields = "id,name,status,created_time,creative{id,name,thumbnail_url,title,body}";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adSetId}/ads?fields=${fields}&limit=50&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

export async function getAd(adId: string, accessToken: string) {
    const fields = "id,name,status,adset_id,campaign_id,created_time,creative{id,name,thumbnail_url,title,body,object_story_spec,image_hash,image_url}";
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
export async function createCampaign(adAccountId: string, name: string, objective: string, accessToken: string, status: 'ACTIVE' | 'PAUSED' = 'PAUSED') {
    const cleanName = name.replace(/[\n\r]/g, ' ').trim().substring(0, 100) || `Campaign ${Date.now()}`;

    // is_adset_budget_sharing_enabled is REQUIRED in v24.0 when not using campaign budget
    const requestBody = `name=${encodeURIComponent(cleanName)}&objective=${encodeURIComponent(objective)}&status=${status}&special_ad_categories=%5B%5D&is_adset_budget_sharing_enabled=0&access_token=${encodeURIComponent(accessToken)}`;

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

export async function createAdSet(adAccountId: string, campaignId: string, params: any, accessToken: string, status: 'ACTIVE' | 'PAUSED' = 'PAUSED') {
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...params,
            campaign_id: campaignId,
            status: status,
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
        let currentIgId = idsToTry[index];
        const isLastIg = index >= idsToTry.length - 1;

        // IDENTITY GUARDIAN: If we're on the first attempt and no IG was explicitly passed, 
        // but we have authorized IGs for this specific account context, USE THE FIRST ONE as target.
        // This solves the "missing selection" issue when discovery is inconsistent.
        if (!currentIgId && igList.length > 0 && index === 0) {
            currentIgId = igList[0].id;
            console.log(`GAGE: Identity Guardian active. Auto-selected first authorized IG: ${currentIgId}`);
        }

        // V21.0 Recommendation: instagram_user_id at root
        const body: any = {
            name,
            object_story_spec: JSON.parse(JSON.stringify(objectStorySpec)),
            access_token: accessToken
        };

        if (currentIgId) {
            const igIdStr = String(currentIgId);

            // THE APEX BIND (TESTE16): Unified V21/V22 Identity
            // Redundancy in root anchors is the key to forcing React-based auto-selection.
            body.instagram_actor_id = igIdStr;
            body.instagram_user_id = igIdStr; // Modern root anchor

            // Spec Anchor (The critical asset-link for modern New Page Experiences)
            body.object_story_spec.instagram_actor_id = igIdStr;
            body.object_story_spec.instagram_user_id = igIdStr; // CRITICAL: Added for V21/V22 UI compatibility

            console.log(`GAGE: [Apex Identity] Unified Bind Locked (IG: ${igIdStr})`);
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
            const blame = e.error_data?.blame_field || e.error_data?.field || e.error_user_title || 'unknown';

            // CRITICAL FIX: Identify identity-related errors
            const isIdentitySubcode = sub === 1443226 || sub === 1443225 || sub === 1443115 || sub === 1443552;
            const isIdentityMessage = msg.includes('instagram_user_id') ||
                msg.includes('instagram_actor_id') ||
                msg.includes('instagram_business_account') ||
                msg.includes('identity') || msg.includes('identidade') ||
                msg.includes('actor') || msg.includes('ator') ||
                msg.includes('permission') || msg.includes('permissão');

            const isFormattingError = msg.includes('thumbnail') || msg.includes('video') || msg.includes('aspect') || msg.includes('format') || msg.includes('url');

            const isPotentialIgError = (isIdentitySubcode || isIdentityMessage) && !isFormattingError;

            console.warn(`GAGE_ERROR: Attempt ${index} (${currentIgId || 'FB-ONLY'}) failed: ${e.message} (Code: ${code}, Sub: ${sub}, Blame: ${blame})`);

            if (currentIgId && isPotentialIgError) {
                // FALLBACK 1: Try modern 'instagram_user_id' ONLY (Some accounts prefer this)
                console.log("GAGE_RETRY: Trying modern-only fallback...");
                const modernBody = JSON.parse(JSON.stringify(body));
                delete modernBody.instagram_actor_id;
                if (modernBody.object_story_spec) {
                    delete modernBody.object_story_spec.instagram_actor_id;
                    modernBody.object_story_spec.instagram_user_id = String(currentIgId);
                }
                modernBody.instagram_user_id = String(currentIgId);

                const modernRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(modernBody)
                });
                const modernData = await modernRes.json();
                if (!modernData.error) return { ...modernData, ig_linked: true, method: 'modern_only', ig_id: currentIgId };

                // FALLBACK 2: Try legacy 'instagram_actor_id' ONLY
                console.log("GAGE_RETRY: Trying legacy-only fallback...");
                const legacyBody = JSON.parse(JSON.stringify(body));
                delete legacyBody.instagram_user_id;
                if (legacyBody.object_story_spec) {
                    delete legacyBody.object_story_spec.instagram_user_id;
                    legacyBody.object_story_spec.instagram_actor_id = String(currentIgId);
                }
                legacyBody.instagram_actor_id = String(currentIgId);

                const legacyRes = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/adcreatives`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(legacyBody)
                });
                const legacyData = await legacyRes.json();
                if (!legacyData.error) return { ...legacyData, ig_linked: true, method: 'legacy_only', ig_id: currentIgId };

                // ROTATE OR FAILBACK
                if (!isLastIg) {
                    console.warn(`GAGE_RETRY: Identity error. Rotating to next available ID...`);
                    return executeAttempt(index + 1);
                }

                // ABSOLUTE LAST RESORT: Facebook-Only (Strip everything)
                console.warn(`GAGE_FALLBACK: All Instagram identities failed. Forcing FB-Only creative...`);
                const fbOnlyBody = JSON.parse(JSON.stringify(body));

                const clean = (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;
                    delete obj.instagram_user_id;
                    delete obj.instagram_actor_id;
                    delete obj.instagram_business_account;
                    delete obj.instagram_business_account_id;
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

                throw new Error(`Meta V21.0 FB-Fallback Error: ${fbData.error.message} | Original IG Error: ${e.message}`);
            }

            // Not an IG error, OR no more fallback options, return the actual error
            throw new Error(`Meta V21.0 Error: ${e.message} (Code: ${code}, Sub: ${sub}, Blame: ${blame})`);
        }
        return { ...data, ig_linked: !!currentIgId, ig_id: currentIgId };
    };

    return executeAttempt(0);
}
export async function createAd(adAccountId: string, adSetId: string, creativeId: string, name: string, accessToken: string, status: 'ACTIVE' | 'PAUSED' = 'PAUSED', instagramActorId?: string, trackingSpecs?: any[]) {
    const body: any = {
        name,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: status,
        access_token: accessToken
    };

    if (trackingSpecs && trackingSpecs.length > 0) {
        body.tracking_specs = trackingSpecs;
    }

    if (instagramActorId) {
        const igIdStr = String(instagramActorId);
        body.instagram_actor_id = igIdStr;
        body.instagram_user_id = igIdStr; // V21/V22 Identity
        // The 'instagram_id' field is used by some UI versions to bind the dropdown
        (body as any).instagram_id = igIdStr;
    }

    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
