import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { extractTokensFromSession, storeGmailTokens } from '@/lib/gmail/vault'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`, { status: 302 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`, { status: 302 })
  }

  // Store Gmail + Calendar OAuth tokens in Vault (encrypted at rest)
  // Only store if provider_token present (user granted Gmail scope)
  if (data.session.provider_token) {
    try {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const tokens = extractTokensFromSession(data.session)
      await storeGmailTokens(adminClient, data.user.id, tokens)
    } catch (vaultErr) {
      // Non-fatal: log and continue — user can reconnect Gmail later
      console.error('Failed to store Gmail tokens in Vault:', vaultErr)
    }
  }

  return NextResponse.redirect(`${origin}/`, { status: 302 })
}
