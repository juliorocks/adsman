import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/security/vault';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();

        // Exchange code for session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session) {
            // Check if we have a provider token (Facebook Access Token)
            const providerToken = session.provider_token;

            if (providerToken && session.user) {
                // Upsert meaning: if there's no integration, create one. If there is, update the token.
                const encryptedToken = encrypt(providerToken);

                await supabase
                    .from('integrations')
                    .upsert({
                        user_id: session.user.id,
                        platform: 'meta',
                        status: 'active',
                        access_token_ref: encryptedToken,
                        name: 'Conexão via Login'
                    }, { onConflict: 'user_id, platform' });
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/login?error=Ocorreu%20um%20erro%20durante%20a%20autenticação`);
}
