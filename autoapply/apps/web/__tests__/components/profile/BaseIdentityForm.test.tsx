import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BaseIdentityForm', () => {
  const initial = {
    first_name: null,
    last_name: null,
    preferred_first_name: null,
    pronouns: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    date_of_birth: null,
    willing_to_relocate: false,
    work_arrangement_preference: null,
    earliest_start_date: null,
    referral_source: null,
  }

  it('renders all base-identity inputs', () => {
    render(<BaseIdentityForm initial={initial} />)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/github/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/portfolio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/willing to relocate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/work arrangement/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/earliest start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hear about us|referral source/i)).toBeInTheDocument()
  })

  it('auto-saves on blur with PATCH /api/profile', async () => {
    render(<BaseIdentityForm initial={initial} />)
    const firstName = screen.getByLabelText(/first name/i) as HTMLInputElement
    fireEvent.change(firstName, { target: { value: 'Jane' } })
    fireEvent.blur(firstName)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
    const body = JSON.parse((fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as unknown as string)
    // The fetch mock's second arg is RequestInit; the body is a string.
    // Above coercion is safe because we stringified inside the component.
    expect(body.first_name).toBe('Jane')
  })

  it('shows "Saved" pill after a successful save', async () => {
    render(<BaseIdentityForm initial={initial} />)
    const firstName = screen.getByLabelText(/first name/i)
    fireEvent.change(firstName, { target: { value: 'Jane' } })
    fireEvent.blur(firstName)
    expect(await screen.findByText(/saved/i)).toBeInTheDocument()
  })
})
