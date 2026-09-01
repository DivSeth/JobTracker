import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const applyUrl = searchParams.get('applyUrl')

  if (!applyUrl) {
    return NextResponse.json({ error: 'applyUrl query param is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .select('id, applied_at')
    .eq('user_id', user.id)
    .eq('apply_url', applyUrl)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({
    exists: true,
    appliedAt: data.applied_at,
  })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const applyUrl = body.applyUrl as string | undefined
  const now = new Date().toISOString()
  const idempotencyKey = applyUrl ? `apply_url:${applyUrl}` : 'apply_url:missing'

  let jobId: string | null = null
  if (applyUrl) {
    const { data: existingApplication, error: existingError } = await supabase
      .from('applications')
      .select('id, status, applied_at')
      .eq('user_id', user.id)
      .eq('apply_url', applyUrl)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existingApplication) {
      console.info('autoapply.extension.track_application', {
        event: 'idempotent_replay',
        applicationId: existingApplication.id,
        hasApplyUrl: true,
      })

      return NextResponse.json({
        ...existingApplication,
        idempotent: true,
        idempotencyKey,
      })
    }

    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('apply_url', applyUrl)
      .maybeSingle()

    jobId = existingJob?.id ?? null
  }

  const payload = {
    user_id: user.id,
    job_id: jobId,
    apply_url: applyUrl ?? null,
    status: 'saved',
    source: 'extension_autofill',
    applied_at: null,
    last_activity_at: now,
    notes: null,
  }

  const { data, error } = await supabase
    .from('applications')
    .upsert(payload, { onConflict: 'user_id,apply_url' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.info('autoapply.extension.track_application', {
    event: 'created_or_upserted',
    applicationId: data.id,
    hasApplyUrl: Boolean(applyUrl),
  })

  return NextResponse.json({ ...data, idempotent: false, idempotencyKey }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const id = body.id as string | undefined
  const status = body.status as string | undefined

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    status,
    last_activity_at: new Date().toISOString(),
  }

  if (status === 'applied') {
    updates.applied_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
