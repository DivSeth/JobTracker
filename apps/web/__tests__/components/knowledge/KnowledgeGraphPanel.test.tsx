import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KnowledgeGraphPanel } from '@/components/knowledge/KnowledgeGraphPanel'

describe('KnowledgeGraphPanel', () => {
  it('renders claims, evidence, contacts, and job analyses as graph nodes', () => {
    render(
      <KnowledgeGraphPanel
        summary={{
          evidenceSources: [{ id: 'source-1', title: 'Resume 2026', source_type: 'resume' }],
          claims: [{ id: 'claim-1', claim: 'Built AutoApply OS.', category: 'full_stack' }],
          contacts: [{ id: 'contact-1', full_name: 'Avery Patel', relationship_strength: 'warm' }],
          jobAnalyses: [{ id: 'analysis-1', title: 'Full-Stack Engineer', company_name: 'Netic' }],
          openAlerts: [],
        }}
      />
    )

    expect(screen.getByText(/Knowledge Graph/i)).toBeInTheDocument()
    expect(screen.getByText(/Resume 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/Built AutoApply OS/i)).toBeInTheDocument()
    expect(screen.getByText(/Avery Patel/i)).toBeInTheDocument()
    expect(screen.getByText(/Full-Stack Engineer/i)).toBeInTheDocument()
  })
})
