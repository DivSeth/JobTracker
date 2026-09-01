import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { regionalIdentityCreateSchema, type RegionalIdentityCreate } from '@/lib/schemas/regional-identity'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let parsed: RegionalIdentityCreate
  try {
    parsed = regionalIdentityCreateSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    throw err
  }

  // New fields (eeo_gender, eeo_race, eeo_veteran_status, eeo_disability_status, default_profile_id)
  // flow through via parsed — no allowlist to update here.
  const { data, error } = await supabase
    .from('user_regional_identities')
    .insert({ ...parsed, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
