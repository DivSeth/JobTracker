import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { encryptPii, decryptPii, PII_FIELDS } from '@/lib/supabase/encryption'
import { applicationProfileSchema } from '@/lib/schemas/application-profile'
import type { ApplicationProfile } from '@/lib/types'

async function decryptProfilePii(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const decrypted = { ...profile }
  for (const field of PII_FIELDS) {
    if (profile[field]) {
      decrypted[field] = await decryptPii(supabase, profile[field] as string)
    }
  }
  return decrypted
}

async function encryptProfilePii(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const encrypted = { ...data }
  for (const field of PII_FIELDS) {
    if (data[field] != null) {
      encrypted[field] = await encryptPii(supabase, data[field] as string)
    }
  }
  return encrypted
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profiles = await Promise.all(
    (data as ApplicationProfile[]).map((profile) =>
      decryptProfilePii(supabase, profile as unknown as Record<string, unknown>)
    )
  )

  return NextResponse.json(profiles)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let parsed
  try {
    parsed = applicationProfileSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    throw err
  }

  const encrypted = await encryptProfilePii(
    supabase,
    parsed as unknown as Record<string, unknown>
  )

  const { data, error } = await supabase
    .from('application_profiles')
    .insert({ ...encrypted, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const decrypted = await decryptProfilePii(
    supabase,
    data as unknown as Record<string, unknown>
  )

  return NextResponse.json(decrypted, { status: 201 })
}
