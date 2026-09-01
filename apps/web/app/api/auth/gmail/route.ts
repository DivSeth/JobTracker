import { createClient } from '@/lib/supabase/server'
import { buildAuthUrl } from '@/lib/gmail/refresh'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/auth/gmail/callback`
  const authUrl = buildAuthUrl(redirectUri)

  return NextResponse.redirect(authUrl)
}
