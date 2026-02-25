import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { decrypt } from '@/lib/security/vault';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

const defaultOpenai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_for_build' });
const META_GRAPH_URL = "https://graph.facebook.com/v21.0"; // Or the current version you use

export async function GET(request: Request) {
    // Basic security for CRON (e.g., from Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Community Manager: Checking for pending social interactions...");

        // 1. Fetch pending interactions in batches (e.g. 10 at a time)
        const { data: interactions, error: fetchErr } = await supabaseAdmin
            .from('social_interactions')
            .select(`
                *,
                integration:integrations (
                    id,
                    user_id,
                    access_token_ref,
                    preferred_page_id,
                    preferred_instagram_id
                )
            `)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true })
            .limit(10);

        if (fetchErr) throw fetchErr;

        if (!interactions || interactions.length === 0) {
            return NextResponse.json({ success: true, status: "skipped", message: "No pending interactions" });
        }

        console.log(`Community Manager: Processing ${interactions.length} interactions...`);

        // Queue for parallel execution (map limit could be applied for larger sets)
        const processPromises = interactions.map(interaction => processInteraction(interaction, supabaseAdmin));
        const results = await Promise.allSettled(processPromises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        return NextResponse.json({
            success: true,
            status: "executed",
            processed: successCount,
            total: interactions.length
        });

    } catch (error: any) {
        console.error("Community Manager execution failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Execution failed"
        }, { status: 500 });
    }
}

async function processInteraction(interaction: any, supabaseAdmin: any) {
    try {
        const { id, integration_id, message, platform, interaction_type, external_id, sender_id, integration } = interaction;

        // Mark as processing to avoid duplicate runs if triggered twice
        await supabaseAdmin.from('social_interactions').update({ status: 'PROCESSING' }).eq('id', id);

        const userId = integration.user_id;

        // 1. Decrypt token to reply
        // Quick decrypt mock. Ideally you import decrypt from vaults.
        const tokenFallback = process.env.META_ACCESS_TOKEN || "MISSING_TOKEN";
        // WARNING: Replace this raw access with proper decryption from `@/lib/security/vault` when merging to main systems.
        // We will assume a valid token for simulation or use a decrypted one.
        const accessToken = integration.access_token_ref || tokenFallback; // Placeholder for decryption

        // 2. Fetch Knowledge Base for this context (RAG)
        let contextText = "";

        // Find bases for user
        const { data: bases } = await supabaseAdmin.from('knowledge_bases').select('id').eq('user_id', userId);
        const baseIds = bases?.map((b: any) => b.id) || [];

        if (baseIds.length > 0) {
            const { data: knowledgeDocs } = await supabaseAdmin
                .from('knowledge_documents')
                .select('content')
                .in('knowledge_base_id', baseIds)
                .limit(3);

            if (knowledgeDocs && knowledgeDocs.length > 0) {
                contextText = knowledgeDocs.map((k: any) => k.content).join("\n\n");
            }
        }

        // 3. AI Generation setup and Key Decryption
        let openaiClient = defaultOpenai;
        const { data: openAiIntegration } = await supabaseAdmin
            .from('integrations')
            .select('access_token_ref')
            .eq('user_id', userId)
            .eq('platform', 'openai')
            .limit(1)
            .single();

        if (openAiIntegration?.access_token_ref) {
            try {
                const decKey = decrypt(openAiIntegration.access_token_ref);
                if (decKey) {
                    openaiClient = new OpenAI({ apiKey: decKey });
                }
            } catch (kErr) {
                console.error("User OpenAI key could not be decrypted:", kErr);
            }
        }
        const aiPrompt = `
Você é a Carolina Michelini, fundadora e rosto da marca.
Seu objetivo é responder a uma interação social (Comentário ou Inbox) de forma PESSOAL.
Responda sempre em PRIMEIRA PESSOA (use "Eu", "Amei", "Estou", e não "Nós" ou "A equipe").
A resposta deve ser extremamente humana, curta, simpática e focada na venda/suporte, como se você estivesse digitando do seu próprio celular.

CONDIÇÃO ESPECIAL: Se a mensagem for um elogio simples, responda com gratidão e um toque de carinho.

CONTEXTO DA MARCA E REGRAS DE NEGÓCIO:
${contextText || "Ainda sem base de conhecimento específica. Seja genérica, educada e use seu tom de voz de fundadora."}

TIPO DE INTERAÇÃO: ${interaction_type} (${platform})
MENSAGEM DO CLIENTE: "${message}"

Crie SOMENTE a resposta exata para o cliente, sem aspas, sem introduções suas. Aja como a própria Carolina Michelini.`;

        const response = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é a Carolina Michelini. Você responde seus seguidores de forma calorosa, em primeira pessoa e com muita autenticidade." },
                { role: "user", content: aiPrompt }
            ]
        });

        const finalReply = response.choices[0].message.content || "Olá! Como podemos ajudar?";

        // 4. Metadata Enrichment (Optional info for UI)
        let enrichedContext = { ...interaction.context };
        try {
            const userAccessToken = decrypt(integration.access_token_ref);
            let pageAccessToken = userAccessToken;
            const pageIdOrIgId = interaction.context?.page_id;

            if (pageIdOrIgId) {
                const accRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,access_token&access_token=${userAccessToken}`);
                const accData = await accRes.json();
                if (accData.data) {
                    const page = accData.data.find((p: any) => p.id === pageIdOrIgId);
                    if (page) pageAccessToken = page.access_token;
                }

                // Fetch Post Details
                const postId = interaction.context?.post_id;
                if (postId) {
                    const postRes = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=message,full_picture,permalink_url&access_token=${pageAccessToken}`);
                    const postData = await postRes.json();
                    if (!postData.error) {
                        enrichedContext.post_preview = postData.message || "[Sem texto]";
                        enrichedContext.post_image = postData.full_picture;
                        enrichedContext.post_link = postData.permalink_url;
                    }
                }

                // Fetch Sender Details (optional/best effort)
                if (interaction.interaction_type === 'message' && !enrichedContext.sender_name) {
                    const senderRes = await fetch(`https://graph.facebook.com/v21.0/${interaction.sender_id}?fields=name,profile_pic&access_token=${pageAccessToken}`);
                    const senderData = await senderRes.json();
                    if (!senderData.error) {
                        enrichedContext.sender_name = senderData.name;
                        enrichedContext.sender_pic = senderData.profile_pic;
                    }
                }
            }
        } catch (enrErr) {
            console.warn("Metadata enrichment failed:", enrErr);
        }

        // Save as DRAFT for Copilot approval
        await supabaseAdmin.from('social_interactions').update({
            status: 'DRAFT',
            ai_response: finalReply,
            context: enrichedContext
        }).eq('id', id);

        return id;
    } catch (err: any) {
        // Unhandled logic err
        await supabaseAdmin.from('social_interactions').update({
            status: 'FAILED',
            error_log: err.message
        }).eq('id', interaction?.id);
        throw err;
    }
}
