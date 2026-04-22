import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const NO_STORE = { 'Cache-Control': 'no-store, private' }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })

  const { data: baseIdentity, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500, headers: NO_STORE })
  }

  const { data: regionalIdentities, error: regionalError } = await supabase
    .from('user_regional_identities')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  if (regionalError) {
    return NextResponse.json({ error: regionalError.message }, { status: 500, headers: NO_STORE })
  }

  return NextResponse.json(
    { baseIdentity: baseIdentity ?? null, regionalIdentities: regionalIdentities ?? [] },
    { headers: NO_STORE }
  )
}
