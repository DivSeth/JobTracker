import { render, screen } from '@testing-library/react'
import InsightsPage from '@/app/(dashboard)/insights/page'

it('renders insights unlock headline', () => {
  render(<InsightsPage />)
  expect(screen.getByText(/insights unlock/i)).toBeInTheDocument()
})
