import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/components/profile/ProfileForm'

it('renders skills input', () => {
  render(<ProfileForm onSubmit={async () => {}} />)
  expect(screen.getByLabelText(/skills/i)).toBeInTheDocument()
})

it('calls onSubmit with parsed skills array', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React, TypeScript, Python' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: ['React', 'TypeScript', 'Python'],
      })
    )
  })
})

it('strips empty strings from skills', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React,  , TypeScript' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ skills: ['React', 'TypeScript'] })
    )
  })
})
