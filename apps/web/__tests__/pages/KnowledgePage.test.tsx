import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import KnowledgePage from '@/app/(dashboard)/knowledge/page'

it('renders the authenticated knowledge page', async () => {
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })

  render(await KnowledgePage())

  expect(screen.getByRole('heading', { name: /knowledge base/i })).toBeInTheDocument()
  expect(screen.getByText(/Evidence Vault/i)).toBeInTheDocument()
  expect(screen.getByText(/Job Understanding/i)).toBeInTheDocument()
})
