import { describe, expect, it, vi } from 'vitest'
import { loadIngestionVerification, loadKnowledgeSummary, loadOpenNetworkAlerts } from '@/lib/knowledge-graph/summary'

function createSelectClient(results: Record<string, unknown[]>) {
  const calls: Array<{ table: string; op: string; args: unknown[] }> = []

  const chainFor = (table: string) => {
    const chain = {
      select: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'select', args })
        return chain
      }),
      eq: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'eq', args })
        return chain
      }),
      in: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'in', args })
        return chain
      }),
      order: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'order', args })
        return chain
      }),
      limit: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: 'limit', args })
        return { data: results[table] ?? [], error: null }
      }),
    }

    return chain
  }

  return {
    calls,
    client: {
      from(table: string) {
        return chainFor(table)
      },
    },
  }
}

describe('loadKnowledgeSummary', () => {
  it('loads recent knowledge records for the current user', async () => {
    const mock = createSelectClient({
      evidence_sources: [{ id: 'source-1', title: 'AutoApply notes', source_type: 'manual_note' }],
      professional_claims: [{ id: 'claim-1', claim: 'Built product workflows.', category: 'full_stack' }],
      network_contacts: [{ id: 'contact-1', full_name: 'Avery Patel', relationship_strength: 'warm' }],
      job_analyses: [{ id: 'analysis-1', title: 'Software Engineer', company_name: 'Nooks' }],
      network_alerts: [{ id: 'alert-1', message: 'Message Avery', status: 'open' }],
    })

    const summary = await loadKnowledgeSummary(mock.client, 'user-1')

    expect(summary.evidenceSources).toHaveLength(1)
    expect(summary.claims).toHaveLength(1)
    expect(summary.contacts).toHaveLength(1)
    expect(summary.jobAnalyses).toHaveLength(1)
    expect(summary.openAlerts).toHaveLength(1)
    expect(mock.calls).toEqual(
      expect.arrayContaining([
        { table: 'evidence_sources', op: 'eq', args: ['user_id', 'user-1'] },
        { table: 'network_alerts', op: 'eq', args: ['status', 'open'] },
      ])
    )
  })
})

describe('loadIngestionVerification', () => {
  it('loads recent sources with supporting chunks, extracted claims, and linked entities', async () => {
    const mock = createSelectClient({
      evidence_sources: [{
        id: 'source-1',
        title: 'Wispr Flow Resume',
        source_type: 'resume',
        metadata: { extraction_provider: 'dashscope' },
      }],
      evidence_chunks: [{
        id: 'chunk-1',
        evidence_source_id: 'source-1',
        chunk_index: 0,
        content: 'Built a real-time voice workflow at Wispr Flow using React and Supabase.',
        token_count: 14,
        metadata: { semantic_terms: ['react', 'supabase'] },
      }],
      professional_claim_evidence: [{
        evidence_source_id: 'source-1',
        evidence_chunk_id: 'chunk-1',
        support_level: 'supports',
        professional_claims: {
          id: 'claim-1',
          claim: 'Built real-time voice workflows at Wispr Flow.',
          category: 'full_stack',
          evidence_strength: 'high',
          confidence: 0.91,
          status: 'draft',
          do_not_overclaim: ['Do not claim production scale unless sourced.'],
          metadata: { extraction_provider: 'dashscope', extraction_model: 'qwen-plus' },
        },
      }],
      claim_relationships: [{
        claim_id: 'claim-1',
        claim_entities: {
          id: 'entity-1',
          entity_type: 'technology',
          name: 'React',
          normalized_name: 'react',
        },
      }],
    })

    const verification = await loadIngestionVerification(mock.client, 'user-1')

    expect(verification).toEqual([{
      id: 'source-1',
      title: 'Wispr Flow Resume',
      source_type: 'resume',
      metadata: { extraction_provider: 'dashscope' },
      chunks: [{
        id: 'chunk-1',
        evidence_source_id: 'source-1',
        chunk_index: 0,
        content: 'Built a real-time voice workflow at Wispr Flow using React and Supabase.',
        token_count: 14,
        metadata: { semantic_terms: ['react', 'supabase'] },
      }],
      claims: [{
        id: 'claim-1',
        claim: 'Built real-time voice workflows at Wispr Flow.',
        category: 'full_stack',
        evidence_strength: 'high',
        confidence: 0.91,
        status: 'draft',
        support_level: 'supports',
        source_chunk: expect.objectContaining({ id: 'chunk-1' }),
        entities: [expect.objectContaining({ name: 'React' })],
        do_not_overclaim: ['Do not claim production scale unless sourced.'],
        metadata: { extraction_provider: 'dashscope', extraction_model: 'qwen-plus' },
      }],
    }])
    expect(mock.calls).toEqual(expect.arrayContaining([
      { table: 'evidence_chunks', op: 'in', args: ['evidence_source_id', ['source-1']] },
      { table: 'professional_claim_evidence', op: 'in', args: ['evidence_source_id', ['source-1']] },
      { table: 'claim_relationships', op: 'in', args: ['claim_id', ['claim-1']] },
    ]))
  })
})

describe('loadOpenNetworkAlerts', () => {
  it('loads only open alerts for the top notification bell', async () => {
    const mock = createSelectClient({
      network_alerts: [{ id: 'alert-1', message: 'Message Avery', status: 'open' }],
    })

    const alerts = await loadOpenNetworkAlerts(mock.client, 'user-1')

    expect(alerts).toEqual([{ id: 'alert-1', message: 'Message Avery', status: 'open' }])
    expect(mock.calls).toEqual(
      expect.arrayContaining([
        { table: 'network_alerts', op: 'eq', args: ['user_id', 'user-1'] },
        { table: 'network_alerts', op: 'eq', args: ['status', 'open'] },
      ])
    )
  })
})
