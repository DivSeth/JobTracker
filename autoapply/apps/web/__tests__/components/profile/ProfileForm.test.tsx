import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { Profile } from '@/lib/types'

const emptyProfile: Partial<Profile> = {}

it('renders all section headings', () => {
  render(<ProfileForm initialProfile={emptyProfile} />)
  expect(screen.getByText(/personal details/i)).toBeInTheDocument()
  expect(screen.getByText(/work experience/i)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /education/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /skills/i })).toBeInTheDocument()
  expect(screen.getByText(/preferences/i)).toBeInTheDocument()
})

it('renders skills input', () => {
  render(<ProfileForm initialProfile={emptyProfile} />)
  expect(screen.getByLabelText(/skills/i)).toBeInTheDocument()
})

it('calls POST /api/profile on submit', async () => {
  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)
  render(<ProfileForm initialProfile={emptyProfile} />)
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' }))
  })
  fetchSpy.mockRestore()
})

it('can add a work experience entry', () => {
  render(<ProfileForm initialProfile={emptyProfile} />)
  fireEvent.click(screen.getByRole('button', { name: /add position/i }))
  expect(screen.getByPlaceholderText(/company name/i)).toBeInTheDocument()
})
