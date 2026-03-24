import { fetchSmartRecruitersJobs, toStandardized } from '@/lib/ats/smartrecruiters'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'sr-1',
  name: 'Frontend Engineer',
  ref: 'https://api.smartrecruiters.com/v1/companies/visa/postings/sr-1',
  location: { city: 'Austin', region: 'TX', country: 'US', remote: false },
  department: { id: 'dept-1', label: 'Engineering' },
}

describe('fetchSmartRecruitersJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('paginates through all pages', async () => {
    const page1 = {
      offset: 0, limit: 100, totalFound: 150,
      content: Array(100).fill(MOCK_JOB),
    }
    const page2 = {
      offset: 100, limit: 100, totalFound: 150,
      content: Array(50).fill(MOCK_JOB),
    }
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 })
    const jobs = await fetchSmartRecruitersJobs('visa')
    expect(jobs).toHaveLength(150)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

describe('toStandardized', () => {
  it('constructs apply URL from slug and id', () => {
    const result = toStandardized(MOCK_JOB, 'Visa', 'visa')
    expect(result.apply_url).toBe('https://jobs.smartrecruiters.com/visa/sr-1')
    expect(result.ats_job_id).toBe('sr_sr-1')
    expect(result.location).toBe('Austin, TX, US')
    expect(result.source_platform).toBe('smartrecruiters')
  })

  it('detects remote from location flag', () => {
    const remote = { ...MOCK_JOB, location: { ...MOCK_JOB.location, remote: true } }
    const result = toStandardized(remote, 'Visa', 'visa')
    expect(result.remote_policy).toBe('remote')
  })
})
