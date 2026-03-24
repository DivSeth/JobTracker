import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getGmailTokens, buildVaultKey } from '@/lib/gmail/vault'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      skills: body.skills ?? [],
      education: body.education ?? [],
      experience: body.experience ?? [],
      preferences: body.preferences ?? {},
      profile_details: body.profile_details ?? {},
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Revoke Gmail tokens if connected
  try {
    const tokens = await getGmailTokens(adminClient, user.id)
    if (tokens?.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
        method: 'POST',
      })
    }
  } catch { /* Non-fatal */ }

  // Delete vault secrets
  const key = buildVaultKey(user.id)
  const { data: secret } = await adminClient
    .schema('vault')
    .from('secrets')
    .select('id')
    .eq('name', key)
    .maybeSingle()
  if (secret?.id) {
    await adminClient.rpc('vault_delete_secret', { secret_id: secret.id })
  }

  // Delete user (CASCADE handles child tables)
  await adminClient.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
