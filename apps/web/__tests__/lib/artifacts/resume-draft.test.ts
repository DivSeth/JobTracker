import { describe, expect, it } from 'vitest'
import { buildResumeDraftTex } from '@/lib/artifacts/resume-draft'

describe('buildResumeDraftTex', () => {
  it('builds a reviewable LaTeX draft from strategy focus and selected claims', () => {
    const draft = buildResumeDraftTex({
      jobAnalysisId: 'analysis-1',
      title: 'Software Engineer, Full Stack',
      companyName: 'Nooks',
      roleArchetypeKey: 'full_stack',
      headline: 'Full-stack product delivery for Nooks',
      fitScore: 0.84,
      focus: ['full-stack product delivery', 'customer-facing execution'],
      selectedClaims: [
        {
          id: 'claim-1',
          claim: 'Built AutoApply OS full-stack workflows with React and Supabase.',
          category: 'full_stack',
          evidenceStrength: 'high',
          confidence: 0.92,
          status: 'approved',
          matchReasons: ['category matches full_stack'],
          doNotOverclaim: ['Do not imply enterprise-scale usage.'],
        },
      ],
      overclaimRules: ['Do not imply enterprise-scale usage.'],
      networkingAlerts: [],
      nextSteps: [],
    })

    expect(draft).toContain('% AutoApply generated resume draft')
    expect(draft).toContain('\\section*{Target Role}')
    expect(draft).toContain('Full-stack product delivery for Nooks')
    expect(draft).toContain('\\item Built AutoApply OS full-stack workflows')
    expect(draft).toContain('% Overclaim guardrails')
    expect(draft).toContain('Do not imply enterprise-scale usage.')
  })
})
