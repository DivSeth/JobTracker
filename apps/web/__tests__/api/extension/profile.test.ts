import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/extension/profile/route'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
import { createClient } from '@/lib/supabase/server'

function mockSupa(
  user: { id: string } | null,
  profile: unknown,
  regional: unknown[],
  profileError: unknown = null,
  regionalError: unknown = null,
) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn((t: string) => {
      if (t === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: profileError }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: regional, error: regionalError }),
      }
    }),
  }
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/extension/profile', () => {
  it('401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa(null, null, []) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns { baseIdentity, regionalIdentities } with extension-safe shape', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa(
        { id: 'u1' },
        { first_name: 'Jane', last_name: 'Doe' },
        [{ id: 'r1', label: 'US', country: 'US' }]
      ) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    const body = await res.json()
    expect(body.baseIdentity.first_name).toBe('Jane')
    expect(body.regionalIdentities).toHaveLength(1)
    expect(res.headers.get('cache-control')).toBe('no-store, private')
  })

  it('returns baseIdentity: null for pre-onboarding user', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({ id: 'u1' }, null, []) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    const body = await res.json()
    expect(body.baseIdentity).toBe(null)
    expect(body.regionalIdentities).toEqual([])
  })

  it('returns 500 when profile query errors', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({ id: 'u1' }, null, [], { message: 'boom' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('returns 500 when regional query errors', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({ id: 'u1' }, { first_name: 'Jane' }, [], null, { message: 'boom' }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
