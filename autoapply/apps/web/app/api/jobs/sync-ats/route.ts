/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isSWERole, classifyJobType, normalizeKey } from '@/lib/ats/classify'
import { fetchGreenhouseJobs, toStandardized as ghStd } from '@/lib/ats/greenhouse'
import { fetchLeverJobs, toStandardized as lvStd } from '@/lib/ats/lever'
import { fetchAshbyJobs, toStandardized as abStd } from '@/lib/ats/ashby'
import { fetchSmartRecruitersJobs, toStandardized as srStd } from '@/lib/ats/smartrecruiters'
import { fetchRemoteOKJobs, toStandardized as rokStd } from '@/lib/ats/remoteok'
import type { StandardizedJob } from '@/lib/ats/types'
import type { ATSPlatform } from '@/lib/types'

// Vercel Pro: allow up to 5 minutes for full sync across all companies
export const maxDuration = 300

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 100

interface SyncStats {
  companies_synced: number
  companies_failed: number
  jobs_created: number
  jobs_updated: number
  jobs_deactivated: number
  remoteok_added: number
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Process a batch of companies concurrently */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processBatch(
  companies: { id: string; name: string; slug: string; ats_platform: ATSPlatform }[],
  adminClient: any,
  stats: SyncStats
) {
  const results = await Promise.allSettled(
    companies.map(company => syncCompany(company, adminClient, stats))
  )
  for (const r of results) {
    if (r.status === 'rejected') stats.companies_failed++
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncCompany(
  company: { id: string; name: string; slug: string; ats_platform: ATSPlatform },
  adminClient: any,
  stats: SyncStats
) {
  // 1. Fetch jobs from ATS
  let standardized: StandardizedJob[] = []

  switch (company.ats_platform) {
    case 'greenhouse': {
      const raw = await fetchGreenhouseJobs(company.slug)
      standardized = raw.map(j => ghStd(j, company.name))
      break
    }
    case 'lever': {
      const raw = await fetchLeverJobs(company.slug)
      standardized = raw.map(j => lvStd(j, company.name))
      break
    }
    case 'ashby': {
      const raw = await fetchAshbyJobs(company.slug)
      standardized = raw.map(j => abStd(j, company.name))
      break
    }
    case 'smartrecruiters': {
      const raw = await fetchSmartRecruitersJobs(company.slug)
      standardized = raw.map(j => srStd(j, company.name, company.slug))
      break
    }
  }

  // 2. Filter SWE roles and classify
  const sweJobs = standardized.filter(j => isSWERole(j.title))
  if (sweJobs.length === 0) {
    stats.companies_synced++
    return
  }

  // 3. Build rows and collect normalized keys
  const now = new Date().toISOString()
  const rows: Record<string, unknown>[] = []
  const nkeys: string[] = []

  for (const job of sweJobs) {
    const nkey = normalizeKey(job.company, job.title, job.location)
    nkeys.push(nkey)
    rows.push({
      company_id: company.id,
      ats_job_id: job.ats_job_id,
      source_platform: job.source_platform,
      title: job.title,
      company: job.company,
      location: job.location,
      department: job.department,
      job_type: classifyJobType(job.title),
      apply_url: job.apply_url,
      remote_policy: job.remote_policy,
      description: job.description,
      posted_at: job.posted_at,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      required_skills: job.tags.length ? job.tags : [],
      preferred_skills: [],
      is_active: true,
      normalized_key: nkey,
      updated_at: now,
    })
  }

  // 4. Batch-fetch existing keys in one query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRows } = await (adminClient.from('jobs') as any)
    .select('id, normalized_key')
    .in('normalized_key', nkeys)

  const existingMap = new Map<string, string>()
  for (const r of (existingRows ?? [])) {
    existingMap.set(r.normalized_key, r.id)
  }

  // 5. Split into inserts vs updates, then batch
  const toInsert: Record<string, unknown>[] = []
  const toUpdate: Record<string, unknown>[] = []

  for (const row of rows) {
    const existingId = existingMap.get(row.normalized_key as string)
    if (existingId) {
      toUpdate.push({ ...row, id: existingId })
    } else {
      toInsert.push({ ...row, first_seen_at: now })
    }
  }

  // Batch insert (Supabase handles arrays)
  if (toInsert.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('jobs') as any).upsert(toInsert, { onConflict: 'normalized_key' })
    stats.jobs_created += toInsert.length
  }

  // Batch update via upsert on id
  if (toUpdate.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('jobs') as any).upsert(toUpdate, { onConflict: 'id' })
    stats.jobs_updated += toUpdate.length
  }

  const activeAtsJobIds = sweJobs.map(j => j.ats_job_id)

  // 4. Deactivate stale jobs for this company
  if (activeAtsJobIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stale } = await (adminClient.from('jobs') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('company_id', company.id)
      .eq('is_active', true)
      .not('ats_job_id', 'in', `(${activeAtsJobIds.map(id => `"${id}"`).join(',')})`)
      .select('id')

    stats.jobs_deactivated += stale?.length || 0
  }

  // 5. Update company last_synced_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('companies') as any)
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', company.id)

  stats.companies_synced++
}

/** Parse batch query params. Use for Vercel Hobby (10s limit) or manual batching. */
function parseBatchParams(request: Request): {
  offset: number; limit: number; phase: 'ats' | 'remoteok' | 'all'; platform: ATSPlatform | null
} {
  const url = new URL(request.url)
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam == null ? Infinity : Math.max(1, parseInt(limitParam, 10) || 10)
  const phase = (url.searchParams.get('phase') ?? 'all') as 'ats' | 'remoteok' | 'all'
  const platformParam = url.searchParams.get('platform')
  const validPlatforms: ATSPlatform[] = ['greenhouse', 'lever', 'ashby', 'smartrecruiters']
  const platform = platformParam && validPlatforms.includes(platformParam as ATSPlatform)
    ? (platformParam as ATSPlatform) : null
  if (!['ats', 'remoteok', 'all'].includes(phase)) {
    return { offset, limit, phase: 'all', platform }
  }
  return { offset, limit, phase, platform }
}

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

