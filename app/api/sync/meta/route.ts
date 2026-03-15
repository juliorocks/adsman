import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/security/vault';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

export const maxDuration = 300; // 5 minutos (Vercel Pro)

export async function POST(request: Request) {
    const { integrationId, userId } = await request.json();

    if (!integrationId || !userId) {
        return NextResponse.json({ error: 'integrationId e userId são obrigatórios' }, { status: 400 });
    }

    // Verificar que a integração pertence ao usuário (ou ao owner do workspace)
    const { data: integration } = await supabaseAdmin
        .from('integrations')
        .select('id, access_token_ref, preferred_instagram_id, preferred_page_id')
        .eq('id', integrationId)
        .eq('status', 'active')
        .single();

    if (!integration) {
        return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    let totalSynced = 0;
    let totalCompleted = 0;

    try {
        const userToken = decrypt(integration.access_token_ref);

        const accountsRes = await fetch(
            `${META_GRAPH_URL}/me/accounts?fields=id,access_token,instagram_business_account,name&access_token=${userToken}`
        );
        const accountsData = await accountsRes.json();
        if (!accountsData.data) {
            return NextResponse.json({ success: false, error: 'Nenhuma página encontrada' });
        }

        for (const page of accountsData.data) {
            const pageToken = page.access_token;
            const igId = page.instagram_business_account?.id;

            if (igId) {
                // Paginar todos os posts do Instagram
                let mediaUrl: string | null =
                    `${META_GRAPH_URL}/${igId}/media?fields=id,caption,media_url,permalink,timestamp&access_token=${pageToken}&limit=20`;
                let pageCount = 0;

                while (mediaUrl && pageCount < 20) { // até 400 posts
                    const mediaRes: Response = await fetch(mediaUrl);
                    const mediaData: any = await mediaRes.json();
                    if (mediaData.error || !mediaData.data) break;

                    for (const post of mediaData.data) {
                        const commentsRes = await fetch(
                            `${META_GRAPH_URL}/${post.id}/comments?fields=id,text,username,timestamp,replies{id,username,from}&access_token=${pageToken}&limit=50`
                        );
                        const commentsData = await commentsRes.json();
                        if (commentsData.error || !commentsData.data) continue;

                        for (const comment of commentsData.data) {
                            if (!comment.text?.trim()) continue;

                            const repliedByAccount = (comment.replies?.data || []).some(
                                (r: any) => r.from?.id === igId
                            );

                            if (repliedByAccount) {
                                const { count } = await supabaseAdmin
                                    .from('social_interactions')
                                    .update({ status: 'COMPLETED' })
                                    .eq('external_id', comment.id)
                                    .in('status', ['PENDING', 'DRAFT'])
                                    .select('id', { count: 'exact', head: true });
                                if (count && count > 0) totalCompleted++;
                                continue;
                            }

                            const { data: existing } = await supabaseAdmin
                                .from('social_interactions').select('id')
                                .eq('external_id', comment.id).maybeSingle();
                            if (existing) continue;

                            await supabaseAdmin.from('social_interactions').insert({
                                integration_id: integrationId,
                                platform: 'instagram',
                                interaction_type: 'comment',
                                external_id: comment.id,
                                sender_id: comment.username || 'unknown',
                                message: comment.text,
                                status: 'PENDING',
                                context: {
                                    sender_name: comment.username || 'Seguidor',
                                    post_id: post.id,
                                    post_preview: post.caption?.slice(0, 100),
                                    post_image: post.media_url,
                                    post_link: post.permalink,
                                    page_id: igId,
                                }
                            });
                            totalSynced++;
                        }
                    }

                    mediaUrl = mediaData.paging?.next || null;
                    pageCount++;
                }

                // DMs do Instagram
                const convRes = await fetch(
                    `${META_GRAPH_URL}/${igId}/conversations?platform=instagram&fields=messages{id,message,from,created_time}&access_token=${pageToken}&limit=20`
                );
                const convData = await convRes.json();
                if (!convData.error && convData.data) {
                    for (const conv of convData.data) {
                        const msgs = conv.messages?.data || [];
                        if (msgs.length === 0) continue;
                        if (msgs[0].from?.id === igId) continue; // já respondemos

                        for (const msg of msgs) {
                            if (msg.from?.id === igId) break;
                            if (!msg.message?.trim()) continue;

                            const { data: existing } = await supabaseAdmin
                                .from('social_interactions').select('id')
                                .eq('external_id', msg.id).maybeSingle();
                            if (existing) continue;

                            await supabaseAdmin.from('social_interactions').insert({
                                integration_id: integrationId,
                                platform: 'instagram',
                                interaction_type: 'message',
                                external_id: msg.id,
                                sender_id: msg.from?.id,
                                message: msg.message,
                                status: 'PENDING',
                                context: {
                                    sender_name: msg.from?.username || msg.from?.name || 'Usuário',
                                    page_id: igId,
                                }
                            });
                            totalSynced++;
                        }
                    }
                }
            }
        }
    } catch (e: any) {
        console.error('sync/meta error:', e.message);
        return NextResponse.json({ success: false, error: e.message, synced: totalSynced });
    }

    // Acionar o community manager para processar os novos PENDING
    if (totalSynced > 0) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adsman.vercel.app';
        fetch(`${appUrl}/api/cron/community-manager`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
        }).catch(() => {});
    }

    return NextResponse.json({ success: true, synced: totalSynced, completed: totalCompleted });
}
