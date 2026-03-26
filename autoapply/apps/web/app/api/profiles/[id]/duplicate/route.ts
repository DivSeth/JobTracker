import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { decryptPii, PII_FIELDS } from '@/lib/supabase/encryption'
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

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch source profile
  const { data: sourceProfile, error: fetchError } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: ApplicationProfile | null; error: unknown }

  if (fetchError || !sourceProfile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Determine new name
  let newName = `${sourceProfile.name} (Copy)`
  try {
    const body = await request.json()
    if (body.name && typeof body.name === 'string') {
      newName = body.name
    }
  } catch {
    // No body or invalid JSON — use default name
  }

  // Build insert payload — copy all fields except identity/metadata fields
  // PII fields (BYTEA) are copied as-is since they are already encrypted in DB
  const {
    id: _id,
    is_default: _isDefault,
    name: _name,
    created_at: _createdAt,
    updated_at: _updatedAt,
    user_id: _userId,
    resume_path,
    cover_letter_path,
    ...restFields
  } = sourceProfile as ApplicationProfile & Record<string, unknown>

  // Insert new profile row first (without file paths) to get new ID
  const { data: newProfile, error: insertError } = await supabase
    .from('application_profiles')
    .insert({
      ...restFields,
      user_id: user.id,
      name: newName,
      is_default: false,
      resume_path: null,
      cover_letter_path: null,
    })
    .select()
    .single()

  if (insertError || !newProfile) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Insert failed' },
      { status: 500 }
    )
  }

  const newProfileId = (newProfile as ApplicationProfile).id
  const updatedPaths: { resume_path?: string; cover_letter_path?: string } = {}

  // Duplicate files in Supabase Storage if they exist
  if (resume_path) {
    try {
      const { data: fileData } = await supabase.storage
        .from('profile-documents')
        .download(resume_path)
      if (fileData) {
        const newPath = `${user.id}/${newProfileId}/resume.pdf`
        await supabase.storage
          .from('profile-documents')
          .upload(newPath, fileData, { contentType: 'application/pdf' })
        updatedPaths.resume_path = newPath
      }
    } catch {
      // Non-fatal — file copy failure should not block profile duplication
    }
  }

  if (cover_letter_path) {
    try {
      const { data: fileData } = await supabase.storage
        .from('profile-documents')
        .download(cover_letter_path)
      if (fileData) {
        const newPath = `${user.id}/${newProfileId}/cover_letter.pdf`
        await supabase.storage
          .from('profile-documents')
          .upload(newPath, fileData, { contentType: 'application/pdf' })
        updatedPaths.cover_letter_path = newPath
      }
    } catch {
      // Non-fatal
    }
  }

  // Update profile with file paths if any were copied
  let finalProfile: Record<string, unknown> = newProfile as unknown as Record<string, unknown>
  if (Object.keys(updatedPaths).length > 0) {
    const { data: updatedProfile } = await supabase
      .from('application_profiles')
      .update(updatedPaths)
      .eq('id', newProfileId)
      .select()
      .single()
    if (updatedProfile) {
      finalProfile = updatedProfile as unknown as Record<string, unknown>
    }
  }

  const decrypted = await decryptProfilePii(supabase, finalProfile)
  return NextResponse.json(decrypted, { status: 201 })
}
