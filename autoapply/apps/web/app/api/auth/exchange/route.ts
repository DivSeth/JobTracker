import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(request: Request) {
  let code: string | undefined
  try {
    const body = await request.json()
    code = typeof body?.code === 'string' ? body.code : undefined
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: CORS })
  }

  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400, headers: CORS })
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: row } = await adminClient
    .from('auth_exchange_codes')
    .select('code, access_token, refresh_token, expires_at, used')
    .eq('code', code)
    .single()

  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: 'invalid_or_expired_code' }, { status: 401, headers: CORS })
  }

  await adminClient
    .from('auth_exchange_codes')
    .update({ used: true })
    .eq('code', code)

  return NextResponse.json(
    { access_token: row.access_token, refresh_token: row.refresh_token },
    { headers: CORS }
  )
}
