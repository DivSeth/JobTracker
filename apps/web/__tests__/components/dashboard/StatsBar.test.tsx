import { render, screen } from '@testing-library/react'
import { StatsBar } from '@/components/dashboard/StatsBar'

it('renders OA RATE label', () => {
  render(<StatsBar applications={[]} jobCount={42} />)
  expect(screen.getByText('OA RATE')).toBeInTheDocument()
})

it('shows 0% OA rate when no applications', () => {
  render(<StatsBar applications={[]} jobCount={0} />)
  expect(screen.getByText('0%')).toBeInTheDocument()
})

it('shows job count', () => {
  render(<StatsBar applications={[]} jobCount={57} />)
  expect(screen.getByText('57')).toBeInTheDocument()
})
