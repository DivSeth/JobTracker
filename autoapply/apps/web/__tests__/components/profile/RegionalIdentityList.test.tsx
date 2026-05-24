import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'

const existing = [
  {
    id: 'r1',
    label: 'US student',
    country_codes: ['US'],
    is_default: true,
    email: 'me@school.edu',
    country: 'US',
  },
]

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'r2',
        label: 'New region',
        country_codes: ['IN'],
        is_default: false,
        email: 'me@personal.com',
        country: 'IN',
      }),
    })
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('RegionalIdentityList', () => {
  it('renders existing regional cards', () => {
    render(<RegionalIdentityList initial={existing} appProfiles={[]} />)
    expect(screen.getByText(/US student/)).toBeInTheDocument()
  })

  it('POSTs /api/profile/regional-identities on +Add region', async () => {
    render(<RegionalIdentityList initial={existing} appProfiles={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /add region/i }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile/regional-identities',
        expect.objectContaining({ method: 'POST' })
      )
    )
    expect(await screen.findByText(/New region/)).toBeInTheDocument()
  })
})
