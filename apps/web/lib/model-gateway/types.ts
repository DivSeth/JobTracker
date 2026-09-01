import type { DraftClaim, DraftEntity, IngestSourceType } from '@/lib/knowledge-graph/ingest'

export interface EmbeddingResult {
  vector: number[]
  dimensions: number
  provider: string
  model: string
}

export interface EvidenceExtractionInput {
  sourceType: IngestSourceType
  title: string
  rawText: string
}

export interface EvidenceExtractionResult {
  claims: DraftClaim[]
  entities: DraftEntity[]
  provider: string
  model: string
}

export interface ModelGateway {
  embedText(text: string): Promise<EmbeddingResult>
  extractEvidence(input: EvidenceExtractionInput): Promise<EvidenceExtractionResult>
}
