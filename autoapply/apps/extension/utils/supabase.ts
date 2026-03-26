import { createClient } from '@supabase/supabase-js'
import { getStoredAuth } from './storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Create a Supabase client initialized from chrome.storage.local tokens.
 * Must be called fresh on every use since MV3 service workers are ephemeral
 * (Pitfall 2: MV3 Service Worker Lifecycle).
 */
export async function createExtensionClient() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const auth = await getStoredAuth()
  if (auth) {
    await supabase.auth.setSession({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
    })
  }

  return supabase
}
