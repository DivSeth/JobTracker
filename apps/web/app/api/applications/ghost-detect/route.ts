import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale, error } = await adminClient
    .from('applications')
    .update({ status: 'ghosted', last_activity_at: new Date().toISOString() })
    .in('status', ['applied', 'oa', 'interviewing'])
    .lt('last_activity_at', thirtyDaysAgo)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ghosted: stale?.length ?? 0 })
}
