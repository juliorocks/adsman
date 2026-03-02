import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/security/vault';

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'AdsAI_Secure_Webhook_2026';

// Initialize Supabase admin client to bypass RLS for webhook ingestion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log("Webhook Verified!");
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check if it's a valid object
        if (body.object !== 'page' && body.object !== 'instagram') {
            return new NextResponse('Not a targeted object type', { status: 404 });
        }

        // Fast tracking and processing array of entries
        const interactionPromises: Promise<any>[] = [];

        for (const entry of body.entry) {
            const pageIdOrIgId = entry.id; // Usually the object ID receiving the message

            // Resolve all integrations matching the incoming page id or ig id
            const { data: matchedIntegrations } = await supabaseAdmin
                .from('integrations')
                .select('id, platform')
                .or(`preferred_page_id.eq.${pageIdOrIgId},preferred_instagram_id.eq.${pageIdOrIgId}`)
                .eq('status', 'active');

            if (!matchedIntegrations || matchedIntegrations.length === 0) {
                console.warn(`No exact matching integration found for ID: ${pageIdOrIgId}. Searching across all active integrations...`);
                // Find all active Meta integrations
                const { data: allIntegrations } = await supabaseAdmin
                    .from('integrations')
                    .select('id, access_token_ref')
                    .eq('platform', 'meta')
                    .eq('status', 'active');

                let foundIntegrations = [];

                for (const integ of allIntegrations || []) {
                    try {
                        const token = decrypt(integ.access_token_ref);
                        const res = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,instagram_business_account&access_token=${token}`);
                        const data = await res.json();

                        if (data.data) {
                            const isMine = data.data.find((p: any) =>
                                p.id === pageIdOrIgId ||
                                p.instagram_business_account?.id === pageIdOrIgId
                            );

                            if (isMine) {
                                foundIntegrations.push({ id: integ.id, platform: 'meta' });

                                // Auto-link to speed up future webhooks for this page
                                const columnToUpdate = body.object === 'instagram' ? 'preferred_instagram_id' : 'preferred_page_id';
                                await supabaseAdmin.from('integrations').update({
                                    [columnToUpdate]: pageIdOrIgId
                                }).eq('id', integ.id);
                            }
                        }
                    } catch (e) {
                        // Decrypt failed or API error, skip user
                    }
                }

                if (foundIntegrations.length > 0) {
                    for (const integ of foundIntegrations) {
                        processEntryForIntegration(integ, entry, body.object, pageIdOrIgId, interactionPromises);
                    }
                } else {
                    console.warn(`No active Meta integration claims Page/IG ID: ${pageIdOrIgId}. Ignoring.`);
                }
                continue;
            }

            // Process for all matched integrations found in the direct query
            for (const matchedIntegration of matchedIntegrations) {
                processEntryForIntegration(matchedIntegration, entry, body.object, pageIdOrIgId, interactionPromises);
            }
        }

        // Fire and forget (actually awaiting parallel inserts but they are fast)
        if (interactionPromises.length > 0) {
            await Promise.allSettled(interactionPromises);

            // Trigger the AI Community Manager worker
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adsman.vercel.app';

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                await fetch(`${appUrl}/api/cron/community-manager`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (triggerErr: any) {
                console.warn("AI Worker triggered but taking too long. Will complete in background or next Cron run:", triggerErr.message);
            }
        }

        // MUST return 200 OK within 20 seconds to keep Meta happy
        return new NextResponse('EVENT_RECEIVED', { status: 200 });

    } catch (error) {
        console.error("Webhook ingestion error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

/**
 * Helper to process an entry and push promises for a specific integration
 */
function processEntryForIntegration(
    integration: { id: string, platform: string },
    entry: any,
    objectType: string,
    pageIdOrIgId: string,
    interactionPromises: Promise<any>[]
) {
    // Handle Messaging (Inbox)
    if (entry.messaging) {
        for (const event of entry.messaging) {
            if (event.message && !event.message.is_echo && event.sender.id !== pageIdOrIgId) {
                interactionPromises.push(
                    supabaseAdmin.from('social_interactions').upsert({
                        integration_id: integration.id,
                        platform: (objectType === 'instagram' ? 'instagram' : 'facebook'),
                        interaction_type: 'message',
                        external_id: event.message.mid,
                        sender_id: event.sender.id,
                        message: event.message.text || '[Media Attachment]',
                        context: {
                            raw: event,
                            page_id: pageIdOrIgId,
                            sender_name: event.sender.name || 'Usuário'
                        }
                    }, { onConflict: 'integration_id,external_id', ignoreDuplicates: true })
                );
            }
        }
    }

    // Handle Changes (Comments/Feed)
    if (entry.changes) {
        for (const change of entry.changes) {
            if (change.field === 'comments' || change.field === 'feed') {
                const val = change.value;
                const isInstagram = objectType === 'instagram' || val.media_id;
                const isAdd = val.verb === 'add' || (!val.verb && val.id);
                const isFromSelf = val.from?.id === pageIdOrIgId;

                if (isAdd && !val.is_hidden && !isFromSelf) {
                    interactionPromises.push(
                        supabaseAdmin.from('social_interactions').upsert({
                            integration_id: integration.id,
                            platform: (isInstagram ? 'instagram' : 'facebook'),
                            interaction_type: 'comment',
                            external_id: val.comment_id || val.id,
                            sender_id: val.from?.id || 'unknown',
                            message: val.text || val.message,
                            context: {
                                post_id: val.post_id || val.media_id || val.media?.id,
                                sender_name: val.from?.name || val.from?.username || 'Seguidor',
                                raw: val,
                                page_id: pageIdOrIgId
                            }
                        }, { onConflict: 'integration_id,external_id', ignoreDuplicates: true })
                    );
                }
            }
        }
    }
}
