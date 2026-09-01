import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient, ingestKnowledgeDocument } = vi.hoisted(() => ({
  createClient: vi.fn(),
  ingestKnowledgeDocument: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient }))
vi.mock('@/lib/knowledge-graph/repository', () => ({ ingestKnowledgeDocument }))

import { POST } from '@/app/api/knowledge/ingest/route'

describe('POST /api/knowledge/ingest', () => {
  beforeEach(() => {
    createClient.mockReset()
    ingestKnowledgeDocument.mockReset()
  })

  it('ingests a document for the authenticated user', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
    ingestKnowledgeDocument.mockResolvedValue({ evidenceSource: { id: 'source-1' }, chunksCreated: 1, claimsCreated: 2 })

    const response = await POST(new Request('http://localhost/api/knowledge/ingest', {
      method: 'POST',
      body: JSON.stringify({
        source_type: 'resume',
        title: 'Resume 2026',
        raw_text: 'Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.',
      }),
    }))

    expect(response.status).toBe(201)
    expect(ingestKnowledgeDocument).toHaveBeenCalledWith(expect.any(Object), 'user-1', expect.objectContaining({
      source_type: 'resume',
      title: 'Resume 2026',
    }))
  })

  it('ingests an uploaded work-experience portfolio document', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
    ingestKnowledgeDocument.mockResolvedValue({ evidenceSource: { id: 'source-1' }, chunksCreated: 2, claimsCreated: 3 })

    const formData = new FormData()
    formData.set('source_type', 'work_experience_portfolio')
    formData.set('title', 'Siemens platform portfolio')
    formData.set('file', new Blob([
      'Built distributed FastAPI workers for Siemens. Optimized queue processing and documented architecture decisions.',
    ], { type: 'text/markdown' }), 'siemens-portfolio.md')

    const response = await POST({
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
      formData: async () => formData,
    } as Request)

    const responseBody = await response.clone().json()
    expect({ status: response.status, body: responseBody }).toMatchObject({ status: 201 })
    expect(ingestKnowledgeDocument).toHaveBeenCalledWith(expect.any(Object), 'user-1', expect.objectContaining({
      source_type: 'work_experience_portfolio',
      title: 'Siemens platform portfolio',
      raw_text: expect.stringContaining('distributed FastAPI workers'),
      metadata: expect.objectContaining({
        original_filename: 'siemens-portfolio.md',
        content_type: 'text/markdown',
        upload_method: 'document_upload',
      }),
    }))
  })

  it('returns a readable 400 for unsupported upload formats', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })

    const formData = new FormData()
    formData.set('source_type', 'work_experience_portfolio')
    formData.set('title', 'Unsupported portfolio')
    formData.set('file', new Blob(['not supported'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }), 'portfolio.docx')

    const response = await POST({
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
      formData: async () => formData,
    } as Request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsupported document type. Upload a PDF, .txt, or .md file.',
    })
    expect(ingestKnowledgeDocument).not.toHaveBeenCalled()
  })
})
