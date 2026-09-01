import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IngestionVerificationPanel } from '@/components/knowledge/IngestionVerificationPanel'
import type { IngestionVerificationSource } from '@/lib/knowledge-graph/summary'

describe('IngestionVerificationPanel', () => {
  it('shows extracted claims with source chunk and entity provenance', () => {
    const sources: IngestionVerificationSource[] = [{
      id: 'source-1',
      title: 'Wispr Flow Resume',
      source_type: 'resume',
      metadata: { upload_method: 'document_upload' },
      chunks: [{
        id: 'chunk-1',
        evidence_source_id: 'source-1',
        chunk_index: 0,
        content: 'Built a real-time voice workflow at Wispr Flow using React and Supabase.',
        token_count: 14,
        metadata: { semantic_terms: ['react', 'supabase'] },
      }],
      claims: [{
        id: 'claim-1',
        claim: 'Built real-time voice workflows at Wispr Flow.',
        category: 'full_stack',
        evidence_strength: 'high',
        confidence: 0.91,
        status: 'draft',
        support_level: 'supports',
        source_chunk: {
          id: 'chunk-1',
          evidence_source_id: 'source-1',
          chunk_index: 0,
          content: 'Built a real-time voice workflow at Wispr Flow using React and Supabase.',
          token_count: 14,
          metadata: { semantic_terms: ['react', 'supabase'] },
        },
        entities: [{
          id: 'entity-1',
          entity_type: 'technology',
          name: 'React',
          normalized_name: 'react',
        }],
        do_not_overclaim: ['Do not claim production scale unless sourced.'],
        metadata: { extraction_provider: 'dashscope', extraction_model: 'qwen-plus' },
      }],
    }]

    render(<IngestionVerificationPanel sources={sources} />)
    fireEvent.click(screen.getByRole('button', { name: /show details for wispr flow resume/i }))

    expect(screen.getByRole('heading', { name: /ingestion verification/i })).toBeInTheDocument()
    expect(screen.getByText(/Wispr Flow Resume/i)).toBeInTheDocument()
    expect(screen.getByText(/Built real-time voice workflows/i)).toBeInTheDocument()
    expect(screen.getByText(/source chunk 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Built a real-time voice workflow/i)).toBeInTheDocument()
    expect(screen.getAllByText(/React/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/91%/i)).toBeInTheDocument()
    expect(screen.getByText(/Do not claim production scale/i)).toBeInTheDocument()
  })

  it('keeps source details collapsed until the user expands them', async () => {
    const sources: IngestionVerificationSource[] = [{
      id: 'source-1',
      title: 'Collapsed Portfolio',
      source_type: 'work_experience_portfolio',
      metadata: {},
      chunks: [],
      claims: [{
        id: 'claim-1',
        claim: 'Built collapsible verification history.',
        category: 'frontend',
        evidence_strength: 'high',
        confidence: 0.9,
        status: 'draft',
        support_level: 'supports',
        source_chunk: null,
        entities: [],
        do_not_overclaim: [],
        metadata: {},
      }],
    }]

    render(<IngestionVerificationPanel sources={sources} />)

    expect(screen.getByText('Collapsed Portfolio')).toBeInTheDocument()
    expect(screen.queryByText('Built collapsible verification history.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show details for collapsed portfolio/i }))

    expect(screen.getByText('Built collapsible verification history.')).toBeInTheDocument()
  })

  it('caps expanded claim provenance cards to the 10 most recent links', async () => {
    const claims = Array.from({ length: 12 }, (_, index) => ({
      id: `claim-${index + 1}`,
      claim: `Claim ${index + 1}`,
      category: 'backend',
      evidence_strength: 'high' as const,
      confidence: 0.9,
      status: 'draft',
      support_level: 'supports',
      source_chunk: {
        id: `chunk-${index + 1}`,
        evidence_source_id: 'source-1',
        chunk_index: index,
        content: `Source chunk ${index + 1} content`,
        token_count: 4,
        metadata: {},
      },
      entities: [],
      do_not_overclaim: [],
      metadata: {},
    }))

    const sources: IngestionVerificationSource[] = [{
      id: 'source-1',
      title: 'Large Portfolio',
      source_type: 'work_experience_portfolio',
      metadata: {},
      chunks: [],
      claims,
    }]

    render(<IngestionVerificationPanel sources={sources} />)
    fireEvent.click(screen.getByRole('button', { name: /show details for large portfolio/i }))

    expect(screen.getByText(/showing 10 of 12 extracted claim links/i)).toBeInTheDocument()
    expect(screen.getByText('Claim 1')).toBeInTheDocument()
    expect(screen.getByText('Claim 10')).toBeInTheDocument()
    expect(screen.queryByText('Claim 11')).not.toBeInTheDocument()
    expect(screen.queryByText('Claim 12')).not.toBeInTheDocument()
  })
})
