import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getGmailTokens, buildVaultKey } from '@/lib/gmail/vault'
import { baseIdentityPatchSchema, type BaseIdentityPatch } from '@/lib/schemas/base-identity'
import { ZodError } from 'zod'

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

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let parsed: BaseIdentityPatch
  try {
    parsed = baseIdentityPatchSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    throw err
  }

  if (Object.keys(parsed).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
