import type {
  EvidenceSourceCreateInput,
  evidenceSourceTypeSchema,
} from '@/lib/schemas/knowledge-graph'
import { normalizeCompanyName } from '@/lib/knowledge-graph/repository'
import type { z } from 'zod'

export type IngestSourceType = z.infer<typeof evidenceSourceTypeSchema>

export interface KnowledgeDocumentIngestInput extends EvidenceSourceCreateInput {
  source_type: IngestSourceType
  title: string
  raw_text: string
}

export interface DraftEvidenceChunk {
  chunk_index: number
  content: string
  token_count: number
  semantic_terms: string[]
  embedding: number[]
}

export interface DraftClaim {
  claim: string
  category: string
  evidence_strength: 'low' | 'medium' | 'high'
  confidence: number
  resume_usable: boolean
  best_role_archetypes: string[]
  do_not_overclaim: string[]
  metadata: Record<string, unknown>
}

export interface DraftEntity {
  entity_type: 'company' | 'project' | 'technology' | 'skill' | 'domain'
  name: string
  normalized_name: string
}

const TECHNOLOGIES = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Supabase',
  'Postgres',
  'Python',
  'C++',
  'Service Bus',
  'Azure',
  'AWS',
  'LLM',
  'RAG',
  'embeddings',
  'browser extension',
]

const COMPANIES = ['Siemens', 'Deloitte', 'NIC', 'Netic', 'Google', 'Apple', 'Samsara', 'Nooks']
const PROJECTS = ['AutoApply OS', 'AutoApply', 'matching engine']
const ACTION_LINE = /\b(built|designed|implemented|hardened|created|developed|shipped|led|automated|optimized|integrated|deployed)\b/i

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
}

function semanticTerms(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9+#. ]/g, ' ')
        .split(/\s+/)
        .filter((term) => term.length > 2)
        .slice(0, 80)
    )
  )
}

function hashTerm(term: string): number {
  let hash = 2166136261
  for (let index = 0; index < term.length; index += 1) {
    hash ^= term.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

export function localTextEmbedding512(text: string): number[] {
  const vector = new Array(512).fill(0)
  const terms = semanticTerms(text)

  for (const term of terms) {
    vector[hashTerm(term) % vector.length] += 1
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => Number((value / magnitude).toFixed(6)))
}

export function vectorToPgLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}

export function chunkEvidenceText(rawText: string): DraftEvidenceChunk[] {
  return normalizeWhitespace(rawText)
    .split(/\n\s*\n|(?<=\.)\s+(?=[A-Z])/)
    .map((content) => normalizeWhitespace(content))
    .filter((content) => content.length >= 20)
    .slice(0, 40)
    .map((content, index) => ({
      chunk_index: index,
      content,
      token_count: content.split(/\s+/).filter(Boolean).length,
      semantic_terms: semanticTerms(content),
      embedding: localTextEmbedding512(content),
    }))
}

function categorizeClaim(text: string): string {
  if (/\b(c\+\+|matching engine|low latency|order book|trading)\b/i.test(text)) return 'quant'
  if (/\b(llm|rag|retrieval|embedding|machine learning|ai)\b/i.test(text)) return 'ai_ml'
  if (/\b(react|next\.js|frontend|full[- ]stack|browser extension|supabase)\b/i.test(text)) return 'full_stack'
  if (/\b(service bus|worker|queue|reliability|duplicate|backend|api)\b/i.test(text)) return 'backend'
  if (/\b(client|stakeholder|consulting)\b/i.test(text)) return 'consulting'
  return 'other'
}

function roleArchetypesForCategory(category: string): string[] {
  const roles: Record<string, string[]> = {
    quant: ['quant_swe', 'systems'],
    ai_ml: ['ai_ml', 'ai_platform'],
    full_stack: ['full_stack', 'product_engineer', 'backend'],
    backend: ['backend', 'sre_infra', 'cloud'],
    consulting: ['consulting', 'business_analyst'],
    other: [],
  }

  return roles[category] ?? []
}

export function extractDraftClaimsFromDocument(rawText: string): DraftClaim[] {
  const seen = new Set<string>()

  return normalizeWhitespace(rawText)
    .split(/\n|(?<=\.)\s+/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length >= 24 && ACTION_LINE.test(line))
    .filter((line) => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)
    .map((claim) => {
      const category = categorizeClaim(claim)
      return {
        claim,
        category,
        evidence_strength: 'medium',
        confidence: 0.72,
        resume_usable: true,
        best_role_archetypes: roleArchetypesForCategory(category),
        do_not_overclaim: [
          'Do not add metrics, scale, users, revenue, or production scope unless present in the source text.',
          'Keep this as a draft claim until reviewed against the source evidence.',
        ],
        metadata: {
          extraction_method: 'local-heuristic-v1',
          semantic_terms: semanticTerms(claim),
        },
      }
    })
}

export function extractKnowledgeEntities(rawText: string): DraftEntity[] {
  const entities = new Map<string, DraftEntity>()

  function add(entity: DraftEntity) {
    entities.set(`${entity.entity_type}:${entity.normalized_name}`, entity)
  }

  for (const company of COMPANIES) {
    if (new RegExp(`\\b${company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rawText)) {
      add({ entity_type: 'company', name: company, normalized_name: normalizeCompanyName(company) })
    }
  }

  for (const project of PROJECTS) {
    if (new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(rawText)) {
      add({ entity_type: 'project', name: project, normalized_name: project.toLowerCase() })
    }
  }

  for (const technology of TECHNOLOGIES) {
    if (new RegExp(`\\b${technology.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rawText)) {
      add({ entity_type: 'technology', name: technology, normalized_name: technology.toLowerCase() })
    }
  }

  return Array.from(entities.values())
}
