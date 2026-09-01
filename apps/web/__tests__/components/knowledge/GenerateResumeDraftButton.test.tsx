import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GenerateResumeDraftButton } from '@/components/knowledge/GenerateResumeDraftButton'

describe('GenerateResumeDraftButton', () => {
  it('posts to create a resume draft artifact', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ artifact: { id: 'artifact-1' } }),
    } as Response)

    render(<GenerateResumeDraftButton disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: /create resume draft/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/artifacts/resume-drafts', {
        method: 'POST',
      })
    })
    expect(await screen.findByText(/resume draft saved/i)).toBeInTheDocument()

    fetchSpy.mockRestore()
  })
})
