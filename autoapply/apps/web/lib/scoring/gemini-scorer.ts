import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'
import type { Job, Profile } from '@/lib/types'

interface GeminiScoringResult {
  score: number
  verdict: 'strong_match' | 'stretch' | 'skip'
  matching_skills: string[]
  skill_gaps: string[]
  reasoning: string
}

const SYSTEM_PROMPT = `You are a job relevance scorer. Given a job posting and candidate profile, assess fit.
Consider: skill transferability, career trajectory, growth potential, not just exact keyword matches.
Respond in JSON: {"score": 0-100, "verdict": "strong_match|stretch|skip", "matching_skills": [...], "skill_gaps": [...], "reasoning": "..."}`

export async function geminiScore(
  job: Job,
  profile: Profile
): Promise<{ result: GeminiScoringResult; inputTokens: number; outputTokens: number }> {
  const prompt = `Job:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.required_skills.join(', ') || 'Not specified'}
Preferred Skills: ${job.preferred_skills.join(', ') || 'Not specified'}
Location: ${job.location ?? 'Not specified'}
Type: ${job.job_type ?? 'Not specified'}

Candidate:
Skills: ${profile.skills.join(', ')}
Preferred Job Types: ${profile.preferences.job_types.join(', ')}
Preferred Locations: ${profile.preferences.locations.join(', ')}
Remote OK: ${profile.preferences.remote_ok}`

  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const result = parseGeminiJSON<GeminiScoringResult>(text)
    return { result, inputTokens, outputTokens }
  } catch {
    return {
      result: { score: 50, verdict: 'stretch', matching_skills: [], skill_gaps: [], reasoning: 'Parse error' },
      inputTokens, outputTokens,
    }
  }
}
