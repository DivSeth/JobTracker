import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/gmail/refresh'
import { storeGmailTokens } from '@/lib/gmail/vault'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?gmail_error=denied`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const redirectUri = `${origin}/api/auth/gmail/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await storeGmailTokens(adminClient, user.id, tokens)

    // Mark user as Gmail-connected
    await adminClient
      .from('profiles')
      .update({ gmail_connected_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.redirect(`${origin}/profile?gmail=connected`)
  } catch (err) {
    console.error('Gmail OAuth failed:', err)
    return NextResponse.redirect(`${origin}/profile?gmail_error=token_failed`)
  }
}
