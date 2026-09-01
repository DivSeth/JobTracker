import type { StandardizedJob } from './types'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  updated_at: string
  departments: { name: string }[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

export function toStandardized(job: GreenhouseJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `gh_${job.id}`,
    title: job.title,
    company: companyName,
    location: job.location?.name || null,
    department: job.departments?.[0]?.name || null,
    apply_url: job.absolute_url,
    remote_policy: job.location?.name?.toLowerCase().includes('remote') ? 'remote' : null,
    description: null,
    posted_at: job.updated_at,
    source_platform: 'greenhouse',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchGreenhouseJobs(slug: string): Promise<GreenhouseJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: GreenhouseResponse = await res.json()
    return data.jobs || []
  } catch {
    return []
  }
}
