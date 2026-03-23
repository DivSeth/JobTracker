import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, apply_url')
    .eq('is_active', true)
    .not('apply_url', 'is', null)
    .range(offset, offset + limit - 1)

  let checked = 0
  let deactivated = 0
  const BATCH = 15

  for (let i = 0; i < (jobs ?? []).length; i += BATCH) {
    const batch = jobs!.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (job) => {
        checked++
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 6000)
          const res = await fetch(job.apply_url!, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
          })
          clearTimeout(timeout)
          if (res.status === 404 || res.status === 410) {
            await supabase.from('jobs').update({ is_active: false }).eq('id', job.id)
            deactivated++
          }
        } catch {
          // Timeout or network error — skip (could be transient)
        }
      })
    )
  }

  return NextResponse.json({ checked, deactivated, offset, limit })
}
