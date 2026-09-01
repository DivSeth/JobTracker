import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}
const NO_STORE = { 'Cache-Control': 'no-store, private' }
const HEADERS = { ...NO_STORE, ...CORS }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: HEADERS })

  const [
    { data: baseIdentity, error: profileError },
    { data: regionalIdentities, error: regionalError },
    appProfilesResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_regional_identities')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }),
    supabase
      .from('application_profiles')
      .select('id, name, is_default, resume_path, cover_letter_path, experience, education, skills, certifications, languages')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }),
  ])

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500, headers: HEADERS })
  }

  if (regionalError) {
    return NextResponse.json({ error: regionalError.message }, { status: 500, headers: HEADERS })
  }

  if (appProfilesResult.error) {
    console.error('[extension/profile] application_profiles fetch failed (non-fatal):', appProfilesResult.error.message)
  }

  return NextResponse.json(
    {
      baseIdentity: baseIdentity ?? null,
      regionalIdentities: regionalIdentities ?? [],
      applicationProfiles: appProfilesResult.data ?? [],
    },
    { headers: HEADERS }
  )
}
