import { callGemini, parseGeminiJSON } from './gemini'
import type { EmailClassification } from '@/lib/types'

interface ClassifierInput {
  subject: string
  body: string
  sender_domain: string
  current_date: string
}

const SYSTEM_PROMPT = `You are an email classifier for a job application tracker. Classify emails into exactly one category.

Categories:
- oa: Online assessment invitation (HackerRank, CodeSignal, Karat, take-home)
- interview_invite: Interview scheduling (phone screen, onsite, virtual)
- rejection: Application rejected or position filled
- offer: Job offer or offer letter
- application_confirm: Confirmation that application was received
- other: Not job-application related

Respond in JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`

export function buildClassifierPrompt(input: ClassifierInput): string {
  return `Subject: ${input.subject}
Sender domain: ${input.sender_domain}
Date: ${input.current_date}
Body (first 500 chars): ${input.body.slice(0, 500)}`
}

export function parseClassification(text: string): EmailClassification {
  try {
    const parsed = parseGeminiJSON<EmailClassification>(text)
    if (!parsed.category || typeof parsed.confidence !== 'number') {
      return { category: 'other', confidence: 0, reasoning: 'Parse error' }
    }
    return parsed
  } catch {
    return { category: 'other', confidence: 0, reasoning: 'Parse error' }
  }
}

export async function classifyEmail(input: ClassifierInput): Promise<{
  result: EmailClassification
  inputTokens: number
  outputTokens: number
}> {
  const prompt = buildClassifierPrompt(input)
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)
  return { result: parseClassification(text), inputTokens, outputTokens }
}
