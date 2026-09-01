import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

vi.mock('@/lib/job-analysis/repository', () => ({
  createJobAnalysisWithNetworkAlerts: vi.fn().mockResolvedValue({
    analysis: { id: 'analysis-1' },
    networkAlerts: [{ id: 'alert-1' }],
  }),
}))

import { POST } from '@/app/api/job-analyses/route'
import { createJobAnalysisWithNetworkAlerts } from '@/lib/job-analysis/repository'

describe('POST /api/job-analyses', () => {
  beforeEach(() => {
    createClient.mockReset()
    vi.mocked(createJobAnalysisWithNetworkAlerts).mockClear()
  })

  it('analyzes pasted job text and stores the result', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/job-analyses', {
        method: 'POST',
        body: JSON.stringify({
          jobText: `
            Software Engineer, Full Stack
            Nooks
            Build React, TypeScript, Node, and Postgres product workflows.
          `,
          applyUrl: 'https://jobs.example.com/nooks/full-stack',
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(createJobAnalysisWithNetworkAlerts).toHaveBeenCalledWith(
      expect.any(Object),
      'user-1',
      expect.objectContaining({
        company_name: 'Nooks',
        role_archetype_key: 'full_stack',
        apply_url: 'https://jobs.example.com/nooks/full-stack',
      })
    )
    await expect(response.json()).resolves.toEqual({
      analysis: { id: 'analysis-1' },
      networkAlerts: [{ id: 'alert-1' }],
    })
  })

  it('fetches job page text when only an apply URL is submitted', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    })
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => `
        <html>
          <head><title>Software Engineer, Full Stack - Nooks</title></head>
          <body>
            <h1>Software Engineer, Full Stack</h1>
            <p>Nooks</p>
            <section>Build React, TypeScript, Node, and Postgres product workflows.</section>
          </body>
        </html>
      `,
    } as Response)

    const response = await POST(
      new Request('http://localhost/api/job-analyses', {
        method: 'POST',
        body: JSON.stringify({
          applyUrl: 'https://jobs.example.com/nooks/full-stack',
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://jobs.example.com/nooks/full-stack',
      expect.objectContaining({ redirect: 'follow' })
    )
    expect(createJobAnalysisWithNetworkAlerts).toHaveBeenCalledWith(
      expect.any(Object),
      'user-1',
      expect.objectContaining({
        company_name: 'Nooks',
        role_archetype_key: 'full_stack',
        apply_url: 'https://jobs.example.com/nooks/full-stack',
      })
    )

    fetchSpy.mockRestore()
  })

  it('returns a readable 400 when the job URL cannot be fetched', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    })
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html>Forbidden</html>',
    } as Response)

    const response = await POST(
      new Request('http://localhost/api/job-analyses', {
        method: 'POST',
        body: JSON.stringify({
          applyUrl: 'https://jobs.example.com/blocked',
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Could not fetch job page (403). Paste the job description instead.',
    })
    expect(createJobAnalysisWithNetworkAlerts).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })

  it('returns 401 for unauthenticated requests', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/job-analyses', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'Backend Engineer' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 400 when both job text and apply URL are missing', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/job-analyses', {
        method: 'POST',
        body: JSON.stringify({ jobText: '' }),
      })
    )

    expect(response.status).toBe(400)
  })
})
