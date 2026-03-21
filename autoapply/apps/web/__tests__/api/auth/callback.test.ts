import { vi, it, expect } from 'vitest'

// Mock the Supabase server client to avoid Next.js cookie request-scope errors
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
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
