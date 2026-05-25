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
    graduation_month: number | null
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

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const data = new Uint8Array(buffer)
  const doc = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(text)
  }
  return pages.join('\n').trim()
}

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    fileBuffer = Buffer.from(await file.arrayBuffer())
  } else {
    const body = await request.json()
    const resumePath = body?.resume_path as string | undefined
    if (!resumePath) return NextResponse.json({ error: 'No file or resume_path provided' }, { status: 400 })
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('profile-documents')
      .download(resumePath)
    if (downloadError || !fileData) {
      return NextResponse.json({ error: `Failed to download resume: ${downloadError?.message ?? 'unknown'}` }, { status: 500 })
    }
    fileBuffer = Buffer.from(await fileData.arrayBuffer())
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })

  let resumeText = ''
  try {
    resumeText = await extractTextFromPdf(fileBuffer)
  } catch (pdfErr) {
    const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
    return NextResponse.json({ error: `PDF text extraction failed: ${msg}` }, { status: 500 })
  }

  const RESUME_PARSE_PROMPT = resumeText.length >= 50
    ? `Extract the following structured data from this resume text. Return JSON with these exact fields:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null if current", "bullets": ["achievement 1"]}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024, "graduation_month": 5}],
  "skills": ["skill1", "skill2"],
  "certifications": [{"name": "", "issuer": "", "date": "YYYY-MM or null", "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}

graduation_month is 1–12 (1=Jan). If month unknown, use null. If a section has no data, use [].

Resume text:
\`\`\`
${resumeText}
\`\`\``
    : `You are a resume parser. Extract ALL structured data from this resume. Return JSON:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null", "bullets": []}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024, "graduation_month": 5}],
  "skills": [],
  "certifications": [{"name": "", "issuer": "", "date": null, "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}
graduation_month is 1–12 or null.`

  try {
    const result = await callGemini(RESUME_PARSE_PROMPT, RESUME_PARSE_SYSTEM, 4096)
    const parsed = parseGeminiJSON<ResumeParseResult>(result.text)
    return NextResponse.json({ data: parsed, tokens: { input: result.inputTokens, output: result.outputTokens } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini parse failed: ${msg}` }, { status: 500 })
  }
}
