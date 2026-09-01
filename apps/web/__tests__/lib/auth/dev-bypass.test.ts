import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildDevAuthUser,
  getDevAuthBypassEmail,
  getDevAuthBypassUserId,
  isDevAuthBypassEnabled,
} from '@/lib/auth/dev-bypass'

describe('dev auth bypass helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.DISABLE_AUTH_BYPASS
    delete process.env.DEV_AUTH_BYPASS_EMAIL
    delete process.env.DEV_AUTH_BYPASS_USER_ID
    delete process.env.DEV_LOGIN_EMAIL
  })

  it('enables the hard bypass outside production unless explicitly disabled', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(isDevAuthBypassEnabled()).toBe(true)

    process.env.DISABLE_AUTH_BYPASS = 'true'
    expect(isDevAuthBypassEnabled()).toBe(false)
  })

  it('never enables the hard bypass in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(isDevAuthBypassEnabled()).toBe(false)
  })

  it('builds a stable local user from bypass env settings', () => {
    process.env.DEV_AUTH_BYPASS_USER_ID = 'user-1'
    process.env.DEV_AUTH_BYPASS_EMAIL = 'dev@example.com'

    expect(getDevAuthBypassUserId()).toBe('user-1')
    expect(getDevAuthBypassEmail()).toBe('dev@example.com')
    expect(buildDevAuthUser('user-1')).toMatchObject({
      id: 'user-1',
      email: 'dev@example.com',
      aud: 'authenticated',
    })
  })
})
