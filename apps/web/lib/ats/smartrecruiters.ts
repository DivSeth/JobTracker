import type { StandardizedJob } from './types'

interface SmartRecruitersJob {
  id: string
  name: string
  ref: string
  location: { city: string; region: string; country: string; remote: boolean }
  department: { id: string; label: string }
}

interface SmartRecruitersResponse {
  offset: number
  limit: number
  totalFound: number
  content: SmartRecruitersJob[]
}

export function toStandardized(
  job: SmartRecruitersJob,
  companyName: string,
  companySlug: string
): StandardizedJob {
  const parts = [job.location?.city, job.location?.region, job.location?.country].filter(Boolean)
  return {
    ats_job_id: `sr_${job.id}`,
    title: job.name,
    company: companyName,
    location: parts.length ? parts.join(', ') : null,
    department: job.department?.label || null,
    apply_url: `https://jobs.smartrecruiters.com/${companySlug}/${job.id}`,
    remote_policy: job.location?.remote ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'smartrecruiters',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchSmartRecruitersJobs(slug: string): Promise<SmartRecruitersJob[]> {
  const all: SmartRecruitersJob[] = []
  let offset = 0
  const limit = 100
  const maxPages = 3 // Cap at 300 jobs per company to stay within timeout

  try {
    for (let page = 0; page < maxPages; page++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(
        `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=${limit}&offset=${offset}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (!res.ok) break
      const data: SmartRecruitersResponse = await res.json()
      all.push(...data.content)
      offset += limit
      if (offset >= data.totalFound) break
    }
  } catch {
    // Return whatever we collected
  }
  return all
}
