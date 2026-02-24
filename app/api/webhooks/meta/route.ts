import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const interactionPromises = [];

        for (const entry of body.entry) {
            const pageIdOrIgId = entry.id; // Usually the object ID receiving the message

            // Resolve integration by page id or ig id
            const { data: matchedIntegration } = await supabaseAdmin
                .from('integrations')
                .select('id, platform')
                .or(`preferred_page_id.eq.${pageIdOrIgId},preferred_instagram_id.eq.${pageIdOrIgId}`)
                .eq('status', 'active')
                .limit(1)
                .single();

            if (!matchedIntegration) {
                console.warn(`No active integration found for ID: ${pageIdOrIgId}`);
                continue;
            }

            // Handle Messaging (Inbox)
            if (entry.messaging) {
                for (const event of entry.messaging) {
                    if (event.message && !event.message.is_echo) {
                        interactionPromises.push(
                            supabaseAdmin.from('social_interactions').insert({
                                integration_id: matchedIntegration.id,
                                platform: matchedIntegration.platform || (body.object === 'instagram' ? 'instagram' : 'facebook'),
                                interaction_type: 'message',
                                external_id: event.message.mid,
                                sender_id: event.sender.id,
                                message: event.message.text || '[Media Attachment]',
                                context: { raw: event }
                            })
                        );
                    }
                }
            }

            // Handle Changes (Comments/Feed)
            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'comments' || change.field === 'feed') {
                        const val = change.value;
                        if (val.item === 'comment' && val.verb === 'add' && !val.is_hidden) {
                            interactionPromises.push(
                                supabaseAdmin.from('social_interactions').insert({
                                    integration_id: matchedIntegration.id,
                                    platform: (body.object === 'instagram' ? 'instagram' : 'facebook'),
                                    interaction_type: 'comment',
                                    external_id: val.comment_id,
                                    sender_id: val.from?.id || 'unknown',
                                    message: val.text || val.message,
                                    context: { post_id: val.post_id, raw: val }
                                })
                            );
                        }
                    }
                }
            }
        }

        // Fire and forget (actually awaiting parallel inserts but they are fast)
        if (interactionPromises.length > 0) {
            await Promise.allSettled(interactionPromises);
        }

        // MUST return 200 OK within 20 seconds to keep Meta happy
        return new NextResponse('EVENT_RECEIVED', { status: 200 });

    } catch (error) {
        console.error("Webhook ingestion error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
