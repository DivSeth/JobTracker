import { fetchGreenhouseJobs, toStandardized } from '@/lib/ats/greenhouse'
import type { StandardizedJob } from '@/lib/ats/types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_RESPONSE = {
  jobs: [
    {
      id: 12345,
      title: 'Software Engineer',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/12345',
      location: { name: 'San Francisco, CA' },
      updated_at: '2026-03-20T00:00:00Z',
      departments: [{ name: 'Engineering' }],
    },
    {
      id: 12346,
      title: 'Product Manager',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/12346',
      location: { name: 'Remote' },
      updated_at: '2026-03-20T00:00:00Z',
      departments: [{ name: 'Product' }],
    },
  ],
}

describe('fetchGreenhouseJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('fetches jobs from the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })
    await fetchGreenhouseJobs('stripe')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('returns all jobs from the response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })
    const jobs = await fetchGreenhouseJobs('stripe')
    expect(jobs).toHaveLength(2)
  })

  it('returns empty array on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    const jobs = await fetchGreenhouseJobs('stripe')
    expect(jobs).toEqual([])
  })
})

describe('toStandardized', () => {
  it('converts a Greenhouse job to StandardizedJob', () => {
    const result: StandardizedJob = toStandardized(MOCK_RESPONSE.jobs[0], 'Stripe')
    expect(result.ats_job_id).toBe('gh_12345')
    expect(result.title).toBe('Software Engineer')
    expect(result.company).toBe('Stripe')
    expect(result.location).toBe('San Francisco, CA')
    expect(result.department).toBe('Engineering')
    expect(result.apply_url).toBe('https://boards.greenhouse.io/stripe/jobs/12345')
    expect(result.source_platform).toBe('greenhouse')
  })
})
