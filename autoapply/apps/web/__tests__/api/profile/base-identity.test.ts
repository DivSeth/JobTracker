import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/profile/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

type Supa = {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

function buildSupa(user: { id: string } | null, rows: {
  profile?: Record<string, unknown> | null
  regional?: Array<Record<string, unknown>>
  updatedProfile?: Record<string, unknown> | null
  updateError?: { message: string } | null
}): Supa {
  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: rows.profile ?? null }),
        update: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof vi.fn>
    }
    if (table === 'user_regional_identities') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi
          .fn()
          .mockResolvedValue({ data: rows.regional ?? [], error: null }),
      } as unknown as ReturnType<typeof vi.fn>
    }
    throw new Error(`unexpected table ${table}`)
  })
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/profile', () => {
  it('401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupa(null, {}) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns { baseIdentity, regionalIdentities } when authenticated', async () => {
    const profile = { first_name: 'Jane', last_name: 'Doe', linkedin_url: null }
    const regional = [{ id: 'r1', label: 'US student', country: 'US' }]
    vi.mocked(createClient).mockResolvedValue(
      buildSupa({ id: 'u1' }, { profile, regional }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    )
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual({ baseIdentity: profile, regionalIdentities: regional })
  })
})

describe('PATCH /api/profile', () => {
  it('updates base-identity columns and returns updated row', async () => {
    const updated = { first_name: 'Jane', last_name: 'Doe' }
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      })),
    }
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ first_name: 'Jane', last_name: 'Doe' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })

  it('rejects malformed body with 400', async () => {
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(),
    }
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ first_name: 123 }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})
