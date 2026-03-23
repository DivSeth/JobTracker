import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rapidApiKey = process.env.RAPIDAPI_KEY
  if (!rapidApiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 })

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get unenriched active jobs (limit 15 per call to stay within free tier)
  const { data: jobs } = await adminClient
    .from('jobs')
    .select('id, company, title')
    .eq('is_active', true)
    .is('enriched_at', null)
    .limit(15)

  if (!jobs?.length) return NextResponse.json({ enriched: 0, message: 'No jobs to enrich' })

  let enriched = 0
  for (const job of jobs) {
    try {
      const query = encodeURIComponent(`${job.company} ${job.title}`)
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${query}&num_pages=1`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const match = data.data?.[0]

      if (!match) {
        // Mark as enriched even if no match found (to avoid re-trying)
        await adminClient
          .from('jobs')
          .update({ enriched_at: new Date().toISOString() })
          .eq('id', job.id)
        continue
      }

      // Extract enrichment data
      const updates: Record<string, unknown> = {
        enriched_at: new Date().toISOString(),
      }

      if (match.employer_logo) updates.company_logo_url = match.employer_logo
      if (match.job_min_salary) updates.salary_min = Math.round(match.job_min_salary)
      if (match.job_max_salary) updates.salary_max = Math.round(match.job_max_salary)
      if (match.job_required_skills?.length) updates.required_skills = match.job_required_skills
      if (match.job_is_remote != null) updates.remote_policy = match.job_is_remote ? 'remote' : 'onsite'
      if (match.job_required_experience?.required_experience_in_months != null) {
        const months = match.job_required_experience.required_experience_in_months
        updates.experience_level = months <= 12 ? 'entry' : months <= 36 ? 'mid' : 'senior'
      }

      // Extract domain from employer website
      if (match.employer_website) {
        try {
          updates.company_domain = new URL(match.employer_website).hostname.replace('www.', '')
        } catch { /* skip */ }
      }

      await adminClient
        .from('jobs')
        .update(updates)
        .eq('id', job.id)

      enriched++
    } catch {
      // Skip individual failures, continue with next job
      continue
    }
  }

  return NextResponse.json({ enriched, total: jobs.length })
}
