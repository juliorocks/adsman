
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
        scope: "email,ads_management,ads_read",
        response_type: "code",
    });

    const authUrl = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
    console.log("META_APP_ID being used:", process.env.META_APP_ID);
    console.log("Generated Auth URL:", authUrl);
    return authUrl;
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
    // Use 'me/adaccounts' endpoint
    const fields = "id,name,account_id,currency";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/me/adaccounts?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
        // If mocking, return dummy data
        if (process.env.NODE_ENV === 'development' && !process.env.META_APP_ID) {
            console.warn("Meta API Error (Expected in Dev without Keys):", data.error.message);
            return [
                { id: "act_123456789", name: "Minha Loja (Mock)", account_id: "123456789", currency: "BRL" },
                { id: "act_987654321", name: "Cliente VIP (Mock)", account_id: "987654321", currency: "USD" },
            ];
        }
        throw new Error(data.error.message);
    }

    return data.data || [];
}

export async function getCampaigns(adAccountId: string, accessToken: string) {
    const fields = "id,name,status,objective,daily_budget,lifetime_budget";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
        if (process.env.NODE_ENV === 'development' && !process.env.META_APP_ID) {
            return [
                { id: "mock_camp_1", name: "Campanha de Verão (Mock)", status: "ACTIVE", objective: "OUTCOME_SALES" },
                { id: "mock_camp_2", name: "Retargeting (Mock)", status: "PAUSED", objective: "OUTCOME_TRAFFIC" }
            ];
        }
        throw new Error(data.error.message);
    }
    return data.data || [];
}

export async function getInsights(adAccountId: string, accessToken: string) {
    const fields = "spend,impressions,clicks,cpc,cpm,actions";
    const response = await fetch(`${META_GRAPH_URL}/${META_API_VERSION}/${adAccountId}/insights?fields=${fields}&date_preset=maximum&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
        if (process.env.NODE_ENV === 'development' && !process.env.META_APP_ID) {
            return [
                { spend: 450.20, impressions: 12000, clicks: 340, cpc: 1.32 }
            ];
        }
        throw new Error(data.error.message);
    }
    return data.data || [];
}
