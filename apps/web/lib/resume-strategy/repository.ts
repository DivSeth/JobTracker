/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildResumeStrategyPreview, type ResumeStrategyPreviewData } from '@/lib/resume-strategy/planner'

type SupabaseSelectClient = {
  from(table: string): any
}

async function loadLatestJobAnalysis(client: SupabaseSelectClient, userId: string) {
  const { data, error } = await client
    .from('job_analyses')
    .select(
      'id, title, company_name, normalized_company, tech_stack, hidden_priorities, strategy, fit_score, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message ?? 'Failed to load latest job analysis')
  }

  return data?.[0] ?? null
}

async function loadRecentClaims(client: SupabaseSelectClient, userId: string) {
  const { data, error } = await client
    .from('professional_claims')
    .select(
      'id, claim, category, evidence_strength, confidence, resume_usable, best_role_archetypes, do_not_overclaim, status, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message ?? 'Failed to load professional claims')
  }

  return data ?? []
}

async function loadOpenAlerts(client: SupabaseSelectClient, userId: string, jobAnalysisId: string) {
  const { data, error } = await client
    .from('network_alerts')
    .select('id, message, status, created_at, job_analysis_id, contact_id')
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('job_analysis_id', jobAnalysisId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(error.message ?? 'Failed to load network alerts')
  }

  return data ?? []
}

export async function loadLatestResumeStrategyPreview(
  client: SupabaseSelectClient,
  userId: string
): Promise<ResumeStrategyPreviewData | null> {
  const latestJobAnalysis = await loadLatestJobAnalysis(client, userId)

  if (!latestJobAnalysis) {
    return null
  }

  const [claims, alerts] = await Promise.all([
    loadRecentClaims(client, userId),
    loadOpenAlerts(client, userId, latestJobAnalysis.id),
  ])

  return buildResumeStrategyPreview(latestJobAnalysis, claims, alerts)
}
