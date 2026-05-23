import { render, screen } from '@testing-library/react'
import CalendarPage from '@/app/(dashboard)/calendar/page'

it('renders calendar page heading', () => {
  render(<CalendarPage />)
  expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument()
})
