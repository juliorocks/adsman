
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'ads-ai-verify'

serve(async (req) => {
    const url = new URL(req.url)

    // 1. Meta Webhook Verification
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED')
            return new Response(challenge, { status: 200 })
        }
        return new Response('Forbidden', { status: 403 })
    }

    // 2. Process Webhook Notifications
    if (req.method === 'POST') {
        try {
            const body = await req.json()
            console.log('Webhook received:', JSON.stringify(body, null, 2))

            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

            // Logic to update campaign status based on Meta change
            if (body.object === 'page') {
                // Placeholder: Here we would parse Meta Ad Account / Campaign changes
                // and sync to public.campaigns table
            }

            return new Response('EVENT_RECEIVED', { status: 200 })
        } catch (err) {
            console.error('Error processing webhook:', err)
            return new Response('Error', { status: 500 })
        }
    }

    return new Response('Not Found', { status: 404 })
})
