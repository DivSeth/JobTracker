import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/profile/regional-identities/route'
import { PATCH, DELETE } from '@/app/api/profile/regional-identities/[id]/route'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
import { createClient } from '@/lib/supabase/server'

const validBody = {
  label: 'US student',
  country_codes: ['US'],
  is_default: false,
  email: 'me@school.edu',
  phone_e164: '+14155551234',
  country: 'US',
  authorized_to_work: true,
  needs_sponsorship_now: false,
  needs_sponsorship_future: true,
}

function mockSupa(overrides: {
  user?: { id: string } | null
  insertResult?: { data: unknown; error: { message: string } | null }
  updateResult?: { data: unknown; error: { message: string } | null }
  deleteResult?: { error: { message: string } | null }
}) {
  const { user = { id: 'u1' }, insertResult, updateResult, deleteResult } = overrides
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue(insertResult ?? { data: null, error: null }),
      maybeSingle: vi
        .fn()
        .mockResolvedValue(updateResult ?? { data: null, error: null }),
      then: (resolve: (v: unknown) => void) => resolve(deleteResult ?? { error: null }),
    })),
  }
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/profile/regional-identities', () => {
  it('401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({ user: null }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates and returns 201', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({
        insertResult: { data: { id: 'r1', ...validBody }, error: null },
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('r1')
  })

  it('rejects malformed body with 400', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({}) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ label: 'x' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/profile/regional-identities/[id]', () => {
  it('updates and returns row', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({
        updateResult: { data: { id: 'r1', label: 'Updated' }, error: null },
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ label: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'r1' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).label).toBe('Updated')
  })

  it('rejects empty body with 400', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({}) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'r1' }) })
    expect(res.status).toBe(400)
  })

  it('404 when row does not exist or does not belong to user', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({
        updateResult: { data: null, error: null },
      }) as unknown as Awaited<ReturnType<typeof createClient>>
    )
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ label: 'x' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/profile/regional-identities/[id]', () => {
  it('deletes and returns ok', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupa({ deleteResult: { error: null } }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    )
    const res = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(200)
  })
})
