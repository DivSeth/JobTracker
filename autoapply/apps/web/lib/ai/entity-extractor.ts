import { callGemini, parseGeminiJSON } from './gemini'
import type { EmailEntities } from '@/lib/types'

const SYSTEM_PROMPT = `Extract job application entities from this email. Respond in JSON:
{"company_name": "...", "role_title": "...", "job_type": "internship|new_grad|fulltime|unknown", "location": "..." or null, "confidence": 0.0-1.0}`

export async function extractEntities(
  subject: string,
  body: string,
  category: string
): Promise<{ result: EmailEntities; inputTokens: number; outputTokens: number }> {
  const prompt = `Category: ${category}\nSubject: ${subject}\nBody: ${body.slice(0, 500)}`
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const result = parseGeminiJSON<EmailEntities>(text)
    return { result, inputTokens, outputTokens }
  } catch {
    return {
      result: { company_name: 'Unknown', role_title: 'Unknown', job_type: 'unknown', location: null, confidence: 0 },
      inputTokens, outputTokens,
    }
  }
}
