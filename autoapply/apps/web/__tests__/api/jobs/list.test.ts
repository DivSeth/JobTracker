import { parseJobFilters } from '@/app/api/jobs/route'

it('returns null job_type for "all"', () => {
  const params = new URLSearchParams('type=all')
  expect(parseJobFilters(params).job_type).toBeNull()
})

it('returns specific job_type when given', () => {
  const params = new URLSearchParams('type=internship')
  expect(parseJobFilters(params).job_type).toBe('internship')
})

it('returns null job_type when type param absent', () => {
  const params = new URLSearchParams('')
  expect(parseJobFilters(params).job_type).toBeNull()
})
