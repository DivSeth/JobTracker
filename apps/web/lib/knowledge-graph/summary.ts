/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_noStore as noStore } from 'next/cache'

export interface KnowledgeSummary {
  evidenceSources: Array<Record<string, any>>
  claims: Array<Record<string, any>>
  contacts: Array<Record<string, any>>
  jobAnalyses: Array<Record<string, any>>
  openAlerts: Array<Record<string, any>>
}

export interface IngestionVerificationChunk {
  id: string
  evidence_source_id: string
  chunk_index: number
  content: string
  token_count?: number | null
  metadata?: Record<string, any>
}

export interface IngestionVerificationEntity {
  id: string
  entity_type: string
  name: string
  normalized_name: string
}

export interface IngestionVerificationClaim {
  id: string
  claim: string
  category: string
  evidence_strength?: string | null
  confidence?: number | null
  status?: string | null
  support_level?: string | null
  source_chunk: IngestionVerificationChunk | null
  entities: IngestionVerificationEntity[]
  do_not_overclaim?: string[]
  metadata?: Record<string, any>
}

export interface IngestionVerificationSource {
  id: string
  title: string
  source_type: string
  created_at?: string
  metadata?: Record<string, any>
  chunks: IngestionVerificationChunk[]
  claims: IngestionVerificationClaim[]
}

type SupabaseSelectClient = {
  from(table: string): any
}

async function loadRecent(
  client: SupabaseSelectClient,
  table: string,
  userId: string,
  columns: string,
  limit = 5
) {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message ?? `Failed to load ${table}`)
  }

  return data ?? []
}

export async function loadOpenNetworkAlerts(
  client: SupabaseSelectClient,
  userId: string,
  limit = 5
) {
  const { data, error } = await client
    .from('network_alerts')
    .select('id, message, status, created_at, job_analysis_id, contact_id')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message ?? 'Failed to load network alerts')
  }

  return data ?? []
}

export async function loadKnowledgeSummary(
  client: SupabaseSelectClient,
  userId: string
): Promise<KnowledgeSummary> {
  const [evidenceSources, claims, contacts, jobAnalyses, openAlerts] = await Promise.all([
    loadRecent(client, 'evidence_sources', userId, 'id, title, source_type, created_at'),
    loadRecent(client, 'professional_claims', userId, 'id, claim, category, evidence_strength, status, created_at'),
    loadRecent(client, 'network_contacts', userId, 'id, full_name, relationship_strength, created_at'),
    loadRecent(client, 'job_analyses', userId, 'id, title, company_name, fit_score, created_at'),
    loadOpenNetworkAlerts(client, userId),
  ])

  return {
    evidenceSources,
    claims,
    contacts,
    jobAnalyses,
    openAlerts,
  }
}

export async function loadIngestionVerification(
  client: SupabaseSelectClient,
  userId: string,
  limit = 3
): Promise<IngestionVerificationSource[]> {
  noStore()

  const { data: sources, error: sourceError } = await client
    .from('evidence_sources')
    .select('id, title, source_type, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (sourceError) {
    throw new Error(sourceError.message ?? 'Failed to load ingestion sources')
  }

  const sourceRows = (sources ?? []) as IngestionVerificationSource[]
  const sourceIds = sourceRows.map((source) => source.id)
  if (!sourceIds.length) return []

  const [{ data: chunks, error: chunkError }, { data: links, error: linkError }] = await Promise.all([
    client
      .from('evidence_chunks')
      .select('id, evidence_source_id, chunk_index, content, token_count, metadata')
      .eq('user_id', userId)
      .in('evidence_source_id', sourceIds)
      .order('chunk_index', { ascending: true })
      .limit(100),
    client
      .from('professional_claim_evidence')
      .select(`
        evidence_source_id,
        evidence_chunk_id,
        support_level,
        professional_claims (
          id,
          claim,
          category,
          evidence_strength,
          confidence,
          status,
          do_not_overclaim,
          metadata,
          created_at
        )
      `)
      .eq('user_id', userId)
      .in('evidence_source_id', sourceIds)
      .limit(100),
  ])

  if (chunkError) throw new Error(chunkError.message ?? 'Failed to load evidence chunks')
  if (linkError) throw new Error(linkError.message ?? 'Failed to load claim evidence')

  const chunkRows = (chunks ?? []) as IngestionVerificationChunk[]
  const linkRows = (links ?? []) as Array<Record<string, any>>
  const claimIds = Array.from(new Set(
    linkRows.map((link) => link.professional_claims?.id).filter(Boolean)
  ))

  const relationshipRows = claimIds.length
    ? await client
      .from('claim_relationships')
      .select(`
        claim_id,
        claim_entities (
          id,
          entity_type,
          name,
          normalized_name
        )
      `)
      .eq('user_id', userId)
      .in('claim_id', claimIds)
      .limit(200)
    : { data: [], error: null }

  if (relationshipRows.error) {
    throw new Error(relationshipRows.error.message ?? 'Failed to load claim entities')
  }

  const chunksBySource = new Map<string, IngestionVerificationChunk[]>()
  const chunksById = new Map<string, IngestionVerificationChunk>()
  for (const chunk of chunkRows) {
    chunksById.set(chunk.id, chunk)
    chunksBySource.set(chunk.evidence_source_id, [
      ...(chunksBySource.get(chunk.evidence_source_id) ?? []),
      chunk,
    ])
  }

  const entitiesByClaim = new Map<string, IngestionVerificationEntity[]>()
  for (const relationship of (relationshipRows.data ?? []) as Array<Record<string, any>>) {
    const entity = relationship.claim_entities
    if (!entity) continue
    entitiesByClaim.set(relationship.claim_id, [
      ...(entitiesByClaim.get(relationship.claim_id) ?? []),
      entity as IngestionVerificationEntity,
    ])
  }

  const claimsBySource = new Map<string, IngestionVerificationClaim[]>()
  for (const link of linkRows) {
    const claim = link.professional_claims
    if (!claim?.id) continue
    claimsBySource.set(link.evidence_source_id, [
      ...(claimsBySource.get(link.evidence_source_id) ?? []),
      {
        id: claim.id,
        claim: claim.claim,
        category: claim.category,
        evidence_strength: claim.evidence_strength,
        confidence: claim.confidence,
        status: claim.status,
        support_level: link.support_level,
        source_chunk: link.evidence_chunk_id ? chunksById.get(link.evidence_chunk_id) ?? null : null,
        entities: entitiesByClaim.get(claim.id) ?? [],
        do_not_overclaim: claim.do_not_overclaim ?? [],
        metadata: claim.metadata ?? {},
      },
    ])
  }

  return sourceRows.map((source) => ({
    ...source,
    chunks: chunksBySource.get(source.id) ?? [],
    claims: claimsBySource.get(source.id) ?? [],
  }))
}
