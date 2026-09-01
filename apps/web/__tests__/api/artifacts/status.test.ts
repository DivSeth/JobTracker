import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient, updateGeneratedArtifactStatus } = vi.hoisted(() => ({
  createClient: vi.fn(),
  updateGeneratedArtifactStatus: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

vi.mock('@/lib/artifacts/repository', () => ({
  updateGeneratedArtifactStatus,
}))

import { PATCH } from '@/app/api/artifacts/[id]/route'

describe('PATCH /api/artifacts/[id]', () => {
  beforeEach(() => {
    createClient.mockReset()
    updateGeneratedArtifactStatus.mockReset()
  })

  it('updates artifact status for the authenticated user', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
    updateGeneratedArtifactStatus.mockResolvedValue({ id: 'artifact-1', status: 'approved' })

    const response = await PATCH(
      new Request('http://localhost/api/artifacts/artifact-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: { id: 'artifact-1' } }
    )

    expect(response.status).toBe(200)
    expect(updateGeneratedArtifactStatus).toHaveBeenCalledWith(expect.any(Object), 'user-1', 'artifact-1', 'approved')
    await expect(response.json()).resolves.toEqual({ artifact: { id: 'artifact-1', status: 'approved' } })
  })

  it('rejects unsupported statuses', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })

    const response = await PATCH(
      new Request('http://localhost/api/artifacts/artifact-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'published' }),
      }),
      { params: { id: 'artifact-1' } }
    )

    expect(response.status).toBe(400)
    expect(updateGeneratedArtifactStatus).not.toHaveBeenCalled()
  })
})
