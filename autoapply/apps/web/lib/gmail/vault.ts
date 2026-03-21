import { SupabaseClient, Session } from '@supabase/supabase-js'

export interface GmailTokens {
  access_token: string
  refresh_token: string | null
  expires_at?: number // unix timestamp
}

export function buildVaultKey(userId: string): string {
  return `gmail_oauth_${userId}`
}

export function extractTokensFromSession(session: Session): GmailTokens {
  if (!session.provider_token) {
    throw new Error('No provider token in session')
  }
  return {
    access_token: session.provider_token,
    refresh_token: session.provider_refresh_token ?? null,
    expires_at: session.expires_at,
  }
}

/**
 * Store Gmail OAuth tokens in Supabase Vault (encrypted at rest).
 * Called once after OAuth code exchange completes.
 */
export async function storeGmailTokens(
  adminClient: SupabaseClient,
  userId: string,
  tokens: GmailTokens
): Promise<void> {
  const key = buildVaultKey(userId)
  const payload = JSON.stringify(tokens)

  // Check if secret exists; upsert via delete+create (Vault has no native upsert)
  const { data: existing } = await adminClient
    .schema('vault')
    .from('secrets')
    .select('id')
    .eq('name', key)
    .maybeSingle()

  if (existing?.id) {
    await adminClient.rpc('vault.update_secret', { secret_id: existing.id, new_secret: payload })
  } else {
    await adminClient.rpc('vault.create_secret', { secret: payload, name: key })
  }
}

/**
 * Retrieve and decode Gmail OAuth tokens from Vault.
 * Returns null if no tokens stored for this user.
 */
export async function getGmailTokens(
  adminClient: SupabaseClient,
  userId: string
): Promise<GmailTokens | null> {
  const key = buildVaultKey(userId)
  const { data } = await adminClient
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', key)
    .maybeSingle()

  if (!data?.decrypted_secret) return null
  return JSON.parse(data.decrypted_secret) as GmailTokens
}
