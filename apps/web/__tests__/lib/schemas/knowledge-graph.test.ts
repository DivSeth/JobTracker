import { describe, expect, it } from 'vitest'
import {
  evidenceChunkCreateSchema,
  evidenceSourceCreateSchema,
  networkContactCreateSchema,
  professionalClaimCreateSchema,
} from '@/lib/schemas/knowledge-graph'

describe('evidenceSourceCreateSchema', () => {
  it('accepts a manual evidence source with optional metadata', () => {
    const parsed = evidenceSourceCreateSchema.parse({
      source_type: 'manual_note',
      title: 'Siemens worker notes',
      source_date: '2026-01-15',
      metadata: { project: 'doc generation' },
    })

    expect(parsed.source_type).toBe('manual_note')
    expect(parsed.metadata).toEqual({ project: 'doc generation' })
  })

  it('accepts a work-experience portfolio evidence source', () => {
    const parsed = evidenceSourceCreateSchema.parse({
      source_type: 'work_experience_portfolio',
      title: 'Siemens distributed systems portfolio',
      raw_text: 'Built distributed worker infrastructure and documented the architecture.',
    })

    expect(parsed.source_type).toBe('work_experience_portfolio')
  })

  it('rejects an evidence source without a title', () => {
    expect(() =>
      evidenceSourceCreateSchema.parse({
        source_type: 'resume',
        title: '',
      })
    ).toThrow()
  })
})

describe('evidenceChunkCreateSchema', () => {
  it('requires chunk text and position', () => {
    const parsed = evidenceChunkCreateSchema.parse({
      evidence_source_id: '550e8400-e29b-41d4-a716-446655440000',
      chunk_index: 0,
      content: 'Hardened asynchronous document-generation workers.',
    })

    expect(parsed.chunk_index).toBe(0)
  })

  it('rejects negative chunk indexes', () => {
    expect(() =>
      evidenceChunkCreateSchema.parse({
        evidence_source_id: '550e8400-e29b-41d4-a716-446655440000',
        chunk_index: -1,
        content: 'Invalid chunk.',
      })
    ).toThrow()
  })
})

describe('professionalClaimCreateSchema', () => {
  const validClaim = {
    claim: 'Hardened asynchronous document-generation workers with Service Bus lock renewal.',
    category: 'backend',
    evidence_strength: 'high',
    confidence: 0.9,
    resume_usable: true,
    best_role_archetypes: ['backend', 'platform'],
    do_not_overclaim: ['Do not imply Kubernetes unless evidence exists.'],
    source_evidence_ids: ['550e8400-e29b-41d4-a716-446655440000'],
  }

  it('accepts an evidence-backed professional claim', () => {
    const parsed = professionalClaimCreateSchema.parse(validClaim)

    expect(parsed.best_role_archetypes).toContain('backend')
    expect(parsed.do_not_overclaim).toHaveLength(1)
  })

  it('rejects claims without evidence links', () => {
    expect(() =>
      professionalClaimCreateSchema.parse({
        ...validClaim,
        source_evidence_ids: [],
      })
    ).toThrow()
  })

  it('rejects confidence outside 0 to 1', () => {
    expect(() =>
      professionalClaimCreateSchema.parse({
        ...validClaim,
        confidence: 1.2,
      })
    ).toThrow()
  })
})

describe('networkContactCreateSchema', () => {
  it('accepts a contact with company role and outreach metadata', () => {
    const parsed = networkContactCreateSchema.parse({
      full_name: 'Avery Patel',
      company_name: 'Google',
      role_title: 'Software Engineer',
      seniority: 'mid',
      relationship_strength: 'warm',
      email: 'avery@example.com',
      phone_e164: '+14155551234',
      referral_ok: true,
      reminder_preference: 'before_applying',
      notes: 'Met at a campus event.',
    })

    expect(parsed.company_name).toBe('Google')
    expect(parsed.reminder_preference).toBe('before_applying')
  })

  it('requires at least one contact method or relationship note', () => {
    expect(() =>
      networkContactCreateSchema.parse({
        full_name: 'Avery Patel',
        company_name: 'Google',
        role_title: 'Software Engineer',
      })
    ).toThrow()
  })
})
