import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseJobFilters } from '@/lib/jobs/filters'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { job_type } = parseJobFilters(searchParams)

  let query = supabase
    .from('jobs')
    .select(`
      *,
      job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at),
      source:job_sources(repo_name, repo_url)
    `)
    .eq('is_active', true)
    .order('first_seen_at', { ascending: false })
    .limit(100)

  if (job_type) query = query.eq('job_type', job_type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
