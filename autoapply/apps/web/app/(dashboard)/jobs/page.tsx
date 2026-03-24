import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFiltersClient } from '@/components/jobs/JobFiltersClient'
import { SortControl } from '@/components/jobs/SortControl'
import { FilterDropdowns } from '@/components/jobs/FilterDropdowns'
import type { JobType, JobWithScore } from '@/lib/types'

interface Props {
  searchParams: Promise<{ type?: string; sort?: string; role?: string; country?: string }>
}

// --- Server-side filter helpers ---

const COUNTRY_MATCHERS: Record<string, (loc: string) => boolean> = {
  usa: (loc) => {
    const l = loc.toLowerCase()
    // US state abbreviations after comma
    if (/,\s*(ca|ny|tx|wa|il|ma|co|fl|nc|md|va|or|ga|pa|mn|ct|nj|oh|az|ut|mo|tn|mi|wi|ne|sc|dc)\b/i.test(loc)) return true
    if (l.includes('united states')) return true
    // Major US cities
    return ['san francisco', 'new york', 'los angeles', 'seattle', 'austin', 'chicago', 'boston', 'denver',
      'houston', 'dallas', 'atlanta', 'portland', 'phoenix', 'san jose', 'san diego', 'redwood city',
      'menlo park', 'mountain view', 'palo alto', 'sunnyvale', 'cupertino', 'irvine', 'el segundo',
      'foster city', 'fremont', 'bellevue', 'raleigh', 'morrisville', 'germantown', 'hayward',
      'los gatos', 'buffalo', 'longmont', 'lakeland', 'lincoln'].some(c => l.includes(c))
  },
  canada: (loc) => {
    const l = loc.toLowerCase()
    return ['canada', 'toronto', 'vancouver', 'montreal', 'ottawa', 'waterloo', 'calgary', 'edmonton'].some(c => l.includes(c))
  },
  uk: (loc) => {
    const l = loc.toLowerCase()
    if (/,\s*uk\b/i.test(loc)) return true
    return ['united kingdom', 'london', 'england', 'edinburgh', 'manchester', 'bristol', 'cambridge, uk'].some(c => l.includes(c))
  },
  india: (loc) => {
    const l = loc.toLowerCase()
    if (/,\s*in\b/i.test(loc)) return true
    return ['india', 'bangalore', 'bengaluru', 'hyderabad', 'mumbai', 'pune', 'chennai', 'gurgaon', 'noida'].some(c => l.includes(c))
  },
  germany: (loc) => {
    const l = loc.toLowerCase()
    if (/,\s*de\b/i.test(loc)) return true
    return ['germany', 'berlin', 'munich', 'münchen', 'frankfurt', 'hamburg'].some(c => l.includes(c))
  },
  remote: (loc) => loc.toLowerCase().includes('remote'),
}

function matchesRole(title: string, role: string): boolean {
  const t = title.toLowerCase()
  switch (role) {
    case 'swe':
      return /\b(software|swe|developer|backend|frontend|fullstack|full-stack|full stack|devops|sre|platform engineer|infrastructure engineer|systems engineer)\b/.test(t)
    case 'aiml':
      return /\b(machine learning|ml engineer|artificial intelligence|ai engineer|deep learning|nlp|computer vision|llm|genai|generative)\b/.test(t)
    case 'data':
      return /\b(data scien|data analy|analytics engineer|data engineer|business intelligence)\b/.test(t)
    case 'other': {
      const isSwe = /\b(software|swe|developer|backend|frontend|fullstack|full-stack|full stack|devops|sre|platform engineer|infrastructure engineer|systems engineer)\b/.test(t)
      const isAiml = /\b(machine learning|ml engineer|artificial intelligence|ai engineer|deep learning|nlp|computer vision|llm|genai|generative)\b/.test(t)
      const isData = /\b(data scien|data analy|analytics engineer|data engineer|business intelligence)\b/.test(t)
      return !isSwe && !isAiml && !isData
    }
    default:
      return true
  }
}

export default async function JobsPage({ searchParams }: Props) {
  const { type, sort = 'company', role, country } = await searchParams
  const supabase = await createClient()

  const hasFilters = (country && country !== 'all') || (role && role !== 'all')

  let query = supabase
    .from('jobs')
    .select(`*, job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at), source:job_sources!left(repo_name, repo_url)`)
    .eq('is_active', true)
    .limit(hasFilters ? 1000 : 100)

  if (sort === 'date') {
    query = query.order('first_seen_at', { ascending: false })
  } else if (sort === 'title') {
    query = query.order('title', { ascending: true })
  } else {
    query = query.order('company', { ascending: true })
  }

  if (type && type !== 'all') query = query.eq('job_type', type)

  const { data: jobs } = await query
  let list = (jobs ?? []) as JobWithScore[]

  // Apply country filter in JS (avoids Supabase .or() comma escaping issues)
  if (country && country !== 'all' && COUNTRY_MATCHERS[country]) {
    list = list.filter(j => j.location && COUNTRY_MATCHERS[country](j.location))
  }

  // Apply role filter in JS
  if (role && role !== 'all') {
    list = list.filter(j => matchesRole(j.title, role))
  }

  // Cap at 100 for display
  list = list.slice(0, 100)

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
