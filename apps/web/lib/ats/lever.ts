import type { StandardizedJob } from './types'

interface LeverJob {
  id: string
  text: string
  categories: { team: string; location: string; commitment: string }
  applyUrl: string
  hostedUrl: string
  additionalPlain?: string
}

export function toStandardized(job: LeverJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `lv_${job.id}`,
    title: job.text,
    company: companyName,
    location: job.categories?.location || null,
    department: job.categories?.team || null,
    apply_url: job.applyUrl,
    remote_policy: job.categories?.location?.toLowerCase().includes('remote') ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'lever',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

const PAGE_SIZE = 100

export async function fetchLeverJobs(slug: string): Promise<LeverJob[]> {
  const all: LeverJob[] = []
  let skip = 0

  try {
    while (true) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(
        `https://api.lever.co/v0/postings/${slug}?mode=json&limit=${PAGE_SIZE}&skip=${skip}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (!res.ok) break
      const page: LeverJob[] = await res.json()
      all.push(...page)
      if (page.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }
  } catch {
    // Return whatever we collected
  }
  return all
}
