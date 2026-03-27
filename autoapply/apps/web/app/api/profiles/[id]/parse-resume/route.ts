import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseGeminiJSON } from '@/lib/ai/gemini'

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

const RESUME_PARSE_PROMPT = `You are a resume parser. Extract structured data from this resume PDF. Be thorough — extract ALL entries. Use ISO date formats (YYYY-MM). For employment_type, infer from context: use 'internship' if the role mentions intern/internship, 'full_time' otherwise. For language proficiency, infer from context or default to 'professional'.

Return JSON with these exact fields:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null if current", "bullets": ["achievement 1", "achievement 2"]}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024}],
  "skills": ["skill1", "skill2"],
  "certifications": [{"name": "", "issuer": "", "date": "YYYY-MM or null", "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}

If a section has no data, use an empty array. Return valid JSON only.`

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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    fileBuffer = Buffer.from(await file.arrayBuffer())
  } else {
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

  // Send PDF directly to Gemini as inline base64 data — no pdf-parse needed
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  try {
    const base64Pdf = fileBuffer.toString('base64')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
              { text: RESUME_PARSE_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API error ${res.status}: ${err}`)
    }

    const geminiData = await res.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = parseGeminiJSON<ResumeParseResult>(text)
    return NextResponse.json({
      data: parsed,
      tokens: {
        input: geminiData.usageMetadata?.promptTokenCount ?? 0,
        output: geminiData.usageMetadata?.candidatesTokenCount ?? 0,
      },
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
