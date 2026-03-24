import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFiltersClient } from '@/components/jobs/JobFiltersClient'
import { SortControl } from '@/components/jobs/SortControl'
import { FilterDropdowns } from '@/components/jobs/FilterDropdowns'
import type { JobType, JobWithScore } from '@/lib/types'

interface Props {
  searchParams: Promise<{ type?: string; sort?: string; role?: string; country?: string }>
}

// Location patterns for country filtering
const COUNTRY_PATTERNS: Record<string, string[]> = {
  usa: [', CA', ', NY', ', TX', ', WA', ', IL', ', MA', ', CO', ', FL', ', NC', ', MD', ', VA', ', OR', ', GA', ', PA', ', MN', ', CT', ', NJ', ', DC', ', OH', ', AZ', ', UT', ', MO', ', TN', ', MI', ', WI', ', NE', ', SC', 'United States', ', us'],
  canada: ['Canada', 'Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Waterloo'],
  uk: ['United Kingdom', 'London', ', UK', 'England'],
  india: ['India', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Pune', ', in'],
  germany: ['Germany', ', DE', 'Berlin', 'Munich', 'München'],
  remote: ['Remote'],
}

// Role category title patterns
const ROLE_PATTERNS: Record<string, string[]> = {
  swe: ['software', 'swe', 'developer', 'backend', 'frontend', 'fullstack', 'full-stack', 'full stack', 'devops', 'sre', 'platform engineer', 'infrastructure engineer', 'systems engineer'],
  aiml: ['machine learning', ' ml ', 'artificial intelligence', ' ai ', 'deep learning', 'nlp', 'computer vision', 'llm', 'genai', 'generative'],
  data: ['data scien', 'data analy', 'analytics engineer', 'data engineer', 'business intelligence'],
}

export default async function JobsPage({ searchParams }: Props) {
  const { type, sort = 'company', role, country } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select(`*, job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at), source:job_sources!left(repo_name, repo_url)`)
    .eq('is_active', true)
    .limit(100)

  if (sort === 'date') {
    query = query.order('first_seen_at', { ascending: false })
  } else if (sort === 'title') {
    query = query.order('title', { ascending: true })
  } else {
    query = query.order('company', { ascending: true })
  }

  if (type && type !== 'all') query = query.eq('job_type', type)

  // Country filter — use ilike with OR patterns
  if (country && country !== 'all' && COUNTRY_PATTERNS[country]) {
    const patterns = COUNTRY_PATTERNS[country]
    const orFilter = patterns.map(p => `location.ilike.%${p}%`).join(',')
    query = query.or(orFilter)
  }

  // Role category filter — use ilike with OR patterns on title
  if (role && role !== 'all' && ROLE_PATTERNS[role]) {
    const patterns = ROLE_PATTERNS[role]
    const orFilter = patterns.map(p => `title.ilike.%${p}%`).join(',')
    query = query.or(orFilter)
  } else if (role === 'other') {
    // "Other" = not matching any known category — fetch all and filter client-side
    // For server-side, we approximate with NOT matching known patterns
    const allKnown = [...ROLE_PATTERNS.swe, ...ROLE_PATTERNS.aiml, ...ROLE_PATTERNS.data]
    for (const p of allKnown.slice(0, 8)) {
      query = query.not('title', 'ilike', `%${p}%`)
    }
  }

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
        <div className="flex items-center gap-3">
          <FilterDropdowns />
          <SortControl />
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
