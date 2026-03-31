import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import { GET, PATCH, POST } from '@/app/api/extension/track-application/route'

function createSupabaseMock(options: {
  user?: { id: string } | null
  job?: { id: string } | null
  duplicate?: { id: string; applied_at: string | null } | null
  upsertResult?: Record<string, unknown>
  patchResult?: Record<string, unknown>
}) {
  const user = options.user ?? { id: 'user-1' }

  const jobsMaybeSingle = vi.fn().mockResolvedValue({ data: options.job ?? null, error: null })
  const jobsEq = vi.fn().mockReturnValue({ maybeSingle: jobsMaybeSingle })
  const jobsSelect = vi.fn().mockReturnValue({ eq: jobsEq })

  const appsMaybeSingle = vi.fn().mockResolvedValue({ data: options.duplicate ?? null, error: null })
  const appsEqApplyUrl = vi.fn().mockReturnValue({ maybeSingle: appsMaybeSingle })
  const appsEqUserIdForGet = vi.fn().mockReturnValue({ eq: appsEqApplyUrl })
  const appsSelectForGet = vi.fn().mockReturnValue({ eq: appsEqUserIdForGet })

  const upsertSingle = vi.fn().mockResolvedValue({
    data: options.upsertResult ?? {
      id: 'app-1',
      user_id: user?.id ?? null,
      job_id: options.job?.id ?? null,
      apply_url: 'https://jobs.example.com/apply',
      status: 'saved',
      source: 'extension_autofill',
    },
    error: null,
  })
  const upsertSelect = vi.fn().mockReturnValue({ single: upsertSingle })
  const upsert = vi.fn().mockReturnValue({ select: upsertSelect })

  const updateSingle = vi.fn().mockResolvedValue({
    data: options.patchResult ?? { id: 'app-1', status: 'applied' },
    error: null,
  })
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
  const updateEqUser = vi.fn().mockReturnValue({ select: updateSelect })
  const updateEqId = vi.fn().mockReturnValue({ eq: updateEqUser })
  const update = vi.fn().mockReturnValue({ eq: updateEqId })

  const from = vi.fn((table: string) => {
    if (table === 'jobs') {
      return { select: jobsSelect }
    }

    if (table === 'applications') {
      return {
        select: appsSelectForGet,
        upsert,
        update,
      }
    }

    throw new Error(`Unexpected table ${table}`)
  })

  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: user ?? null }, error: null }),
    },
    from,
  })

  return {
    from,
    jobsEq,
    upsert,
    update,
    updateEqId,
    updateEqUser,
  }
}

describe('POST /api/extension/track-application', () => {
  beforeEach(() => {
    createClient.mockReset()
  })

  it('creates application entry with source extension_autofill', async () => {
    const mock = createSupabaseMock({})

    const response = await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(response.status).toBe(201)
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'extension_autofill' }),
      { onConflict: 'user_id,apply_url' }
    )
  })

  it('sets status to saved on creation', async () => {
    const mock = createSupabaseMock({})

    await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'saved' }),
      { onConflict: 'user_id,apply_url' }
    )
  })

  it('links to existing job record when apply_url matches (SYNC-03)', async () => {
    const mock = createSupabaseMock({ job: { id: 'job-1' } })

    await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(mock.jobsEq).toHaveBeenCalledWith('apply_url', 'https://jobs.example.com/apply')
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ job_id: 'job-1' }),
      { onConflict: 'user_id,apply_url' }
    )
  })

  it('returns 201 with application data', async () => {
    createSupabaseMock({})

    const response = await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ id: 'app-1', status: 'saved' })
    )
  })

  it('returns 401 when not authenticated', async () => {
    createSupabaseMock({ user: null })

    const response = await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('upserts on duplicate user_id + apply_url', async () => {
    const mock = createSupabaseMock({})

    await POST(
      new Request('http://localhost/api/extension/track-application', {
        method: 'POST',
        body: JSON.stringify({ applyUrl: 'https://jobs.example.com/apply' }),
      })
    )

    expect(mock.upsert).toHaveBeenCalledTimes(1)
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ onConflict: 'user_id,apply_url' })
    )
  })
})

describe('GET /api/extension/track-application', () => {
  it('returns { exists: true, appliedAt } when apply_url has existing application', async () => {
    createSupabaseMock({
      duplicate: { id: 'app-1', applied_at: '2026-03-31T12:00:00.000Z' },
    })

    const response = await GET(
      new Request('http://localhost/api/extension/track-application?applyUrl=https://jobs.example.com/apply')
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      exists: true,
      appliedAt: '2026-03-31T12:00:00.000Z',
    })
  })

  it('returns { exists: false } when apply_url has no existing application', async () => {
    createSupabaseMock({ duplicate: null })

    const response = await GET(
      new Request('http://localhost/api/extension/track-application?applyUrl=https://jobs.example.com/apply')
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ exists: false })
  })

  it('returns 400 when applyUrl query param is missing', async () => {
    createSupabaseMock({})

    const response = await GET(new Request('http://localhost/api/extension/track-application'))
    expect(response.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    createSupabaseMock({ user: null })

    const response = await GET(
      new Request('http://localhost/api/extension/track-application?applyUrl=https://jobs.example.com/apply')
    )

    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/extension/track-application', () => {
  it('updates application status to applied with applied_at timestamp (SYNC-02)', async () => {
    const mock = createSupabaseMock({})

    const response = await PATCH(
      new Request('http://localhost/api/extension/track-application', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'app-1', status: 'applied' }),
      })
    )

    expect(response.status).toBe(200)
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'applied',
        applied_at: expect.any(String),
        last_activity_at: expect.any(String),
      })
    )
    expect(mock.updateEqId).toHaveBeenCalledWith('id', 'app-1')
    expect(mock.updateEqUser).toHaveBeenCalledWith('user_id', 'user-1')
  })
})
