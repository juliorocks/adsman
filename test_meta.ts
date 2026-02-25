import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
// removed dotenv

const ALGORITHM = "aes-256-gcm";
function getSecretKey(): Buffer {
    let _secretKey = null;
    if (_secretKey) return _secretKey;
    const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_dev_key_32_chars_padding";
    _secretKey = crypto.createHash("sha256").update(raw).digest();
    return _secretKey;
}

export const decrypt = (text: string): string => {
    if (!text) return text;
    const parts = text.split(":");
    if (parts.length !== 3) return text;
    const [ivPart, authTagPart, encryptedPart] = parts;
    try {
        const key = getSecretKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivPart, "hex"));
        decipher.setAuthTag(Buffer.from(authTagPart, "hex"));
        let decrypted = decipher.update(encryptedPart, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (err) {
        return "";
    }
};

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
    const { data: records } = await supabase.from('social_interactions').select('*, integration:integrations(access_token_ref)').eq('id', '846c5a7a-f02d-418f-965d-ae917e88a418').single();
    if (!records) return console.log('not found');
    const token = decrypt(records.integration.access_token_ref);
    const postId = records.context.post_id;
    const senderName = records.context.sender_name;
    const pageId = records.context.page_id;

    console.log('Fetching accounts...');
    const accRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,access_token,instagram_business_account&access_token=${token}`);
    const accData = await accRes.json();
    let page = accData.data.find((p: any) => p.id === pageId) || accData.data.find((p: any) => p.instagram_business_account?.id === pageId);

    if (!page) return console.log('Page not found');
    console.log('Page AT found');
    const pageAT = page.access_token;
    const igId = page.instagram_business_account?.id;

    console.log(`Fetching Post ID: ${postId}`);
    const postRes = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=caption,media_url,permalink&access_token=${pageAT}`);
    console.log('Post Data:', await postRes.json());

    console.log(`Fetching Sender: ${senderName} via IG ID ${igId}`);
    const senderRes = await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=business_discovery.username(${senderName}){profile_picture_url}&access_token=${pageAT}`);
    console.log('Sender Data:', await senderRes.json());
}

test();
