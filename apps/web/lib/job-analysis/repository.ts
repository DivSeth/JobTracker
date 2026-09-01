/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JobAnalysisResult } from '@/lib/job-analysis/analyzer'

type SupabaseLikeClient = {
  from(table: string): any
}

async function insertSingle<T>(
  client: SupabaseLikeClient,
  table: string,
  payload: unknown
): Promise<T> {
  const { data, error } = await client.from(table).insert(payload).select().single()

  if (error) {
    throw new Error(error.message ?? `Failed to insert ${table}`)
  }

  return data as T
}

async function findRoleArchetypeId(
  client: SupabaseLikeClient,
  roleKey: string
): Promise<string | null> {
  const { data, error } = await client
    .from('role_archetypes')
    .select('id')
    .eq('key', roleKey)
    .maybeSingle()

  if (error) {
    throw new Error(error.message ?? 'Failed to resolve role archetype')
  }

  return (data as { id?: string } | null)?.id ?? null
}

async function findMatchingContactRoles(
  client: SupabaseLikeClient,
  userId: string,
  normalizedCompany: string | null
) {
  if (!normalizedCompany) return []

  const { data, error } = await client
    .from('network_contact_roles')
    .select('id, contact_id, company_name, normalized_company')
    .eq('user_id', userId)
    .eq('normalized_company', normalizedCompany)

  if (error) {
    throw new Error(error.message ?? 'Failed to load network contacts')
  }

  return (data ?? []) as Array<{
    id: string
    contact_id: string
    company_name: string
    normalized_company: string
  }>
}

export async function createJobAnalysisWithNetworkAlerts<TAnalysis = unknown, TAlert = unknown>(
  client: SupabaseLikeClient,
  userId: string,
  analysis: JobAnalysisResult
): Promise<{ analysis: TAnalysis; networkAlerts: TAlert[] }> {
  const roleArchetypeId = await findRoleArchetypeId(client, analysis.role_archetype_key)

  const createdAnalysis = await insertSingle<{ id: string } & TAnalysis>(client, 'job_analyses', {
    user_id: userId,
    apply_url: analysis.apply_url,
    company_name: analysis.company_name,
    normalized_company: analysis.normalized_company,
    title: analysis.title,
    role_archetype_id: roleArchetypeId,
    seniority: analysis.seniority,
    tech_stack: analysis.tech_stack,
    requirements: analysis.requirements,
    hidden_priorities: analysis.hidden_priorities,
    strategy: {
      ...analysis.strategy,
      role_archetype_key: analysis.role_archetype_key,
    },
    fit_score: analysis.fit_score,
    model_version: 'deterministic-v1',
  })

  const matchingRoles = await findMatchingContactRoles(client, userId, analysis.normalized_company)
  const networkAlerts: TAlert[] = []

  for (const role of matchingRoles) {
    const alert = await insertSingle<TAlert>(client, 'network_alerts', {
      user_id: userId,
      job_analysis_id: createdAnalysis.id,
      contact_id: role.contact_id,
      contact_role_id: role.id,
      alert_type: 'company_match',
      status: 'open',
      message: `You know someone connected to ${role.company_name}. Consider messaging them before applying.`,
    })

    networkAlerts.push(alert)
  }

  return { analysis: createdAnalysis, networkAlerts }
}
