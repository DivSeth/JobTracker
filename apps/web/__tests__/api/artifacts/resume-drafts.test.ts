import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient, createLatestResumeDraftArtifact } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createLatestResumeDraftArtifact: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

vi.mock('@/lib/artifacts/repository', () => ({
  createLatestResumeDraftArtifact,
}))

import { POST } from '@/app/api/artifacts/resume-drafts/route'

describe('POST /api/artifacts/resume-drafts', () => {
  beforeEach(() => {
    createClient.mockReset()
    createLatestResumeDraftArtifact.mockReset()
  })

  it('creates a resume draft artifact for the authenticated user', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
    createLatestResumeDraftArtifact.mockResolvedValue({ id: 'artifact-1' })

    const response = await POST()

    expect(response.status).toBe(201)
    expect(createLatestResumeDraftArtifact).toHaveBeenCalledWith(expect.any(Object), 'user-1')
    await expect(response.json()).resolves.toEqual({ artifact: { id: 'artifact-1' } })
  })

  it('returns 401 when unauthenticated', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })

    const response = await POST()

    expect(response.status).toBe(401)
  })
})
