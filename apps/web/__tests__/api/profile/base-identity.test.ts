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
  profileError?: { message: string; code: string } | null
  regional?: Array<Record<string, unknown>>
  regionalError?: { message: string } | null
}): Supa {
  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: rows.profile ?? null,
          error: rows.profileError ?? null,
        }),
        update: vi.fn().mockReturnThis(),
      } as unknown as ReturnType<typeof vi.fn>
    }
    if (table === 'user_regional_identities') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi
          .fn()
          .mockResolvedValue({ data: rows.regional ?? [], error: rows.regionalError ?? null }),
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

  it('returns 500 when profiles query errors with a non-PGRST116 error', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupa(
        { id: 'u1' },
        { profileError: { message: 'boom', code: '08000' } }
      ) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'boom' })
  })

  it('returns 500 when regional-identities query errors', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupa(
        { id: 'u1' },
        { regionalError: { message: 'regional db error' } }
      ) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'regional db error' })
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

  it('returns 400 when body is empty {}', async () => {
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn(),
    }
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'No fields to update' })
  })
})
