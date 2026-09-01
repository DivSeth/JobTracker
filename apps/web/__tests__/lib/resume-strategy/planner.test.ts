import { describe, expect, it } from 'vitest'
import { buildResumeStrategyPreview, rankClaimsForJobAnalysis } from '@/lib/resume-strategy/planner'

const jobAnalysis = {
  id: 'analysis-1',
  title: 'Software Engineer, Full Stack',
  company_name: 'Nooks',
  normalized_company: 'nooks',
  role_archetype_key: 'full_stack',
  tech_stack: ['typescript', 'react', 'postgres'],
  hidden_priorities: ['product ownership'],
  strategy: {
    focus: ['full-stack product delivery', 'customer-facing execution'],
  },
  fit_score: 0.84,
}

const claims = [
  {
    id: 'claim-full-stack',
    claim: 'Built AutoApply OS full-stack workflows with React, Next.js, and Supabase.',
    category: 'full_stack',
    evidence_strength: 'high',
    confidence: 0.92,
    resume_usable: true,
    best_role_archetypes: ['full_stack', 'product_engineer'],
    do_not_overclaim: ['Do not imply enterprise-scale usage.'],
    status: 'approved',
  },
  {
    id: 'claim-backend',
    claim: 'Hardened async workers with duplicate-job detection and retry handling.',
    category: 'backend',
    evidence_strength: 'high',
    confidence: 0.88,
    resume_usable: true,
    best_role_archetypes: ['backend', 'full_stack'],
    do_not_overclaim: ['Do not imply Kubernetes experience.'],
    status: 'draft',
  },
  {
    id: 'claim-quant',
    claim: 'Built a C++ matching engine.',
    category: 'quant',
    evidence_strength: 'high',
    confidence: 0.9,
    resume_usable: true,
    best_role_archetypes: ['quant_swe'],
    do_not_overclaim: [],
    status: 'approved',
  },
  {
    id: 'claim-rejected',
    claim: 'Unsupported production metric.',
    category: 'full_stack',
    evidence_strength: 'high',
    confidence: 0.95,
    resume_usable: true,
    best_role_archetypes: ['full_stack'],
    do_not_overclaim: [],
    status: 'rejected',
  },
  {
    id: 'claim-not-usable',
    claim: 'Personal-only note that should not go on a resume.',
    category: 'product',
    evidence_strength: 'high',
    confidence: 0.95,
    resume_usable: false,
    best_role_archetypes: ['full_stack'],
    do_not_overclaim: [],
    status: 'approved',
  },
]

describe('rankClaimsForJobAnalysis', () => {
  it('prioritizes usable role-relevant claims and excludes rejected or non-resume claims', () => {
    const ranked = rankClaimsForJobAnalysis(jobAnalysis, claims)

    expect(ranked.map((claim) => claim.id)).toEqual([
      'claim-full-stack',
      'claim-backend',
      'claim-quant',
    ])
    expect(ranked[0]).toEqual(
      expect.objectContaining({
        claim: expect.stringContaining('AutoApply OS'),
        matchReasons: expect.arrayContaining(['category matches full_stack']),
      })
    )
  })
})

describe('buildResumeStrategyPreview', () => {
  it('summarizes focus, selected claims, overclaim rules, and networking alerts', () => {
    const preview = buildResumeStrategyPreview(jobAnalysis, claims, [
      { id: 'alert-1', message: 'Avery Patel works at Nooks. Message them before applying.', status: 'open' },
    ])

    expect(preview).toEqual(
      expect.objectContaining({
        jobAnalysisId: 'analysis-1',
        roleArchetypeKey: 'full_stack',
        headline: 'Full-stack product delivery for Nooks',
        focus: ['full-stack product delivery', 'customer-facing execution'],
      })
    )
    expect(preview.selectedClaims.map((claim) => claim.id)).toContain('claim-full-stack')
    expect(preview.overclaimRules).toEqual(
      expect.arrayContaining(['Do not imply enterprise-scale usage.', 'Do not imply Kubernetes experience.'])
    )
    expect(preview.networkingAlerts).toEqual([
      {
        id: 'alert-1',
        message: 'Avery Patel works at Nooks. Message them before applying.',
      },
    ])
  })
})
