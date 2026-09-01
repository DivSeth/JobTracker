import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { JobAnalysisPanel } from '@/components/knowledge/JobAnalysisPanel'

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('JobAnalysisPanel', () => {
  beforeEach(() => {
    refresh.mockClear()
  })

  it('submits pasted job text to the job analysis endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysis: { id: 'analysis-1' },
        networkAlerts: [{ id: 'alert-1' }],
      }),
    } as Response)

    render(<JobAnalysisPanel />)

    fireEvent.change(screen.getByLabelText(/job title/i), {
      target: { value: 'Software Engineer, Full Stack' },
    })
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Nooks' },
    })
    fireEvent.change(screen.getByLabelText(/apply url/i), {
      target: { value: 'https://jobs.example.com/nooks/full-stack' },
    })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: {
        value:
          'Build React, TypeScript, Node, and Postgres workflows for customer-facing AI products.',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/job-analyses',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Software Engineer, Full Stack'),
        })
      )
    })
    expect(await screen.findByText(/analysis saved/i)).toBeInTheDocument()
    expect(refresh).toHaveBeenCalledOnce()
    expect(screen.getByText(/1 networking alert/i)).toBeInTheDocument()

    fetchSpy.mockRestore()
  })

  it('allows submitting only an apply URL', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysis: { id: 'analysis-1' },
        networkAlerts: [],
      }),
    } as Response)

    render(<JobAnalysisPanel />)

    fireEvent.change(screen.getByLabelText(/apply url/i), {
      target: { value: 'https://jobs.example.com/nooks/full-stack' },
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/job-analyses',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('https://jobs.example.com/nooks/full-stack'),
        })
      )
    })
    expect(await screen.findByText(/analysis saved/i)).toBeInTheDocument()
    expect(refresh).toHaveBeenCalledOnce()

    fetchSpy.mockRestore()
  })

  it('shows the API error message when link analysis fails', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Could not fetch job page (403). Paste the job description instead.',
      }),
    } as Response)

    render(<JobAnalysisPanel />)

    fireEvent.change(screen.getByLabelText(/apply url/i), {
      target: { value: 'https://jobs.example.com/blocked' },
    })
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))

    expect(
      await screen.findByText(/Could not fetch job page \(403\). Paste the job description instead./i)
    ).toBeInTheDocument()

    fetchSpy.mockRestore()
  })
})
