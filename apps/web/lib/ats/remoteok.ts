import type { StandardizedJob } from './types'

interface RemoteOKJob {
  id: string
  slug: string
  company: string
  position: string
  tags: string[]
  location: string
  salary_min: number
  salary_max: number
  apply_url: string
  description: string
  date: string
}

export function toStandardized(job: RemoteOKJob): StandardizedJob {
  return {
    ats_job_id: `rok_${job.id}`,
    title: job.position,
    company: job.company,
    location: job.location || 'Remote',
    department: null,
    apply_url: job.apply_url || `https://remoteok.com/l/${job.id}`,
    remote_policy: 'remote',
    description: null,
    posted_at: job.date || null,
    source_platform: 'remoteok',
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    tags: job.tags || [],
  }
}

export async function fetchRemoteOKJobs(): Promise<RemoteOKJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'AutoApply/1.0 (job-tracker)' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: unknown[] = await res.json()
    // First element is metadata, skip it
    return data.slice(1) as RemoteOKJob[]
  } catch {
    return []
  }
}
