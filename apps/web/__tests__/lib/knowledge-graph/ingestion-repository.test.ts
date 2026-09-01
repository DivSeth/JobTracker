import { describe, expect, it, vi } from 'vitest'
import { ingestKnowledgeDocument } from '@/lib/knowledge-graph/repository'
import type { ModelGateway } from '@/lib/model-gateway/types'

function createIngestClient() {
  const inserts: Array<{ table: string; payload: any }> = []
  const results: Record<string, unknown[]> = {
    evidence_sources: [{ id: 'source-1' }],
    evidence_chunks: [{ id: 'chunk-1' }, { id: 'chunk-2' }],
    professional_claims: [{ id: 'claim-1' }, { id: 'claim-2' }],
    professional_claim_evidence: [{ id: 'link-1' }, { id: 'link-2' }],
    claim_entities: Array.from({ length: 12 }, (_, index) => ({ id: `entity-${index + 1}` })),
    claim_relationships: Array.from({ length: 24 }, (_, index) => ({ id: `rel-${index + 1}` })),
  }

  const from = vi.fn((table: string) => ({
    insert(payload: any) {
      inserts.push({ table, payload })
      return {
        select() {
          return {
            single: async () => ({ data: results[table].shift(), error: null }),
          }
        },
      }
    },
    upsert(payload: any) {
      inserts.push({ table, payload })
      return {
        select() {
          return {
            single: async () => ({ data: results[table].shift(), error: null }),
          }
        },
      }
    },
  }))

  return { client: { from }, inserts }
}

