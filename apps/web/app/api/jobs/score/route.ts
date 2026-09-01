import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ruleBasedScore } from '@/lib/scoring/rule-scorer'
import { geminiScore } from '@/lib/scoring/gemini-scorer'
import type { Job, Profile } from '@/lib/types'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles } = await adminClient.from('profiles').select('*')
  if (!profiles?.length) return NextResponse.json({ scored: 0, message: 'No profiles found' })

  const { data: jobs } = await adminClient
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .limit(50)

  if (!jobs?.length) return NextResponse.json({ scored: 0 })

  let scored = 0
  let geminiCalls = 0

  for (const profile of profiles) {
    const { data: existingScores } = await adminClient
      .from('job_scores')
      .select('job_id')
      .eq('user_id', profile.user_id)

    const scoredJobIds = new Set((existingScores ?? []).map((s: { job_id: string }) => s.job_id))
    const unscored = jobs.filter(j => !scoredJobIds.has(j.id))

    for (const job of unscored) {
      const rule = ruleBasedScore(job as Job, profile as unknown as Profile)

      let finalScore = rule.score
      let finalVerdict = rule.verdict
      let tier: string = rule.tier
      let reasoning: string | null = null
      let matchingSkills = rule.matching_skills
      let skillGaps = rule.skill_gaps

      if (rule.tier === 'needs_gemini' && geminiCalls < 15) {
        try {
          const { result } = await geminiScore(job as Job, profile as unknown as Profile)
          finalScore = result.score
          finalVerdict = result.verdict
          tier = 'claude_scored'
          reasoning = result.reasoning
          matchingSkills = result.matching_skills
          skillGaps = result.skill_gaps
          geminiCalls++

          await adminClient.from('ai_logs').insert({
            user_id: profile.user_id, model: 'gemini-2.0-flash', step: 'score',
            input_tokens: 0, output_tokens: 0, latency_ms: 0,
          })
        } catch {
          // Fall back to rule score on Gemini failure
        }
      }

      await adminClient.from('job_scores').upsert({
        job_id: job.id,
        user_id: profile.user_id,
        score: finalScore,
        verdict: finalVerdict,
        tier,
        matching_skills: matchingSkills,
        skill_gaps: skillGaps,
        reasoning,
        scored_at: new Date().toISOString(),
      }, { onConflict: 'job_id,user_id' })

      scored++
    }
  }

  return NextResponse.json({ scored, gemini_calls: geminiCalls })
}
