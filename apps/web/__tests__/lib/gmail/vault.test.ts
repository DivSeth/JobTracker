import { buildVaultKey, extractTokensFromSession } from '@/lib/gmail/vault'

it('buildVaultKey returns correct key format', () => {
  expect(buildVaultKey('user-123')).toBe('gmail_oauth_user-123')
})

it('extractTokensFromSession returns provider token and refresh token', () => {
  const session = {
    provider_token: 'access_token_abc',
    provider_refresh_token: 'refresh_token_xyz',
  } as any
  const tokens = extractTokensFromSession(session)
  expect(tokens.access_token).toBe('access_token_abc')
  expect(tokens.refresh_token).toBe('refresh_token_xyz')
})

it('extractTokensFromSession throws when provider_token missing', () => {
  const session = { provider_refresh_token: 'refresh' } as any
  expect(() => extractTokensFromSession(session)).toThrow('No provider token in session')
})
