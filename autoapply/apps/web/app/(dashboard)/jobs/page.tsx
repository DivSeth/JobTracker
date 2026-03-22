import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFiltersClient } from '@/components/jobs/JobFiltersClient'
import type { JobType, JobWithScore } from '@/lib/types'

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select(`*, job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at), source:job_sources(repo_name, repo_url)`)
    .eq('is_active', true)
    .order('first_seen_at', { ascending: false })
    .limit(100)

  if (type && type !== 'all') query = query.eq('job_type', type)

  const { data: jobs } = await query
  const list = (jobs ?? []) as JobWithScore[]
  const curatorsPick = list[0] ?? null
  const rest = list.slice(1)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Job Feed</h1>
          <p className="text-sm text-on-surface-muted mt-1">
            {list.length} opportunities matching your profile
          </p>
        </div>
      </div>

      <JobFiltersClient active={(type as JobType) ?? 'all'} />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {curatorsPick && <JobCard job={curatorsPick} featured />}
        {rest.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
        {list.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <p className="text-5xl font-light text-on-surface-muted/30 tracking-tight">No jobs yet</p>
            <p className="text-sm text-on-surface-muted mt-3">Sync will populate this feed automatically every 6 hours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
