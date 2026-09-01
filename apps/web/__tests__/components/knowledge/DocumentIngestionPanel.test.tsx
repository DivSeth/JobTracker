import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocumentIngestionPanel } from '@/components/knowledge/DocumentIngestionPanel'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('DocumentIngestionPanel', () => {
  it('submits a source document for automatic knowledge extraction', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ evidenceSource: { id: 'source-1' }, chunksCreated: 1, claimsCreated: 2 }),
    } as Response)

    render(<DocumentIngestionPanel />)
    fireEvent.change(screen.getByLabelText(/Document title/i), { target: { value: 'Resume 2026' } })
    fireEvent.change(screen.getByLabelText(/Document text/i), {
      target: { value: 'Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ingest document/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/knowledge/ingest', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Resume 2026'),
      }))
    })
    expect(await screen.findByText(/Extracted 2 draft claims/i)).toBeInTheDocument()
    expect(refresh).toHaveBeenCalledOnce()

    fetchSpy.mockRestore()
  })

  it('uploads a portfolio file for automatic knowledge extraction', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ evidenceSource: { id: 'source-1' }, chunksCreated: 2, claimsCreated: 3 }),
    } as Response)

    render(<DocumentIngestionPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Upload file/i }))
    fireEvent.change(screen.getByLabelText(/Source type/i), {
      target: { value: 'work_experience_portfolio' },
    })
    fireEvent.change(screen.getByLabelText(/Document title/i), {
      target: { value: 'Siemens portfolio' },
    })
    fireEvent.change(screen.getByLabelText(/Document file/i), {
      target: {
        files: [
          new File(['Built distributed workers and documented portfolio details.'], 'siemens.md', {
            type: 'text/markdown',
          }),
        ],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ingest document/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/knowledge/ingest', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }))
    })
    const submitted = fetchSpy.mock.calls[0]?.[1]?.body as FormData
    expect(submitted.get('source_type')).toBe('work_experience_portfolio')
    expect(submitted.get('title')).toBe('Siemens portfolio')
    expect(submitted.get('file')).toBeInstanceOf(File)
    expect(await screen.findByText(/Extracted 3 draft claims/i)).toBeInTheDocument()

    fetchSpy.mockRestore()
  })
})
