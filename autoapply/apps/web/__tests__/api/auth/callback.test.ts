import { vi, it, expect } from 'vitest'

// Mock the Supabase server client to avoid Next.js cookie request-scope errors
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            provider_token: null,
          },
          user: { id: 'user-1' },
        },
        error: null,
      }),
    },
  }),
}))

import { GET } from '@/app/api/auth/callback/route'
import { NextRequest } from 'next/server'

it('redirects to / on successful code exchange', async () => {
  const req = new NextRequest('http://localhost/api/auth/callback?code=test_code')
  const response = await GET(req)
  expect(response.status).toBe(302)
})

it('redirects to /login on missing code', async () => {
  const req = new NextRequest('http://localhost/api/auth/callback')
  const response = await GET(req)
  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toContain('/login')
})

it('redirects to /login with auth tokens in query params for extension sign-in', async () => {
  const req = new NextRequest('http://localhost/api/auth/callback?code=test_code&source=extension')
  const response = await GET(req)

  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toContain('/login?')
  expect(response.headers.get('location')).toContain('access_token=access-token')
  expect(response.headers.get('location')).toContain('refresh_token=refresh-token')
})
