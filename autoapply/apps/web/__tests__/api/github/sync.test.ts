import { vi, it, expect } from 'vitest'

// Mock the Supabase server client and GitHub API functions
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

vi.mock('@/lib/github/sync', () => ({
  getLatestCommitSha: vi.fn().mockResolvedValue('abc123'),
  getRepoDiff: vi.fn().mockResolvedValue(''),
  parseAddedMarkdownRows: vi.fn().mockReturnValue([]),
  regexParseJobRow: vi.fn().mockReturnValue(null),
}))

import { POST } from '@/app/api/jobs/sync/route'
import { NextRequest } from 'next/server'

it('returns 401 when token is wrong', async () => {
  const req = new NextRequest('http://localhost/api/jobs/sync', {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-token' },
  })
  const res = await POST(req)
  expect(res.status).toBe(401)
})

it('does not return 401 when CRON_SECRET matches', async () => {
  process.env.CRON_SECRET = 'test-cron-secret-xyz'
  const req = new NextRequest('http://localhost/api/jobs/sync', {
    method: 'POST',
    headers: { authorization: 'Bearer test-cron-secret-xyz' },
  })
  const res = await POST(req)
  // Auth passes — response may be anything except 401
  expect(res.status).not.toBe(401)
  delete process.env.CRON_SECRET
})
