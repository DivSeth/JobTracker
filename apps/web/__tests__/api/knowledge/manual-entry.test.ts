import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import { POST as postClaim } from '@/app/api/knowledge/claims/route'
import { POST as postEvidence } from '@/app/api/knowledge/evidence/route'
import { POST as postNetworkContact } from '@/app/api/network/contacts/route'

function createSupabaseInsertMock(options: {
  user?: { id: string } | null
  results?: Record<string, unknown[]>
}) {
  const user = options.user === undefined ? { id: 'user-1' } : options.user
  const inserts: Array<{ table: string; payload: unknown }> = []
  const results = options.results ?? {}

  const from = vi.fn((table: string) => ({
    insert(payload: unknown) {
      inserts.push({ table, payload })

      return {
        select() {
          return {
            single: async () => {
              const tableResults = results[table] ?? []
              const data = tableResults.shift()

              if (!data) {
                return { data: null, error: { message: `No mock result for ${table}` } }
              }

              return { data, error: null }
            },
          }
        },
      }
    },
  }))

  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: user ?? null }, error: null }),
    },
    from,
  })

  return { inserts, from }
}

describe('POST /api/knowledge/evidence', () => {
  beforeEach(() => {
    createClient.mockReset()
  })

  it('creates a manual evidence source for the authenticated user', async () => {
    const mock = createSupabaseInsertMock({
      results: { evidence_sources: [{ id: 'source-1', title: 'Siemens notes' }] },
    })

    const response = await postEvidence(
      new Request('http://localhost/api/knowledge/evidence', {
        method: 'POST',
        body: JSON.stringify({
          source_type: 'manual_note',
          title: 'Siemens notes',
          metadata: { project: 'workers' },
        }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: 'source-1', title: 'Siemens notes' })
    expect(mock.inserts[0]).toEqual({
      table: 'evidence_sources',
      payload: expect.objectContaining({ user_id: 'user-1', title: 'Siemens notes' }),
    })
  })

  it('returns 401 when creating evidence without a user', async () => {
    createSupabaseInsertMock({ user: null })

    const response = await postEvidence(
      new Request('http://localhost/api/knowledge/evidence', {
        method: 'POST',
        body: JSON.stringify({ source_type: 'manual_note', title: 'Siemens notes' }),
      })
    )

    expect(response.status).toBe(401)
  })
})

describe('POST /api/knowledge/claims', () => {
  beforeEach(() => {
    createClient.mockReset()
  })

  it('creates a claim and its evidence link', async () => {
    const mock = createSupabaseInsertMock({
      results: {
        professional_claims: [{ id: 'claim-1' }],
        professional_claim_evidence: [{ id: 'claim-evidence-1' }],
      },
    })

    const response = await postClaim(
      new Request('http://localhost/api/knowledge/claims', {
        method: 'POST',
        body: JSON.stringify({
          claim: 'Built a C++ matching engine with deterministic order matching.',
          category: 'quant',
          evidence_strength: 'high',
          confidence: 0.88,
          resume_usable: true,
          best_role_archetypes: ['quant_swe'],
          do_not_overclaim: ['Do not imply production trading usage.'],
          source_evidence_ids: ['550e8400-e29b-41d4-a716-446655440000'],
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(mock.inserts.map((insert) => insert.table)).toEqual([
      'professional_claims',
      'professional_claim_evidence',
    ])
  })

  it('returns 400 for unsupported claims without evidence', async () => {
    createSupabaseInsertMock({})

    const response = await postClaim(
      new Request('http://localhost/api/knowledge/claims', {
        method: 'POST',
        body: JSON.stringify({
          claim: 'Unsupported claim',
          category: 'backend',
          evidence_strength: 'high',
          confidence: 0.9,
          source_evidence_ids: [],
        }),
      })
    )

    expect(response.status).toBe(400)
  })
})

describe('POST /api/network/contacts', () => {
  beforeEach(() => {
    createClient.mockReset()
  })

  it('creates a networking contact and normalized company role', async () => {
    const mock = createSupabaseInsertMock({
      results: {
        network_contacts: [{ id: 'contact-1' }],
        network_contact_roles: [{ id: 'role-1' }],
      },
    })

    const response = await postNetworkContact(
      new Request('http://localhost/api/network/contacts', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Avery Patel',
          company_name: 'Google, Inc.',
          role_title: 'Software Engineer',
          seniority: 'mid',
          relationship_strength: 'warm',
          email: 'avery@example.com',
          referral_ok: true,
          reminder_preference: 'before_applying',
          notes: 'Met at a campus event.',
        }),
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      contact: { id: 'contact-1' },
      role: { id: 'role-1' },
    })
    expect(mock.inserts[1]).toEqual({
      table: 'network_contact_roles',
      payload: expect.objectContaining({ normalized_company: 'google' }),
    })
  })
})
