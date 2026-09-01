import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseJobFilters } from '@/lib/jobs/filters'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { job_type } = parseJobFilters(searchParams)
  const sort = searchParams.get('sort') ?? 'company'

  let query = supabase
    .from('jobs')
    .select(`
      *,
      job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at),
      source:job_sources!left(repo_name, repo_url),
      company_info:companies!left(name, slug, ats_platform, domain, logo_url)
    `)
    .eq('is_active', true)
    .limit(100)

  if (sort === 'date') {
    query = query.order('first_seen_at', { ascending: false })
  } else if (sort === 'title') {
    query = query.order('title', { ascending: true })
  } else {
    query = query.order('company', { ascending: true })
  }

  if (job_type) query = query.eq('job_type', job_type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
