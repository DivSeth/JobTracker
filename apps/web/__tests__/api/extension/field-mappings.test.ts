import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import { GET } from '@/app/api/extension/field-mappings/route'

function createSupabaseMock(user: { id: string } | null, result: { data: unknown; error: { message: string } | null }) {
  const order = vi.fn().mockResolvedValue(result)
  const eqIsActive = vi.fn().mockReturnValue({ order })
  const eqPlatform = vi.fn().mockReturnValue({ eq: eqIsActive })
  const select = vi.fn().mockReturnValue({ eq: eqPlatform })
  const from = vi.fn().mockReturnValue({ select })

  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from,
  })

  return { from, select, eqPlatform, eqIsActive, order }
}

describe('GET /api/extension/field-mappings', () => {
  beforeEach(() => {
    createClient.mockReset()
  })

  it('returns active mapping config for greenhouse platform', async () => {
    createSupabaseMock(
      { id: 'user-1' },
      {
        data: [{ id: 'map-1', platform: 'greenhouse', is_active: true }],
        error: null,
      }
    )

    const response = await GET(new Request('http://localhost/api/extension/field-mappings?platform=greenhouse'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      { id: 'map-1', platform: 'greenhouse', is_active: true },
    ])
  })

  it('returns 400 when platform query param is missing', async () => {
    createSupabaseMock({ id: 'user-1' }, { data: [], error: null })

    const response = await GET(new Request('http://localhost/api/extension/field-mappings'))
    expect(response.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    createSupabaseMock(null, { data: [], error: null })

    const response = await GET(new Request('http://localhost/api/extension/field-mappings?platform=greenhouse'))
    expect(response.status).toBe(401)
  })

  it('returns 404 when no active mapping exists for platform', async () => {
    createSupabaseMock({ id: 'user-1' }, { data: [], error: null })

    const response = await GET(new Request('http://localhost/api/extension/field-mappings?platform=greenhouse'))
    expect(response.status).toBe(404)
  })
})