describe('ingestKnowledgeDocument', () => {
  it('stores an evidence source, chunks, inferred claims, evidence links, entities, and relationships', async () => {
    const mock = createIngestClient()

    const result = await ingestKnowledgeDocument(mock.client, 'user-1', {
      source_type: 'project_note',
      title: 'AutoApply and Siemens notes',
      raw_text: `
        Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.

        Hardened Siemens document workers with Service Bus lock renewal and duplicate-job detection.
      `,
    })

    expect(result).toEqual(expect.objectContaining({
      evidenceSource: { id: 'source-1' },
      chunksCreated: 2,
      claimsCreated: 2,
    }))
    expect(mock.inserts.map((insert) => insert.table)).toEqual(
      expect.arrayContaining([
        'evidence_sources',
        'evidence_chunks',
        'professional_claims',
        'professional_claim_evidence',
        'claim_entities',
        'claim_relationships',
      ])
    )
    expect(mock.inserts.find((insert) => insert.table === 'evidence_chunks')?.payload).toEqual(
      expect.objectContaining({
        embedding: expect.stringMatching(/^\[/),
        metadata: expect.objectContaining({ semantic_terms: expect.any(Array) }),
      })
    )
  })

  it('stores embeddings from the configured model gateway', async () => {
    const mock = createIngestClient()
    const gateway: ModelGateway = {
      embedText: vi.fn(async () => ({
        vector: Array.from({ length: 512 }, (_, index) => (index === 0 ? 1 : 0)),
        dimensions: 512,
        provider: 'gemini',
        model: 'gemini-embedding-001',
      })),
      extractEvidence: vi.fn(async () => ({
        claims: [
          {
            claim: 'Built AutoApply OS with React and Supabase.',
            category: 'full_stack',
            evidence_strength: 'medium' as const,
            confidence: 0.72,
            resume_usable: true,
            best_role_archetypes: ['full_stack'],
            do_not_overclaim: ['Keep source-grounded.'],
            metadata: { extraction_method: 'test' },
          },
        ],
        entities: [],
        provider: 'local',
        model: 'local-heuristic-v1',
      })),
    }

    await ingestKnowledgeDocument(mock.client, 'user-1', {
      source_type: 'project_note',
      title: 'AutoApply notes',
      raw_text: 'Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.',
    }, gateway)

    const chunkInsert = mock.inserts.find((insert) => insert.table === 'evidence_chunks')
    const claimInsert = mock.inserts.find((insert) => insert.table === 'professional_claims')
    expect(gateway.embedText).toHaveBeenCalled()
    expect(chunkInsert?.payload.metadata).toEqual(expect.objectContaining({
      embedding_model: 'gemini-embedding-001',
      embedding_provider: 'gemini',
    }))
    expect(claimInsert?.payload.metadata).toEqual(expect.objectContaining({
      embedding_model: 'gemini-embedding-001',
      embedding_provider: 'gemini',
    }))
  })

  it('stores extraction provenance on LLM-inferred entities and relationships', async () => {
    const mock = createIngestClient()
    const gateway: ModelGateway = {
      embedText: vi.fn(async () => ({
        vector: Array.from({ length: 512 }, (_, index) => (index === 0 ? 1 : 0)),
        dimensions: 512,
        provider: 'dashscope',
        model: 'text-embedding-v4:512',
      })),
      extractEvidence: vi.fn(async () => ({
        claims: [
          {
            claim: 'Built distributed FastAPI workers for Siemens using Azure Service Bus.',
            category: 'backend',
            evidence_strength: 'high' as const,
            confidence: 0.91,
            resume_usable: true,
            best_role_archetypes: ['backend'],
            do_not_overclaim: ['Do not add scale metrics unless present in source.'],
            metadata: { extraction_method: 'dashscope:qwen-plus' },
          },
        ],
        entities: [
          {
            entity_type: 'company' as const,
            name: 'Siemens',
            normalized_name: 'siemens',
          },
        ],
        provider: 'dashscope',
        model: 'qwen-plus',
      })),
    }

    await ingestKnowledgeDocument(mock.client, 'user-1', {
      source_type: 'work_experience_portfolio',
      title: 'Siemens portfolio',
      raw_text: 'Built distributed FastAPI workers for Siemens using Azure Service Bus.',
    }, gateway)

    const entityInsert = mock.inserts.find((insert) => insert.table === 'claim_entities')
    const relationshipInsert = mock.inserts.find((insert) => insert.table === 'claim_relationships')
    expect(entityInsert?.payload.metadata).toEqual(expect.objectContaining({
      extraction_model: 'qwen-plus',
      extraction_provider: 'dashscope',
    }))
    expect(relationshipInsert?.payload.metadata).toEqual(expect.objectContaining({
      extraction_model: 'qwen-plus',
      extraction_provider: 'dashscope',
    }))
  })

  it('upserts extracted entities by user, type, and normalized name', async () => {
    const mock = createIngestClient()
    const gateway: ModelGateway = {
      embedText: vi.fn(async () => ({
        vector: Array.from({ length: 512 }, (_, index) => (index === 0 ? 1 : 0)),
        dimensions: 512,
        provider: 'local',
        model: 'local-hash-512-v1',
      })),
      extractEvidence: vi.fn(async () => ({
        claims: [
          {
            claim: 'Built AutoApply OS with React and Supabase.',
            category: 'full_stack',
            evidence_strength: 'medium' as const,
            confidence: 0.72,
            resume_usable: true,
            best_role_archetypes: ['full_stack'],
            do_not_overclaim: [],
            metadata: {},
          },
        ],
        entities: [
          {
            entity_type: 'technology' as const,
            name: 'React',
            normalized_name: 'react',
          },
        ],
        provider: 'local',
        model: 'local-heuristic-v1',
      })),
    }

    await ingestKnowledgeDocument(mock.client, 'user-1', {
      source_type: 'project_note',
      title: 'AutoApply notes',
      raw_text: 'Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.',
    }, gateway)

    expect(mock.client.from).toHaveBeenCalledWith('claim_entities')
    const entityWrite = mock.inserts.find((insert) => insert.table === 'claim_entities')
    expect(entityWrite?.payload).toEqual(expect.objectContaining({
      user_id: 'user-1',
      entity_type: 'technology',
      normalized_name: 'react',
    }))
  })

  it('links each extracted claim to the closest matching evidence chunk', async () => {
    const mock = createIngestClient()
    const gateway: ModelGateway = {
      embedText: vi.fn(async () => ({
        vector: Array.from({ length: 512 }, (_, index) => (index === 0 ? 1 : 0)),
        dimensions: 512,
        provider: 'local',
        model: 'local-hash-512-v1',
      })),
      extractEvidence: vi.fn(async () => ({
        claims: [
          {
            claim: 'Built Service Bus lock renewal and duplicate-job detection for long-running workers.',
            category: 'backend',
            evidence_strength: 'high' as const,
            confidence: 0.9,
            resume_usable: true,
            best_role_archetypes: ['backend'],
            do_not_overclaim: [],
            metadata: {},
          },
        ],
        entities: [],
        provider: 'local',
        model: 'local-heuristic-v1',
      })),
    }

    await ingestKnowledgeDocument(mock.client, 'user-1', {
      source_type: 'work_experience_portfolio',
      title: 'Siemens portfolio',
      raw_text: [
        'Built React dashboard components for reviewing bid workflow state and acceptance feedback.',
        'Built Service Bus lock renewal and duplicate-job detection for long-running workers.',
      ].join('\n\n'),
    }, gateway)

    const evidenceLink = mock.inserts.find((insert) => insert.table === 'professional_claim_evidence')
    expect(evidenceLink?.payload.evidence_chunk_id).toBe('chunk-2')
  })
})
