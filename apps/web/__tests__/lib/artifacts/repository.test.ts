import { describe, expect, it, vi } from 'vitest'

const { loadLatestResumeStrategyPreview } = vi.hoisted(() => ({
  loadLatestResumeStrategyPreview: vi.fn(),
}))

vi.mock('@/lib/resume-strategy/repository', () => ({
  loadLatestResumeStrategyPreview,
}))

import { createLatestResumeDraftArtifact } from '@/lib/artifacts/repository'

function createInsertClient() {
  const inserts: Array<{ table: string; payload: unknown }> = []
  const from = vi.fn((table: string) => ({
    insert(payload: unknown) {
      inserts.push({ table, payload })
      return {
        select() {
          return {
            single: async () => ({ data: { id: 'artifact-1' }, error: null }),
          }
        },
      }
    },
  }))

  return { client: { from }, inserts }
}

describe('createLatestResumeDraftArtifact', () => {
  it('creates a resume_tex artifact from the latest strategy preview', async () => {
    loadLatestResumeStrategyPreview.mockResolvedValue({
      jobAnalysisId: 'analysis-1',
      title: 'Software Engineer, Full Stack',
      companyName: 'Nooks',
      roleArchetypeKey: 'full_stack',
      headline: 'Full-stack product delivery for Nooks',
      fitScore: 0.84,
      focus: ['full-stack product delivery'],
      selectedClaims: [
        {
          id: 'claim-1',
          claim: 'Built AutoApply OS full-stack workflows.',
          category: 'full_stack',
          evidenceStrength: 'high',
          confidence: 0.9,
          status: 'approved',
          matchReasons: ['category matches full_stack'],
          doNotOverclaim: ['Do not imply enterprise-scale usage.'],
        },
      ],
      overclaimRules: ['Do not imply enterprise-scale usage.'],
      networkingAlerts: [],
      nextSteps: [],
    })
    const mock = createInsertClient()

    const artifact = await createLatestResumeDraftArtifact(mock.client, 'user-1')

    expect(artifact).toEqual({ id: 'artifact-1' })
    expect(mock.inserts).toEqual([
      {
        table: 'generated_artifacts',
        payload: expect.objectContaining({
          user_id: 'user-1',
          job_analysis_id: 'analysis-1',
          artifact_type: 'resume_tex',
          status: 'draft',
          content: expect.stringContaining('Built AutoApply OS'),
          metadata: expect.objectContaining({
            selected_claim_ids: ['claim-1'],
            generator: 'deterministic-resume-draft-v1',
          }),
        }),
      },
    ])
  })

  it('blocks artifact creation when there is no analyzed job yet', async () => {
    loadLatestResumeStrategyPreview.mockResolvedValue(null)
    const mock = createInsertClient()

    await expect(createLatestResumeDraftArtifact(mock.client, 'user-1')).rejects.toThrow(
      'Analyze a job before creating a resume draft'
    )
    expect(mock.inserts).toEqual([])
  })
})
