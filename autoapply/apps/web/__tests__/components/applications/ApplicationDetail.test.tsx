import { render, screen } from '@testing-library/react'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import type { ApplicationWithJob } from '@/lib/types'

const mockApp: ApplicationWithJob = {
  id: '1', user_id: 'u', job_id: 'j',
  status: 'interviewing', applied_at: '2026-01-15T00:00:00Z',
  last_activity_at: '2026-01-20T00:00:00Z',
  notes: 'Ask about tech stack', source: 'manual',
  job: {
    id: 'j', source_id: 's', source_url: null,
    title: 'SWE Intern', company: 'Stripe', location: 'Remote',
    job_type: 'internship', required_skills: [], preferred_skills: [],
    experience_level: null, remote_policy: null, apply_url: null,
    posted_at: null, first_seen_at: '', is_active: true,
  },
}

it('renders job title and company', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText('SWE Intern')).toBeInTheDocument()
  expect(screen.getByText('Stripe')).toBeInTheDocument()
})

it('renders status badge', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText(/interviewing/i)).toBeInTheDocument()
})

it('renders status timeline with applied date', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText(/applied/i)).toBeInTheDocument()
  expect(screen.getByText(/jan 15/i)).toBeInTheDocument()
})

it('renders notes textarea with existing notes', () => {
  render(<ApplicationDetail application={mockApp} />)
  const textarea = screen.getByPlaceholderText(/interview notes/i)
  expect(textarea).toHaveValue('Ask about tech stack')
})
