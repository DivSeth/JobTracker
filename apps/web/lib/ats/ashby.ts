import type { StandardizedJob } from './types'

interface AshbyJob {
  id: string
  title: string
  department: string
  team: string
  location: string
  secondaryLocations: string[]
  employmentType: string
  isRemote: boolean
  jobUrl: string
  applyUrl: string
}

export function toStandardized(job: AshbyJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `ab_${job.id}`,
    title: job.title,
    company: companyName,
    location: job.location || null,
    department: job.department || job.team || null,
    apply_url: job.applyUrl || job.jobUrl,
    remote_policy: job.isRemote ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'ashby',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchAshbyJobs(slug: string): Promise<AshbyJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: { jobs: AshbyJob[] } = await res.json()
    return data.jobs || []
  } catch {
    return []
  }
}
