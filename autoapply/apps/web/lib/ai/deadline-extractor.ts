import { callGemini, parseGeminiJSON } from './gemini'
import type { ExtractedDeadline } from '@/lib/types'

const SYSTEM_PROMPT = `Extract deadlines and time-sensitive dates from this job-related email.
Respond in JSON: {"deadlines": [{"type": "oa_submission|interview_slot|offer_deadline|other", "datetime": "ISO8601", "is_exact": true/false, "confidence": 0.0-1.0, "raw_text": "..."}]}
If no deadlines found, return {"deadlines": []}`

export async function extractDeadlines(
  body: string,
  category: string,
  currentDate: string,
  userTimezone: string
): Promise<{ result: ExtractedDeadline[]; inputTokens: number; outputTokens: number }> {
  const prompt = `Category: ${category}\nCurrent date: ${currentDate}\nTimezone: ${userTimezone}\nBody: ${body.slice(0, 800)}`
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const parsed = parseGeminiJSON<{ deadlines: ExtractedDeadline[] }>(text)
    return { result: parsed.deadlines ?? [], inputTokens, outputTokens }
  } catch {
    return { result: [], inputTokens, outputTokens }
  }
}
