import { describe, expect, it } from 'vitest'
import {
  chunkEvidenceText,
  extractDraftClaimsFromDocument,
  extractKnowledgeEntities,
  localTextEmbedding512,
} from '@/lib/knowledge-graph/ingest'

describe('chunkEvidenceText', () => {
  it('splits long source text into indexed chunks', () => {
    const chunks = chunkEvidenceText([
      'Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.',
      'Hardened Siemens document workers with Service Bus lock renewal and duplicate-job detection.',
    ].join('\n\n'))

    expect(chunks).toEqual([
      expect.objectContaining({ chunk_index: 0, content: expect.stringContaining('AutoApply OS') }),
      expect.objectContaining({ chunk_index: 1, content: expect.stringContaining('Siemens') }),
    ])
  })
})

describe('localTextEmbedding512', () => {
  it('creates a stable 512-dim local embedding vector scaffold', () => {
    const first = localTextEmbedding512('React Supabase full-stack product workflows')
    const second = localTextEmbedding512('React Supabase full-stack product workflows')

    expect(first).toHaveLength(512)
    expect(first).toEqual(second)
    expect(first.some((value) => value !== 0)).toBe(true)
  })
})

describe('extractDraftClaimsFromDocument', () => {
  it('infers draft resume-usable claims with categories and overclaim rules', () => {
    const claims = extractDraftClaimsFromDocument(`
      Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows.
      Hardened Siemens document workers with Service Bus lock renewal and duplicate-job detection.
      Implemented a C++ matching engine for deterministic order matching.
    `)

    expect(claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claim: expect.stringContaining('Built AutoApply OS'),
          category: 'full_stack',
          evidence_strength: 'medium',
          resume_usable: true,
        }),
        expect.objectContaining({
          claim: expect.stringContaining('Hardened Siemens'),
          category: 'backend',
        }),
        expect.objectContaining({
          claim: expect.stringContaining('C++ matching engine'),
          category: 'quant',
        }),
      ])
    )
    expect(claims[0].do_not_overclaim.length).toBeGreaterThan(0)
  })
})

describe('extractKnowledgeEntities', () => {
  it('extracts companies, projects, and technologies for graph display', () => {
    const entities = extractKnowledgeEntities(`
      Built AutoApply OS with React, Next.js, Supabase, and browser extension workflows at Siemens.
    `)

    expect(entities).toEqual(
      expect.arrayContaining([
        { entity_type: 'project', name: 'AutoApply OS', normalized_name: 'autoapply os' },
        { entity_type: 'company', name: 'Siemens', normalized_name: 'siemens' },
        { entity_type: 'technology', name: 'React', normalized_name: 'react' },
        { entity_type: 'technology', name: 'Supabase', normalized_name: 'supabase' },
      ])
    )
  })
})
