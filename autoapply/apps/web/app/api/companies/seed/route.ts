import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ATS_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: 'greenhouse', regex: /(?:boards|job-boards)\.greenhouse\.io\/([a-zA-Z0-9_-]+)/ },
  { platform: 'lever', regex: /jobs\.lever\.co\/([a-zA-Z0-9_-]+)/ },
  { platform: 'ashby', regex: /jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/ },
  { platform: 'smartrecruiters', regex: /jobs\.smartrecruiters\.com\/([a-zA-Z0-9_-]+)/ },
]

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all distinct apply_url + company pairs
  const { data: jobs } = await adminClient
    .from('jobs')
    .select('apply_url, company')
    .not('apply_url', 'is', null)

  if (!jobs?.length) return NextResponse.json({ seeded: 0, message: 'No jobs with apply URLs' })

  // Extract ATS slugs
  const seen = new Set<string>()
  const companies: { name: string; slug: string; ats_platform: string; domain: string | null }[] = []

  for (const job of jobs) {
    if (!job.apply_url) continue
    for (const { platform, regex } of ATS_PATTERNS) {
      const match = job.apply_url.match(regex)
      if (!match) continue
      const slug = match[1].toLowerCase()
      const key = `${platform}:${slug}`
      if (seen.has(key)) continue
      seen.add(key)

      // Guess domain from slug
      const domain = `${slug.replace(/-/g, '')}.com`

      companies.push({
        name: job.company?.replace(/^↳\s*/, '') || slug,
        slug,
        ats_platform: platform,
        domain,
      })
    }
  }

  if (!companies.length) return NextResponse.json({ seeded: 0, message: 'No ATS URLs found' })

  // Upsert companies (ignore conflicts on unique constraint)
  const { data: inserted, error } = await adminClient
    .from('companies')
    .upsert(
      companies.map(c => ({
        ...c,
        logo_url: c.domain
          ? `https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`
          : null,
      })),
      { onConflict: 'ats_platform,slug', ignoreDuplicates: true }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Backfill company_id on existing jobs
  const { data: allCompanies } = await adminClient
    .from('companies')
    .select('id, slug, ats_platform')

  if (allCompanies) {
    for (const company of allCompanies) {
      let pattern: string
      switch (company.ats_platform) {
        case 'greenhouse': pattern = `%greenhouse.io/${company.slug}/%`; break
        case 'lever': pattern = `%lever.co/${company.slug}/%`; break
        case 'ashby': pattern = `%ashbyhq.com/${company.slug}/%`; break
        case 'smartrecruiters': pattern = `%smartrecruiters.com/${company.slug}/%`; break
        default: continue
      }
      await adminClient
        .from('jobs')
        .update({ company_id: company.id })
        .like('apply_url', pattern)
        .is('company_id', null)
    }
  }

  return NextResponse.json({
    seeded: inserted?.length || 0,
    total_extracted: companies.length,
    by_platform: {
      greenhouse: companies.filter(c => c.ats_platform === 'greenhouse').length,
      lever: companies.filter(c => c.ats_platform === 'lever').length,
      ashby: companies.filter(c => c.ats_platform === 'ashby').length,
      smartrecruiters: companies.filter(c => c.ats_platform === 'smartrecruiters').length,
    },
  })
}
