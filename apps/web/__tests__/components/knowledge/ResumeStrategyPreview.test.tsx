import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResumeStrategyPreview } from '@/components/knowledge/ResumeStrategyPreview'

describe('ResumeStrategyPreview', () => {
  it('renders the latest job strategy, evidence-backed claims, overclaim rules, and networking alerts', () => {
    render(
      <ResumeStrategyPreview
        preview={{
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
              claim: 'Built AutoApply OS full-stack workflows.',
              category: 'full_stack',
              evidenceStrength: 'high',
              confidence: 0.92,
              status: 'approved',
              matchReasons: ['category matches full_stack'],
              doNotOverclaim: ['Do not imply enterprise-scale usage.'],
            },
          ],
          overclaimRules: ['Do not imply enterprise-scale usage.'],
          networkingAlerts: [{ id: 'alert-1', message: 'Message Avery before applying.' }],
          nextSteps: ['Review evidence links before generating artifacts.'],
        }}
      />
    )

    expect(screen.getByText(/Resume Strategy Preview/i)).toBeInTheDocument()
    expect(screen.getByText(/Full-stack product delivery for Nooks/i)).toBeInTheDocument()
    expect(screen.getByText(/Built AutoApply OS/i)).toBeInTheDocument()
    expect(screen.getByText(/Do not imply enterprise-scale usage/i)).toBeInTheDocument()
    expect(screen.getByText(/Message Avery/i)).toBeInTheDocument()
  })

  it('renders an empty state when no job analysis exists', () => {
    render(<ResumeStrategyPreview preview={null} />)

    expect(screen.getByText(/Analyze a job to preview resume strategy/i)).toBeInTheDocument()
  })
})
