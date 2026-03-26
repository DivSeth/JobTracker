// pdf-parse is a CommonJS module; suppress webpack default-export warning
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse')
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'

interface ResumeParseResult {
  experience: Array<{
    company: string
    role: string
    employment_type: string
    start: string
    end: string | null
    bullets: string[]
  }>
  education: Array<{
    school: string
    degree: string
    major: string
    gpa: number | null
    graduation_year: number
  }>
  skills: string[]
  certifications: Array<{
    name: string
    issuer: string
    date: string | null
    expiry: string | null
  }>
  languages: Array<{
    language: string
    proficiency: string
  }>
}

const RESUME_PARSE_SYSTEM = `You are a resume parser. Extract structured data from resume text. Be thorough — extract ALL entries. Use ISO date formats (YYYY-MM). For employment_type, infer from context: use 'internship' if the role mentions intern/internship, 'full_time' otherwise. For language proficiency, infer from context or default to 'professional'. Return valid JSON only.`

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  let fileBuffer: Buffer

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    // FormData with file field
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    fileBuffer = Buffer.from(await file.arrayBuffer())
  } else {
    // JSON body with resume_path
    const body = await request.json()
    const resumePath = body?.resume_path as string | undefined
    if (!resumePath) {
      return NextResponse.json({ error: 'No file or resume_path provided' }, { status: 400 })
    }
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('profile-documents')
      .download(resumePath)
    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download resume file' }, { status: 500 })
    }
    fileBuffer = Buffer.from(await fileData.arrayBuffer())
  }

  // Extract text from PDF
  let resumeText: string
  try {
    const pdfData = await pdfParse(fileBuffer)
    resumeText = pdfData.text
  } catch {
    return NextResponse.json(
      { error: 'Could not extract text from PDF. The file may be image-based or corrupted.' },
      { status: 422 }
    )
  }

  if (resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: 'Could not extract text from PDF. The file may be image-based or corrupted.' },
      { status: 422 }
    )
  }

  // Call Gemini for structured extraction
  const RESUME_PARSE_PROMPT = `Extract the following structured data from this resume text. Return JSON with these exact fields:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null if current", "bullets": ["achievement 1", "achievement 2"]}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024}],
  "skills": ["skill1", "skill2"],
  "certifications": [{"name": "", "issuer": "", "date": "YYYY-MM or null", "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}

If a section has no data, use an empty array. Extract ALL entries found.

Resume text:
\`\`\`
${resumeText}
\`\`\``

  try {
    const result = await callGemini(RESUME_PARSE_PROMPT, RESUME_PARSE_SYSTEM)
    const parsed = parseGeminiJSON<ResumeParseResult>(result.text)
    return NextResponse.json({
      data: parsed,
      tokens: { input: result.inputTokens, output: result.outputTokens },
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'Resume parsing failed. Try uploading a different file, or fill in your details manually.',
      },
      { status: 500 }
    )
  }
}
