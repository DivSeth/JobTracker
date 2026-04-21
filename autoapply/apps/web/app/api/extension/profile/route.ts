import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: baseIdentity, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { data: regionalIdentities, error: regionalError } = await supabase
    .from('user_regional_identities')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  if (regionalError) {
    return NextResponse.json({ error: regionalError.message }, { status: 500 })
  }

  return NextResponse.json({
    baseIdentity: baseIdentity ?? null,
    regionalIdentities: regionalIdentities ?? [],
  })
}
