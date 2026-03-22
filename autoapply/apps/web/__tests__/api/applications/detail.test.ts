import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }),
}))

import { GET } from '@/app/api/applications/[id]/route'
import { NextRequest } from 'next/server'

it('returns 401 when unauthenticated', async () => {
  const req = new NextRequest('http://localhost/api/applications/123')
  const res = await GET(req, { params: Promise.resolve({ id: '123' }) })
  expect(res.status).toBe(401)
})
