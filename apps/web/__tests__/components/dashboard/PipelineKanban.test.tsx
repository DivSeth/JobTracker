import { render, screen } from '@testing-library/react'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import type { ApplicationWithJob } from '@/lib/types'

const makeApp = (status: string): ApplicationWithJob => ({
  id: Math.random().toString(), user_id: 'u', job_id: 'j',
  status: status as any, applied_at: '2026-01-01T00:00:00Z',
  last_activity_at: '2026-01-01T00:00:00Z', notes: null, source: 'manual',
  job: { id: 'j', source_id: 's', source_url: null, title: 'SWE', company: 'Acme',
         location: null, job_type: 'internship', required_skills: [], preferred_skills: [],
         experience_level: null, remote_policy: null, apply_url: null,
         posted_at: null, first_seen_at: '', is_active: true },
})

it('renders all 5 pipeline column labels', () => {
  render(<PipelineKanban applications={[]} />)
  expect(screen.getByText('APPLIED')).toBeInTheDocument()
  expect(screen.getByText('OA')).toBeInTheDocument()
  expect(screen.getByText('INTERVIEWING')).toBeInTheDocument()
  expect(screen.getByText('OFFER')).toBeInTheDocument()
  expect(screen.getByText('REJECTED')).toBeInTheDocument()
})

it('shows correct count per column', () => {
  const apps = [makeApp('applied'), makeApp('applied'), makeApp('oa')]
  render(<PipelineKanban applications={apps} />)
  const counts = screen.getAllByText('2')
  expect(counts.length).toBeGreaterThan(0)
})

it('renders company name on card', () => {
  render(<PipelineKanban applications={[makeApp('applied')]} />)
  expect(screen.getByText('Acme')).toBeInTheDocument()
})

it('shows empty state placeholder when column is empty', () => {
  render(<PipelineKanban applications={[]} />)
  const empties = screen.getAllByText('Empty')
  expect(empties.length).toBe(5)
})
