import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_CONTENT_TYPE = 'application/pdf'
const ALLOWED_FILE_TYPES = ['resume', 'cover_letter'] as const
type FileType = typeof ALLOWED_FILE_TYPES[number]

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify profile belongs to user
  const { data: profile, error: profileError } = await supabase
    .from('application_profiles')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Parse FormData
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const fileType = formData.get('type') as string | null
  if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType as FileType)) {
    return NextResponse.json(
      { error: 'Invalid file type. Must be "resume" or "cover_letter"' },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size exceeds 5MB limit' },
      { status: 400 }
    )
  }

  // Validate content type
  if (file.type !== ALLOWED_CONTENT_TYPE) {
    return NextResponse.json(
      { error: 'File must be a PDF (application/pdf)' },
      { status: 400 }
    )
  }

  // Upload to Supabase Storage
  const storagePath = `${user.id}/${id}/${fileType}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('profile-documents')
    .upload(storagePath, buffer, {
      contentType: ALLOWED_CONTENT_TYPE,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Update the profile row with the file path
  const pathField = fileType === 'resume' ? 'resume_path' : 'cover_letter_path'
  const { error: updateError } = await supabase
    .from('application_profiles')
    .update({ [pathField]: storagePath })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Generate a signed URL (1 hour expiry)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('profile-documents')
    .createSignedUrl(storagePath, 3600)

  if (signedUrlError || !signedUrlData) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({
    path: storagePath,
    url: signedUrlData.signedUrl,
  })
}
