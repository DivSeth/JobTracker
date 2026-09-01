export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  name: 'autoapply-auth',
  path: '/',
  sameSite: 'lax' as const,
  secure: false,
}
