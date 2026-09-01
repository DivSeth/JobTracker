import { fetchLeverJobs, toStandardized } from '@/lib/ats/lever'
import type { StandardizedJob } from '@/lib/ats/types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'abc-123',
  text: 'Backend Engineer',
  categories: { team: 'Platform', location: 'New York, NY', commitment: 'Full-time' },
  applyUrl: 'https://jobs.lever.co/company/abc-123/apply',
  hostedUrl: 'https://jobs.lever.co/company/abc-123',
  additionalPlain: 'Salary: $120k-$180k',
}

describe('fetchLeverJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('uses ?mode=json query parameter', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_JOB] })
    await fetchLeverJobs('company')
    expect(mockFetch.mock.calls[0][0]).toContain('mode=json')
  })

  it('paginates when response has 100 items', async () => {
    const page1 = Array(100).fill(MOCK_JOB)
    const page2 = [MOCK_JOB]
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 })
    const jobs = await fetchLeverJobs('company')
    expect(jobs).toHaveLength(101)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('stops paginating when response has fewer than 100 items', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_JOB] })
    await fetchLeverJobs('company')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('toStandardized', () => {
  it('converts a Lever job to StandardizedJob', () => {
    const result: StandardizedJob = toStandardized(MOCK_JOB, 'Company')
    expect(result.ats_job_id).toBe('lv_abc-123')
    expect(result.title).toBe('Backend Engineer')
    expect(result.location).toBe('New York, NY')
    expect(result.apply_url).toBe('https://jobs.lever.co/company/abc-123/apply')
    expect(result.source_platform).toBe('lever')
  })
})
