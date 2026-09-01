import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
    }
  )
}
