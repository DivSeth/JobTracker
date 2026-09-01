import { describe, expect, it } from 'vitest'
import { SUPABASE_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie'

describe('SUPABASE_AUTH_COOKIE_OPTIONS', () => {
  it('uses one explicit storage key for browser, callback, and middleware clients', () => {
    expect(SUPABASE_AUTH_COOKIE_OPTIONS).toEqual({
      name: 'autoapply-auth',
      path: '/',
      sameSite: 'lax',
      secure: false,
    })
  })
})
