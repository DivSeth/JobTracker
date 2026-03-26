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

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const decrypted = await decryptProfilePii(
    supabase,
    data as unknown as Record<string, unknown>
  )

  return NextResponse.json(decrypted)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let parsed
  try {
    parsed = applicationProfileSchema.partial().parse(await request.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    throw err
  }

  const encrypted = await encryptProfilePii(
    supabase,
    parsed as unknown as Record<string, unknown>
  )

  const { data, error } = await supabase
    .from('application_profiles')
    .update(encrypted)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const decrypted = await decryptProfilePii(
    supabase,
    data as unknown as Record<string, unknown>
  )

  return NextResponse.json(decrypted)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch profile first to get file paths for cleanup
  const { data: profile } = await supabase
    .from('application_profiles')
    .select('resume_path, cover_letter_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: Pick<ApplicationProfile, 'resume_path' | 'cover_letter_path'> | null }

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete the profile row
  const { error } = await supabase
    .from('application_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clean up associated storage files
  const filePaths = [profile.resume_path, profile.cover_letter_path].filter(
    (p): p is string => Boolean(p)
  )
  if (filePaths.length > 0) {
    await supabase.storage.from('profile-documents').remove(filePaths)
  }

  return NextResponse.json({ success: true })
}
