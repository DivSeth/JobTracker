import { render, screen } from '@testing-library/react'
import CalendarPage from '@/app/(dashboard)/calendar/page'

it('renders calendar coming soon headline', () => {
  render(<CalendarPage />)
  expect(screen.getByText(/calendar coming soon/i)).toBeInTheDocument()
})
