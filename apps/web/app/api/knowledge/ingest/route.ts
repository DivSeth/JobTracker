import { ingestKnowledgeDocument } from '@/lib/knowledge-graph/repository'
import { KnowledgeUploadError, extractTextFromKnowledgeUpload } from '@/lib/knowledge-graph/document-upload'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

export const runtime = 'nodejs'

const ingestRequestSchema = z.object({
  source_type: z.enum([
    'resume',
    'work_experience_portfolio',
    'cover_letter',
    'project_note',
    'application_answer',
    'chatgpt_export',
    'linkedin',
    'github',
    'manual_note',
    'other',
  ]),
  title: z.string().trim().min(1).max(200),
  raw_text: z.string().trim().min(40),
  source_date: z.string().date().nullable().optional(),
  original_url: z.string().trim().url().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

function parseOptionalMetadata(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== 'string' || value.trim().length === 0) return {}

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'arrayBuffer' in value &&
    'name' in value &&
    'size' in value
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    const input = contentType.includes('multipart/form-data')
      ? await parseMultipartIngestRequest(request)
      : ingestRequestSchema.parse(await request.json())
    const result = await ingestKnowledgeDocument(supabase, user.id, input)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }

    if (err instanceof KnowledgeUploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to ingest document' },
      { status: 500 }
    )
  }
}

async function parseMultipartIngestRequest(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!isUploadedFile(file)) {
    throw new ZodError([{
      code: 'custom',
      path: ['file'],
      message: 'Upload a document file.',
      input: file,
    }])
  }

  const extracted = await extractTextFromKnowledgeUpload(file)

  return ingestRequestSchema.parse({
    source_type: String(formData.get('source_type') ?? 'other'),
    title: String(formData.get('title') ?? formData.get('document_title') ?? file.name),
    raw_text: extracted.rawText,
    source_date: formData.get('source_date') || undefined,
    original_url: formData.get('original_url') || undefined,
    metadata: {
      ...parseOptionalMetadata(formData.get('metadata')),
      ...extracted.metadata,
    },
  })
}
