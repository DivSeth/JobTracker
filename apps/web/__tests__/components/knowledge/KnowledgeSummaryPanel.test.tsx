import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KnowledgeSummaryPanel } from '@/components/knowledge/KnowledgeSummaryPanel'

describe('KnowledgeSummaryPanel', () => {
  it('renders saved knowledge data and open alerts', () => {
    render(
      <KnowledgeSummaryPanel
        summary={{
          evidenceSources: [{ id: 'source-1', title: 'AutoApply notes', source_type: 'manual_note' }],
          claims: [{ id: 'claim-1', claim: 'Built product workflows.', category: 'full_stack' }],
          contacts: [{ id: 'contact-1', full_name: 'Avery Patel', relationship_strength: 'warm' }],
          jobAnalyses: [{ id: 'analysis-1', title: 'Software Engineer', company_name: 'Nooks' }],
          openAlerts: [{ id: 'alert-1', message: 'Message Avery before applying.', status: 'open' }],
        }}
      />
    )

    expect(screen.getByText(/recent evidence/i)).toBeInTheDocument()
    expect(screen.getByText(/AutoApply notes/i)).toBeInTheDocument()
    expect(screen.getByText(/Built product workflows/i)).toBeInTheDocument()
    expect(screen.getByText(/Avery Patel/i)).toBeInTheDocument()
    expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument()
    expect(screen.getByText(/Message Avery/i)).toBeInTheDocument()
  })
})
