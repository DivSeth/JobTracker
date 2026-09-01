import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegionalIdentityForm } from '@/components/profile/RegionalIdentityForm'

const valid = {
  id: 'r1',
  label: 'US student',
  country_codes: ['US'],
  is_default: true,
  email: 'me@school.edu',
  phone_e164: '+14155551234',
  address_line_1: null,
  address_line_2: null,
  city: null,
  region: null,
  postal_code: null,
  country: 'US',
  authorized_to_work: true,
  needs_sponsorship_now: false,
  needs_sponsorship_future: true,
  work_auth_status: null,
  work_auth_details: null,
  desired_salary_min: null,
  desired_salary_max: null,
  salary_currency: null,
  salary_cadence: null,
  current_compensation: null,
  notice_period_weeks: null,
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => valid })
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('RegionalIdentityForm', () => {
  it('renders label, contact, address, work-auth and compensation fields', () => {
    render(<RegionalIdentityForm initial={valid} onDeleted={vi.fn()} appProfiles={[]} />)
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Country$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/authorized to work/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sponsorship now/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sponsorship.*future/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/desired salary min/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/salary cadence/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notice period/i)).toBeInTheDocument()
  })

  it('PATCHes on blur', async () => {
    render(<RegionalIdentityForm initial={valid} onDeleted={vi.fn()} appProfiles={[]} />)
    const label = screen.getByLabelText(/label/i) as HTMLInputElement
    fireEvent.change(label, { target: { value: 'US school' } })
    fireEvent.blur(label)
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile/regional-identities/r1',
        expect.objectContaining({ method: 'PATCH' })
      )
    )
  })

  it('DELETEs and calls onDeleted when user confirms delete', async () => {
    const onDeleted = vi.fn()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    render(<RegionalIdentityForm initial={valid} onDeleted={onDeleted} appProfiles={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /delete region/i }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile/regional-identities/r1',
        expect.objectContaining({ method: 'DELETE' })
      )
    )
    expect(onDeleted).toHaveBeenCalledWith('r1')
  })
})
