import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KnowledgeManualEntryPanel } from '@/components/knowledge/KnowledgeManualEntryPanel'

describe('KnowledgeManualEntryPanel', () => {
  it('renders evidence, claim, and network entry sections', () => {
    render(<KnowledgeManualEntryPanel />)

    expect(screen.getByRole('heading', { name: /evidence vault/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /professional claims/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /networking graph/i })).toBeInTheDocument()
  })

  it('submits manual evidence to the evidence endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'source-1' }),
    } as Response)

    render(<KnowledgeManualEntryPanel />)

    fireEvent.change(screen.getByLabelText(/evidence title/i), {
      target: { value: 'Siemens worker notes' },
    })
    fireEvent.change(screen.getByLabelText(/evidence text/i), {
      target: { value: 'Hardened async document-generation workers.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/knowledge/evidence',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Siemens worker notes'),
        })
      )
    })

    fetchSpy.mockRestore()
  })

  it('submits evidence-backed claims to the claims endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'claim-1' }),
    } as Response)

    render(<KnowledgeManualEntryPanel />)

    fireEvent.change(screen.getByLabelText(/^claim$/i), {
      target: { value: 'Built a C++ matching engine with deterministic order matching.' },
    })
    fireEvent.change(screen.getByLabelText(/evidence source id/i), {
      target: { value: '550e8400-e29b-41d4-a716-446655440000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save claim/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/knowledge/claims',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('550e8400-e29b-41d4-a716-446655440000'),
        })
      )
    })

    fetchSpy.mockRestore()
  })

  it('submits contacts to the networking endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ contact: { id: 'contact-1' }, role: { id: 'role-1' } }),
    } as Response)

    render(<KnowledgeManualEntryPanel />)

    fireEvent.change(screen.getByLabelText(/contact name/i), {
      target: { value: 'Avery Patel' },
    })
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Google' },
    })
    fireEvent.change(screen.getByLabelText(/role title/i), {
      target: { value: 'Software Engineer' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'avery@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save contact/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/network/contacts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Google'),
        })
      )
    })

    fetchSpy.mockRestore()
  })
})
