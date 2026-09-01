import { fetchAshbyJobs, toStandardized } from '@/lib/ats/ashby'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'ashby-1',
  title: 'Software Engineer',
  department: 'Engineering',
  team: 'Backend',
  location: 'San Francisco',
  secondaryLocations: ['New York'],
  employmentType: 'FullTime',
  isRemote: false,
  jobUrl: 'https://jobs.ashbyhq.com/ramp/ashby-1',
  applyUrl: 'https://jobs.ashbyhq.com/ramp/ashby-1/apply',
}

describe('fetchAshbyJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('destructures .jobs from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [MOCK_JOB] }),
    })
    const jobs = await fetchAshbyJobs('ramp')
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Software Engineer')
  })
})

describe('toStandardized', () => {
  it('converts an Ashby job with remote flag', () => {
    const remote = { ...MOCK_JOB, isRemote: true }
    const result = toStandardized(remote, 'Ramp')
    expect(result.remote_policy).toBe('remote')
    expect(result.ats_job_id).toBe('ab_ashby-1')
    expect(result.source_platform).toBe('ashby')
  })
})
