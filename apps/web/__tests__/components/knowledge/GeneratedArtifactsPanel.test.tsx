import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GeneratedArtifactsPanel } from '@/components/knowledge/GeneratedArtifactsPanel'
import type { GeneratedArtifactSummary } from '@/lib/artifacts/repository'

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const artifacts: GeneratedArtifactSummary[] = [
  {
    id: 'artifact-1',
    artifact_type: 'resume_tex',
    status: 'draft',
    content: '% AutoApply generated resume draft\n\\section*{Target Role}\nNetic',
    created_at: '2026-08-18T00:00:00Z',
    job_analysis_id: 'analysis-1',
    metadata: { headline: 'Full-stack product delivery for Netic' },
  },
]

describe('GeneratedArtifactsPanel', () => {
  it('renders artifacts and lets the user view generated content', () => {
    render(<GeneratedArtifactsPanel artifacts={artifacts} />)

    expect(screen.getByText(/Generated Artifacts/i)).toBeInTheDocument()
    expect(screen.getByText(/resume_tex/i)).toBeInTheDocument()
    expect(screen.getByText(/Full-stack product delivery for Netic/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /view artifact/i }))

    expect(screen.getByText(/AutoApply generated resume draft/i)).toBeInTheDocument()
    expect(screen.getByText(/Target Role/i)).toBeInTheDocument()
  })

  it('updates artifact status and refreshes server data', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ artifact: { id: 'artifact-1', status: 'approved' } }),
    } as Response)

    render(<GeneratedArtifactsPanel artifacts={artifacts} />)
    fireEvent.click(screen.getByRole('button', { name: /approve artifact/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/artifacts/artifact-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
    })
    expect(refresh).toHaveBeenCalledOnce()

    fetchSpy.mockRestore()
  })

  it('renders an empty state when no artifacts exist', () => {
    render(<GeneratedArtifactsPanel artifacts={[]} />)

    expect(screen.getByText(/No generated artifacts yet/i)).toBeInTheDocument()
  })
})
