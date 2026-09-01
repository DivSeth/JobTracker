/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  evidenceSourceCreateSchema,
  networkContactCreateSchema,
  professionalClaimCreateSchema,
  type EvidenceSourceCreateInput,
  type NetworkContactCreateInput,
  type ProfessionalClaimCreateInput,
} from '@/lib/schemas/knowledge-graph'
import {
  chunkEvidenceText,
  extractDraftClaimsFromDocument,
  extractKnowledgeEntities,
  vectorToPgLiteral,
  type DraftClaim,
  type DraftEvidenceChunk,
  type KnowledgeDocumentIngestInput,
} from '@/lib/knowledge-graph/ingest'
import { createDefaultModelGateway } from '@/lib/model-gateway/gateway'
import type { ModelGateway } from '@/lib/model-gateway/types'

type InsertableClient = {
  from(table: string): any
}

async function insertSingle<T>(
  client: InsertableClient,
  table: string,
  payload: unknown
): Promise<T> {
  const { data, error } = await client.from(table).insert(payload).select().single()

  if (error) {
    throw new Error(error.message ?? `Failed to insert ${table}`)
  }

  return data as T
}

async function upsertSingle<T>(
  client: InsertableClient,
  table: string,
  payload: unknown,
  onConflict: string
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .upsert(payload, { onConflict })
    .select()
    .single()

  if (error) {
    throw new Error(error.message ?? `Failed to upsert ${table}`)
  }

  return data as T
}

export function normalizeCompanyName(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function termsForMatch(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2)
  )
}

