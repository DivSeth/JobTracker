import type { Application, Job, Profile, ApplicationStatus } from '@/lib/types'

it('Application status union includes all 7 states', () => {
  const statuses: ApplicationStatus[] = [
    'saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected', 'ghosted'
  ]
  expect(statuses).toHaveLength(7)
})

it('Application type is structurally valid', () => {
  const app: Application = {
    id: '1', user_id: 'u1', job_id: null,
    status: 'applied', applied_at: null,
    last_activity_at: new Date().toISOString(),
    notes: null, source: 'manual',
  }
  expect(app.status).toBe('applied')
})
