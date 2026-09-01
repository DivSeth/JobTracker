import { fetchRemoteOKJobs, toStandardized } from '@/lib/ats/remoteok'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_META = { '0': 'legal notice', last_updated: '2026-03-23' }
const MOCK_JOB = {
  id: '1234',
  slug: 'swe-at-company',
  company: 'CoolStartup',
  position: 'Software Engineer',
  tags: ['javascript', 'react', 'node'],
  location: 'Worldwide',
  salary_min: 100000,
  salary_max: 150000,
  apply_url: 'https://remoteok.com/l/1234',
  description: '<p>Build stuff</p>',
  date: '2026-03-20T00:00:00Z',
}

describe('fetchRemoteOKJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('sets User-Agent header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_META, MOCK_JOB] })
    await fetchRemoteOKJobs()
    const headers = mockFetch.mock.calls[0][1]?.headers
    expect(headers?.['User-Agent']).toBeDefined()
  })

  it('skips the first metadata element', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_META, MOCK_JOB] })
    const jobs = await fetchRemoteOKJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].position).toBe('Software Engineer')
  })
})

describe('toStandardized', () => {
  it('converts a RemoteOK job', () => {
    const result = toStandardized(MOCK_JOB)
    expect(result.ats_job_id).toBe('rok_1234')
    expect(result.title).toBe('Software Engineer')
    expect(result.company).toBe('CoolStartup')
    expect(result.salary_min).toBe(100000)
    expect(result.salary_max).toBe(150000)
    expect(result.tags).toEqual(['javascript', 'react', 'node'])
    expect(result.remote_policy).toBe('remote')
    expect(result.source_platform).toBe('remoteok')
  })
})
