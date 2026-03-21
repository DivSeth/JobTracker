import { render, screen } from '@testing-library/react'
import { ApplicationFunnel } from '@/components/dashboard/ApplicationFunnel'
import type { Application } from '@/lib/types'

const makeApp = (status: string): Application => ({
  id: Math.random().toString(), user_id: 'u', job_id: null,
  status: status as any, applied_at: null,
  last_activity_at: '', notes: null, source: 'manual',
})

it('shows correct count for each status', () => {
  const apps = [makeApp('applied'), makeApp('applied'), makeApp('oa')]
  render(<ApplicationFunnel applications={apps} />)
  expect(screen.getAllByText('2')[0]).toBeInTheDocument()
  expect(screen.getAllByText('1')[0]).toBeInTheDocument()
})

it('renders all pipeline stage labels', () => {
  render(<ApplicationFunnel applications={[]} />)
  expect(screen.getByText('Applied')).toBeInTheDocument()
  expect(screen.getByText('Interviewing')).toBeInTheDocument()
  expect(screen.getByText('Offer')).toBeInTheDocument()
})

it('shows zero for stages with no applications', () => {
  render(<ApplicationFunnel applications={[]} />)
  const zeros = screen.getAllByText('0')
  expect(zeros.length).toBeGreaterThan(0)
})
