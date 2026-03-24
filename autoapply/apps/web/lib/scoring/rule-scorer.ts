import type { Job, Profile } from '@/lib/types'

export interface ScoringResult {
  score: number
  verdict: 'strong_match' | 'stretch' | 'skip'
  tier: 'rule_match' | 'rule_skip' | 'needs_gemini'
  matching_skills: string[]
  skill_gaps: string[]
}

export function ruleBasedScore(job: Job, profile: Profile): ScoringResult {
  const userSkills = new Set(profile.skills.map(s => s.toLowerCase()))
  const required = job.required_skills.map(s => s.toLowerCase())

  const matching = required.filter(s => userSkills.has(s))
  const skillOverlap = required.length > 0 ? matching.length / required.length : 0.5

  const typeMatch = job.job_type && profile.preferences.job_types.includes(job.job_type) ? 1 : 0

  const locationMatch = profile.preferences.remote_ok ||
    job.remote_policy === 'remote' ||
    profile.preferences.locations.some(l => job.location?.toLowerCase().includes(l.toLowerCase())) ? 1 : 0

  const score = Math.round(skillOverlap * 60 + typeMatch * 20 + locationMatch * 20)

  const matchingOrigCase = job.required_skills.filter(s => userSkills.has(s.toLowerCase()))
  const gapsOrigCase = job.required_skills.filter(s => !userSkills.has(s.toLowerCase()))

  if (score >= 70) return { score, verdict: 'strong_match', tier: 'rule_match', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
  if (score < 30) return { score, verdict: 'skip', tier: 'rule_skip', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
  return { score, verdict: 'stretch', tier: 'needs_gemini', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
}
