import { describe, expect, it, vi } from 'vitest'
import { loadLatestResumeStrategyPreview } from '@/lib/resume-strategy/repository'

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

describe('loadLatestResumeStrategyPreview', () => {
  it('loads the newest job analysis, claims, and open alerts for that job', async () => {
    const mock = createSelectClient({
      job_analyses: [
        {
          id: 'analysis-1',
          title: 'Software Engineer, Full Stack',
          company_name: 'Nooks',
          normalized_company: 'nooks',
          tech_stack: ['typescript', 'react'],
          hidden_priorities: ['product ownership'],
          strategy: { role_archetype_key: 'full_stack', focus: ['full-stack product delivery'] },
          fit_score: 0.84,
        },
      ],
      professional_claims: [
        {
          id: 'claim-1',
          claim: 'Built full-stack application workflows.',
          category: 'full_stack',
          evidence_strength: 'high',
          confidence: 0.9,
          resume_usable: true,
          best_role_archetypes: ['full_stack'],
          do_not_overclaim: ['Do not imply large team leadership.'],
          status: 'approved',
        },
      ],
      network_alerts: [
        { id: 'alert-1', message: 'Message Avery before applying.', status: 'open' },
      ],
    })

    const preview = await loadLatestResumeStrategyPreview(mock.client, 'user-1')

    expect(preview?.headline).toBe('Full-stack product delivery for Nooks')
    expect(preview?.selectedClaims[0].id).toBe('claim-1')
    expect(preview?.networkingAlerts).toEqual([{ id: 'alert-1', message: 'Message Avery before applying.' }])
    expect(mock.calls).toEqual(
      expect.arrayContaining([
        { table: 'job_analyses', op: 'eq', args: ['user_id', 'user-1'] },
        { table: 'professional_claims', op: 'eq', args: ['user_id', 'user-1'] },
        { table: 'network_alerts', op: 'eq', args: ['status', 'open'] },
        { table: 'network_alerts', op: 'eq', args: ['job_analysis_id', 'analysis-1'] },
      ])
    )
  })

  it('returns null when there are no saved job analyses yet', async () => {
    const mock = createSelectClient({
      job_analyses: [],
    })

    await expect(loadLatestResumeStrategyPreview(mock.client, 'user-1')).resolves.toBeNull()
  })
})
