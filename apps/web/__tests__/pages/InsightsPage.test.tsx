import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import InsightsPage from '@/app/(dashboard)/insights/page'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    }),
  }),
}))

it('renders insights page heading', async () => {
  render(await InsightsPage())
  expect(screen.getByText(/analytical insights/i)).toBeInTheDocument()
})
