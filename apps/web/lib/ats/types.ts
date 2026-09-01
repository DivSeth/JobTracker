import type { SourcePlatform } from '@/lib/types'

/** Standardized job shape that all ATS clients convert to before passing to the sync orchestrator */
export interface StandardizedJob {
  ats_job_id: string
  title: string
  company: string
  location: string | null
  department: string | null
  apply_url: string
  remote_policy: string | null   // 'remote' | 'hybrid' | 'onsite' | null
  description: string | null
  posted_at: string | null       // ISO timestamp
  source_platform: SourcePlatform
  salary_min: number | null
  salary_max: number | null
  tags: string[]                 // skills/tags from RemoteOK
}
