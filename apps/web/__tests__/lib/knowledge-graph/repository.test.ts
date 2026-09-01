import { describe, expect, it } from 'vitest'
import {
  createEvidenceSource,
  createNetworkContactWithRole,
  createProfessionalClaim,
  normalizeCompanyName,
} from '@/lib/knowledge-graph/repository'

function createInsertClient(results: Record<string, unknown[]>) {
  const inserts: Array<{ table: string; payload: unknown }> = []

  return {
    inserts,
    client: {
      from(table: string) {
        return {
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
        }
      },
    },
  }
}

describe('normalizeCompanyName', () => {
  it('normalizes company names for matching network contacts to jobs', () => {
    expect(normalizeCompanyName('Google, Inc.')).toBe('google')
    expect(normalizeCompanyName('DV Trading LLC')).toBe('dv trading')
  })
})

describe('createEvidenceSource', () => {
  it('validates and inserts a user-owned evidence source', async () => {
    const { client, inserts } = createInsertClient({
      evidence_sources: [{ id: 'source-1', title: 'Siemens notes' }],
    })

    const created = await createEvidenceSource(client, 'user-1', {
      source_type: 'manual_note',
      title: 'Siemens notes',
      metadata: { project: 'workers' },
    })

    expect(created).toEqual({ id: 'source-1', title: 'Siemens notes' })
    expect(inserts).toEqual([
      {
        table: 'evidence_sources',
        payload: {
          user_id: 'user-1',
          source_type: 'manual_note',
          title: 'Siemens notes',
          metadata: { project: 'workers' },
        },
      },
    ])
  })
})

describe('createProfessionalClaim', () => {
  it('inserts a claim and links it to source evidence', async () => {
    const { client, inserts } = createInsertClient({
      professional_claims: [{ id: 'claim-1' }],
      professional_claim_evidence: [{ id: 'claim-evidence-1' }],
    })

    const created = await createProfessionalClaim(client, 'user-1', {
      claim: 'Built a C++ matching engine with deterministic order matching.',
      category: 'quant',
      evidence_strength: 'high',
      confidence: 0.88,
      resume_usable: true,
      best_role_archetypes: ['quant_swe'],
      do_not_overclaim: ['Do not imply production trading usage.'],
      source_evidence_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    })

    expect(created).toEqual({ id: 'claim-1' })
    expect(inserts).toEqual([
      {
        table: 'professional_claims',
        payload: {
          user_id: 'user-1',
          claim: 'Built a C++ matching engine with deterministic order matching.',
          category: 'quant',
          evidence_strength: 'high',
          confidence: 0.88,
          resume_usable: true,
          best_role_archetypes: ['quant_swe'],
          do_not_overclaim: ['Do not imply production trading usage.'],
          metadata: {},
        },
      },
      {
        table: 'professional_claim_evidence',
        payload: {
          user_id: 'user-1',
          claim_id: 'claim-1',
          evidence_source_id: '550e8400-e29b-41d4-a716-446655440000',
          support_level: 'supports',
        },
      },
    ])
  })
})

describe('createNetworkContactWithRole', () => {
  it('inserts a contact and normalized company role for referral alerts', async () => {
    const { client, inserts } = createInsertClient({
      network_contacts: [{ id: 'contact-1' }],
      network_contact_roles: [{ id: 'role-1' }],
    })

    const created = await createNetworkContactWithRole(client, 'user-1', {
      full_name: 'Avery Patel',
      company_name: 'Google, Inc.',
      role_title: 'Software Engineer',
      seniority: 'mid',
      relationship_strength: 'warm',
      email: 'avery@example.com',
      referral_ok: true,
      reminder_preference: 'before_applying',
      notes: 'Met at a campus event.',
    })

    expect(created).toEqual({ contact: { id: 'contact-1' }, role: { id: 'role-1' } })
    expect(inserts).toEqual([
      {
        table: 'network_contacts',
        payload: {
          user_id: 'user-1',
          full_name: 'Avery Patel',
          primary_email: 'avery@example.com',
          phone_e164: undefined,
          linkedin_url: undefined,
          relationship_strength: 'warm',
          notes: 'Met at a campus event.',
          metadata: {},
        },
      },
      {
        table: 'network_contact_roles',
        payload: {
          user_id: 'user-1',
          contact_id: 'contact-1',
          company_name: 'Google, Inc.',
          normalized_company: 'google',
          role_title: 'Software Engineer',
          seniority: 'mid',
          referral_ok: true,
          reminder_preference: 'before_applying',
          metadata: {},
        },
      },
    ])
  })
})