  const { offset, limit, phase, platform } = parseBatchParams(request)
  let totalCompanies = 0

  const stats: SyncStats = {
    companies_synced: 0,
    companies_failed: 0,
    jobs_created: 0,
    jobs_updated: 0,
    jobs_deactivated: 0,
    remoteok_added: 0,
  }

  // --- Phase 1: ATS company sync ---
  const runAts = phase === 'ats' || phase === 'all'
  if (runAts) {
    let companyQuery = adminClient
      .from('companies')
      .select('id, name, slug, ats_platform')
      .eq('is_active', true)
    if (platform) companyQuery = companyQuery.eq('ats_platform', platform)
    const { data: allCompanies } = await companyQuery

    const companies = allCompanies ?? []
    totalCompanies = companies.length
    const slice = companies.slice(offset, offset + limit)

    if (slice.length) {
      for (let i = 0; i < slice.length; i += BATCH_SIZE) {
        const batch = slice.slice(i, i + BATCH_SIZE)
        await processBatch(batch, adminClient, stats)
        if (i + BATCH_SIZE < slice.length) await delay(BATCH_DELAY_MS)
      }
    }

    if (phase === 'ats') {
      const hasMore = offset + limit < totalCompanies
      const nextOffset = offset + limit
      return NextResponse.json({
        ...stats,
        batch: { offset, limit, next_offset: nextOffset, has_more: hasMore, total_companies: totalCompanies },
      })
    }
  }

  // --- Phase 2: RemoteOK bulk sync ---
  if (phase === 'remoteok' || phase === 'all') {
    const remoteJobs = await fetchRemoteOKJobs()
    const sweRemote = remoteJobs.filter(j => isSWERole(j.position))

    for (const job of sweRemote) {
      const std = rokStd(job)
      const nkey = normalizeKey(std.company, std.title, std.location)

      // Skip if normalized_key already exists (ATS source wins)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (adminClient.from('jobs') as any)
        .select('id')
        .eq('normalized_key', nkey)
        .maybeSingle()

      if (existing) continue

      const jobType = classifyJobType(std.title)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.from('jobs') as any).insert({
        ats_job_id: std.ats_job_id,
        source_platform: 'remoteok',
        title: std.title,
        company: std.company,
        location: std.location,
        job_type: jobType,
        apply_url: std.apply_url,
        remote_policy: 'remote',
        salary_min: std.salary_min,
        salary_max: std.salary_max,
        required_skills: std.tags,
        preferred_skills: [],
        is_active: true,
        normalized_key: nkey,
        first_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      stats.remoteok_added++
    }
  }

  const batch =
    phase === 'all' && totalCompanies > 0
      ? {
          offset,
          limit,
          next_offset: offset + limit,
          has_more: offset + limit < totalCompanies,
          total_companies: totalCompanies,
        }
      : undefined

  return NextResponse.json(batch ? { ...stats, batch } : stats)
}
