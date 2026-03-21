import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'
import type { JobWithScore } from '@/lib/types'

const baseJob: JobWithScore = {
  id: '1', source_id: 's1', source_url: 'https://github.com/SimplifyJobs/New-Grad-Positions',
  title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA',
  job_type: 'new_grad', required_skills: ['Python', 'Go'], preferred_skills: [],
  experience_level: 'entry', remote_policy: 'hybrid', apply_url: 'https://careers.google.com',
  posted_at: null, first_seen_at: new Date().toISOString(), is_active: true,
}

it('renders company name and job title', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText('Google')).toBeInTheDocument()
  expect(screen.getByText('Software Engineer')).toBeInTheDocument()
})

it('renders Apply link with correct href', () => {
  render(<JobCard job={baseJob} />)
  const link = screen.getByRole('link', { name: /apply/i })
  expect(link).toHaveAttribute('href', 'https://careers.google.com')
})

it('shows match score badge when score present', () => {
  const job: JobWithScore = {
    ...baseJob,
    job_scores: [{
      id: '1', job_id: '1', user_id: 'u', score: 87,
      tier: 'claude_scored', matching_skills: ['Python'],
      skill_gaps: ['Go'], verdict: 'stretch', reasoning: null,
      scored_at: '',
    }],
  }
  render(<JobCard job={job} />)
  expect(screen.getByText('87%')).toBeInTheDocument()
})

it('shows source repo attribution', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText(/SimplifyJobs/)).toBeInTheDocument()
})
