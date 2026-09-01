import { describe, expect, it } from 'vitest'
import { buildOAuthRedirectTo, resolveWebAppOrigin } from '@/lib/auth/oauth'

describe('OAuth redirect helpers', () => {
  it('prefers configured web app origin over browser origin', () => {
    expect(resolveWebAppOrigin({
      configuredOrigin: 'http://127.0.0.1:3000',
      browserOrigin: 'http://localhost:3000',
    })).toBe('http://127.0.0.1:3000')
  })

  it('falls back to browser origin when no app origin is configured', () => {
    expect(resolveWebAppOrigin({
      configuredOrigin: '',
      browserOrigin: 'http://localhost:3000',
    })).toBe('http://localhost:3000')
  })

  it('builds extension callback redirects without depending on the current host', () => {
    expect(buildOAuthRedirectTo({
      configuredOrigin: 'http://127.0.0.1:3000',
      browserOrigin: 'http://localhost:3000',
      source: 'extension',
    })).toBe('http://127.0.0.1:3000/api/auth/callback?source=extension')
  })
})