function bestChunkForClaim(
  claim: DraftClaim,
  chunks: DraftEvidenceChunk[],
  createdChunks: Array<{ id: string }>
): { id: string } | null {
  if (!chunks.length) return null

  const claimTerms = termsForMatch(claim.claim)
  let bestIndex = 0
  let bestScore = -1

  chunks.forEach((chunk, index) => {
    const chunkTerms = new Set(chunk.semantic_terms)
    const overlap = Array.from(claimTerms).filter((term) => chunkTerms.has(term)).length
    const phraseBonus = chunk.content.toLowerCase().includes(claim.claim.toLowerCase()) ? 10 : 0
    const score = overlap + phraseBonus

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return createdChunks[bestIndex] ?? createdChunks[0] ?? null
}

export async function createEvidenceSource<T = unknown>(
  client: InsertableClient,
  userId: string,
  input: EvidenceSourceCreateInput
): Promise<T> {
  const source = evidenceSourceCreateSchema.parse(input)

  return insertSingle<T>(client, 'evidence_sources', {
    user_id: userId,
    ...source,
  })
}

export async function createProfessionalClaim<T = unknown>(
  client: InsertableClient,
  userId: string,
  input: ProfessionalClaimCreateInput
): Promise<T> {
  const { source_evidence_ids, ...claim } = professionalClaimCreateSchema.parse(input)
  const createdClaim = await insertSingle<{ id: string } & T>(client, 'professional_claims', {
    user_id: userId,
    ...claim,
  })

  for (const evidenceSourceId of source_evidence_ids) {
    await insertSingle(client, 'professional_claim_evidence', {
      user_id: userId,
      claim_id: createdClaim.id,
      evidence_source_id: evidenceSourceId,
      support_level: 'supports',
    })
  }

  return createdClaim
}

export async function createNetworkContactWithRole<TContact = unknown, TRole = unknown>(
  client: InsertableClient,
  userId: string,
  input: NetworkContactCreateInput
): Promise<{ contact: TContact; role: TRole }> {
  const contactInput = networkContactCreateSchema.parse(input)
  const contact = await insertSingle<{ id: string } & TContact>(client, 'network_contacts', {
    user_id: userId,
    full_name: contactInput.full_name,
    primary_email: contactInput.email,
    phone_e164: contactInput.phone_e164,
    linkedin_url: contactInput.linkedin_url,
    relationship_strength: contactInput.relationship_strength,
    notes: contactInput.notes,
    metadata: contactInput.metadata,
  })

  const role = await insertSingle<TRole>(client, 'network_contact_roles', {
    user_id: userId,
    contact_id: contact.id,
    company_name: contactInput.company_name,
    normalized_company: normalizeCompanyName(contactInput.company_name),
    role_title: contactInput.role_title,
    seniority: contactInput.seniority,
    referral_ok: contactInput.referral_ok,
    reminder_preference: contactInput.reminder_preference,
    metadata: contactInput.metadata,
  })

  return { contact, role }
}

export async function ingestKnowledgeDocument<TSource = unknown>(
  client: InsertableClient,
  userId: string,
  input: KnowledgeDocumentIngestInput,
  modelGateway: ModelGateway = createDefaultModelGateway()
): Promise<{
  evidenceSource: TSource
  chunksCreated: number
  claimsCreated: number
  entitiesCreated: number
}> {
  const sourceInput = evidenceSourceCreateSchema.parse(input)
  const evidenceSource = await insertSingle<{ id: string } & TSource>(client, 'evidence_sources', {
    user_id: userId,
    ...sourceInput,
    metadata: {
      ...sourceInput.metadata,
      ingestion_method: 'local-heuristic-v1',
    },
  })

  const chunks = chunkEvidenceText(input.raw_text)
  const createdChunks: Array<{ id: string }> = []

  for (const chunk of chunks) {
    const embedding = await modelGateway.embedText(chunk.content)
    createdChunks.push(await insertSingle(client, 'evidence_chunks', {
      user_id: userId,
      evidence_source_id: evidenceSource.id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      token_count: chunk.token_count,
      embedding: vectorToPgLiteral(embedding.vector),
      metadata: {
        semantic_terms: chunk.semantic_terms,
        embedding_model: embedding.model,
        embedding_provider: embedding.provider,
      },
    }))
  }

  const extraction = await modelGateway.extractEvidence({
    sourceType: input.source_type,
    title: input.title,
    rawText: input.raw_text,
  })
  const claims = extraction.claims.length > 0
    ? extraction.claims
    : extractDraftClaimsFromDocument(input.raw_text)
  const createdClaims: Array<{ id: string }> = []

  for (const claim of claims) {
    const embedding = await modelGateway.embedText(claim.claim)
    const createdClaim = await insertSingle<{ id: string }>(client, 'professional_claims', {
      user_id: userId,
      claim: claim.claim,
      category: claim.category,
      evidence_strength: claim.evidence_strength,
      confidence: claim.confidence,
      resume_usable: claim.resume_usable,
      best_role_archetypes: claim.best_role_archetypes,
      do_not_overclaim: claim.do_not_overclaim,
      status: 'draft',
      embedding: vectorToPgLiteral(embedding.vector),
      metadata: {
        ...claim.metadata,
        extraction_model: extraction.model,
        extraction_provider: extraction.provider,
        embedding_model: embedding.model,
        embedding_provider: embedding.provider,
      },
    })
    createdClaims.push(createdClaim)

    await insertSingle(client, 'professional_claim_evidence', {
      user_id: userId,
      claim_id: createdClaim.id,
      evidence_source_id: evidenceSource.id,
      evidence_chunk_id: bestChunkForClaim(claim, chunks, createdChunks)?.id ?? null,
      support_level: 'supports',
      notes: 'Auto-linked to the closest matching evidence chunk by document ingestion.',
    })
  }

  const entities = extraction.entities.length > 0
    ? extraction.entities
    : extractKnowledgeEntities(input.raw_text)
  const createdEntities: Array<{ id: string }> = []

  for (const entity of entities) {
    createdEntities.push(await upsertSingle(client, 'claim_entities', {
      user_id: userId,
      ...entity,
      metadata: {
        extraction_model: extraction.model,
        extraction_provider: extraction.provider,
      },
    }, 'user_id,entity_type,normalized_name'))
  }

  for (const claim of createdClaims) {
    for (const entity of createdEntities.slice(0, 8)) {
      await insertSingle(client, 'claim_relationships', {
        user_id: userId,
        claim_id: claim.id,
        entity_id: entity.id,
        relationship_type: 'mentions',
        weight: 0.6,
        metadata: {
          extraction_model: extraction.model,
          extraction_provider: extraction.provider,
        },
      })
    }
  }

  return {
    evidenceSource,
    chunksCreated: createdChunks.length,
    claimsCreated: createdClaims.length,
    entitiesCreated: createdEntities.length,
  }
}
