import type { User } from '@supabase/supabase-js'

const FALLBACK_DEV_EMAIL = 'seth.divyaansh@gmail.com'

export function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH_BYPASS !== 'true'
}

export function getDevAuthBypassEmail(): string {
  return process.env.DEV_AUTH_BYPASS_EMAIL || process.env.DEV_LOGIN_EMAIL || FALLBACK_DEV_EMAIL
}

export function getDevAuthBypassUserId(): string | null {
  return process.env.DEV_AUTH_BYPASS_USER_ID || null
}

export function buildDevAuthUser(id: string, email = getDevAuthBypassEmail()): User {
  const now = new Date(0).toISOString()

  return {
    id,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: now,
    email,
  } as User
}
