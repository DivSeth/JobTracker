import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { buildDevAuthUser, getDevAuthBypassEmail, getDevAuthBypassUserId, isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'
import { SUPABASE_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie'

let cachedDevBypassUser: User | null = null

async function resolveDevBypassUser(adminClient: SupabaseClient): Promise<User> {
  if (cachedDevBypassUser) return cachedDevBypassUser

  const configuredUserId = getDevAuthBypassUserId()
  if (configuredUserId) {
    cachedDevBypassUser = buildDevAuthUser(configuredUserId)
    return cachedDevBypassUser
  }

  const email = getDevAuthBypassEmail()
  const { data, error } = await adminClient.auth.admin.listUsers()
  if (error) {
    throw new Error(`Dev auth bypass could not list local users: ${error.message}`)
  }

  const user = data.users.find((candidate) => candidate.email === email) ?? data.users[0]
  if (!user) {
    throw new Error('Dev auth bypass needs at least one local Supabase auth user.')
  }

  cachedDevBypassUser = user
  return user
}

async function createDevBypassClient(): Promise<SupabaseClient | null> {
  if (!isDevAuthBypassEnabled() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  const user = await resolveDevBypassUser(adminClient)

  return Object.assign(adminClient, {
    auth: Object.assign(adminClient.auth, {
      getUser: async () => ({ data: { user }, error: null }),
    }),
  })
}

export async function createClient() {
  const devBypassClient = await createDevBypassClient()
  if (devBypassClient) return devBypassClient

  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
