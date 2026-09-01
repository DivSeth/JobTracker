/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildResumeDraftTex } from '@/lib/artifacts/resume-draft'
import { loadLatestResumeStrategyPreview } from '@/lib/resume-strategy/repository'

type SupabaseArtifactClient = {
  from(table: string): any
}

export type GeneratedArtifactStatus = 'draft' | 'validated' | 'approved' | 'rejected' | 'archived'

export interface GeneratedArtifactSummary {
  id: string
  artifact_type: string
  status: GeneratedArtifactStatus
  content: string | null
  storage_path?: string | null
  model?: string | null
  prompt_version?: string | null
  metadata?: Record<string, any> | null
  job_analysis_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

async function insertSingle<T>(
  client: SupabaseArtifactClient,
  table: string,
  payload: unknown
): Promise<T> {
  const { data, error } = await client.from(table).insert(payload).select().single()

  if (error) {
    throw new Error(error.message ?? `Failed to insert ${table}`)
  }

  return data as T
}

export async function createLatestResumeDraftArtifact<T = unknown>(
  client: SupabaseArtifactClient,
  userId: string
): Promise<T> {
  const preview = await loadLatestResumeStrategyPreview(client, userId)

  if (!preview) {
    throw new Error('Analyze a job before creating a resume draft')
  }

  return insertSingle<T>(client, 'generated_artifacts', {
    user_id: userId,
    job_analysis_id: preview.jobAnalysisId,
    artifact_type: 'resume_tex',
    status: 'draft',
    content: buildResumeDraftTex(preview),
    prompt_version: 'deterministic-resume-draft-v1',
    model: 'local-rules',
    metadata: {
      generator: 'deterministic-resume-draft-v1',
      headline: preview.headline,
      role_archetype_key: preview.roleArchetypeKey,
      selected_claim_ids: preview.selectedClaims.map((claim) => claim.id),
      overclaim_rules: preview.overclaimRules,
    },
  })
}

export async function loadRecentGeneratedArtifacts(
  client: SupabaseArtifactClient,
  userId: string,
  limit = 10
): Promise<GeneratedArtifactSummary[]> {
  const { data, error } = await client
    .from('generated_artifacts')
    .select(
      'id, artifact_type, status, content, storage_path, model, prompt_version, metadata, job_analysis_id, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message ?? 'Failed to load generated artifacts')
  }

  return (data ?? []) as GeneratedArtifactSummary[]
}

export async function updateGeneratedArtifactStatus<T = unknown>(
  client: SupabaseArtifactClient,
  userId: string,
  artifactId: string,
  status: GeneratedArtifactStatus
): Promise<T> {
  const { data, error } = await client
    .from('generated_artifacts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', artifactId)
    .eq('user_id', userId)
    .select('id, status, updated_at')
    .single()

  if (error) {
    throw new Error(error.message ?? 'Failed to update generated artifact')
  }

  return data as T
}
