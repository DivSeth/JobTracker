import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [baseRes, regionalRes, profilesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_regional_identities').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
    supabase.from('application_profiles').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    baseIdentity: baseRes.data ?? null,
    regionalIdentities: regionalRes.data ?? [],
    applicationProfiles: profilesRes.data ?? [],
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="autoapply-export.json"',
    },
  })
}
