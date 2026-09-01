import { SupabaseClient } from '@supabase/supabase-js'
import { getGmailTokens, storeGmailTokens, type GmailTokens } from './vault'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

/** Check if token needs refresh (within 5 min of expiry or already expired) */
export function shouldRefreshToken(expiresAt: number | undefined): boolean {
  if (!expiresAt) return true
  const now = Math.floor(Date.now() / 1000)
  return expiresAt - now < 300
}

/** Build Google OAuth consent URL */
export function buildAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GmailTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  }
}

/** Refresh access token using refresh_token */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_at: number
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  }
}

/** Get a valid access token, refreshing if needed */
export async function getValidAccessToken(
  adminClient: SupabaseClient,
  userId: string
): Promise<string> {
  const tokens = await getGmailTokens(adminClient, userId)
  if (!tokens) throw new Error('No Gmail tokens found for user')

  if (!shouldRefreshToken(tokens.expires_at)) {
    return tokens.access_token
  }

  if (!tokens.refresh_token) throw new Error('No refresh token available')

  const refreshed = await refreshAccessToken(tokens.refresh_token)
  const updated: GmailTokens = {
    ...tokens,
    access_token: refreshed.access_token,
    expires_at: refreshed.expires_at,
  }
  await storeGmailTokens(adminClient, userId, updated)
  return updated.access_token
}
