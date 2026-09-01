import { describe, expect, it, vi } from 'vitest'
import { createJobAnalysisWithNetworkAlerts } from '@/lib/job-analysis/repository'

function createClientMock() {
  const inserts: Array<{ table: string; payload: unknown }> = []
  const roleMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'role-full-stack' }, error: null })
  const roleEq = vi.fn().mockReturnValue({ maybeSingle: roleMaybeSingle })
  const roleSelect = vi.fn().mockReturnValue({ eq: roleEq })

  const contactRoles = [
    {
      id: 'contact-role-1',
      contact_id: 'contact-1',
      company_name: 'Nooks',
      normalized_company: 'nooks',
    },
  ]
  const contactRolesEqCompany = vi.fn().mockResolvedValue({ data: contactRoles, error: null })
  const contactRolesEqUser = vi.fn().mockReturnValue({ eq: contactRolesEqCompany })
  const contactRolesSelect = vi.fn().mockReturnValue({ eq: contactRolesEqUser })

  const analysisSingle = vi.fn().mockResolvedValue({ data: { id: 'analysis-1' }, error: null })
  const analysisSelect = vi.fn().mockReturnValue({ single: analysisSingle })
  const alertSingle = vi.fn().mockResolvedValue({ data: { id: 'alert-1' }, error: null })
  const alertSelect = vi.fn().mockReturnValue({ single: alertSingle })

  const from = vi.fn((table: string) => {
    if (table === 'role_archetypes') return { select: roleSelect }
    if (table === 'network_contact_roles') return { select: contactRolesSelect }

    return {
      insert(payload: unknown) {
        inserts.push({ table, payload })
        return {
          select() {
            return table === 'network_alerts' ? { single: alertSingle } : { single: analysisSingle }
          },
        }
      },
    }
  })

  return { client: { from }, inserts, roleEq, contactRolesEqUser, contactRolesEqCompany }
}

describe('createJobAnalysisWithNetworkAlerts', () => {
  it('stores an analysis with a role archetype id and creates network alerts for company matches', async () => {
    const mock = createClientMock()

    const created = await createJobAnalysisWithNetworkAlerts(mock.client, 'user-1', {
      title: 'Software Engineer, Full Stack',
      company_name: 'Nooks',
      normalized_company: 'nooks',
      role_archetype_key: 'full_stack',
      seniority: 'mid',
      tech_stack: ['typescript', 'react', 'postgres'],
      requirements: ['2+ years building products'],
      hidden_priorities: ['product ownership'],
      strategy: {
        focus: ['full-stack product delivery'],
        suppress: ['unsupported metrics'],
        proof_points: ['Use evidence-backed claims.'],
      },
      fit_score: 0.84,
    })

    expect(created).toEqual({
      analysis: { id: 'analysis-1' },
      networkAlerts: [{ id: 'alert-1' }],
    })
    expect(mock.roleEq).toHaveBeenCalledWith('key', 'full_stack')
    expect(mock.contactRolesEqUser).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mock.contactRolesEqCompany).toHaveBeenCalledWith('normalized_company', 'nooks')
    expect(mock.inserts).toEqual([
      {
        table: 'job_analyses',
        payload: expect.objectContaining({
          user_id: 'user-1',
          role_archetype_id: 'role-full-stack',
          company_name: 'Nooks',
          normalized_company: 'nooks',
          title: 'Software Engineer, Full Stack',
        }),
      },
      {
        table: 'network_alerts',
        payload: expect.objectContaining({
          user_id: 'user-1',
          contact_id: 'contact-1',
          contact_role_id: 'contact-role-1',
          message: expect.stringContaining('Nooks'),
        }),
      },
    ])
  })
})
