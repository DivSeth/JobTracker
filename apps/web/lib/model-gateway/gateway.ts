import {
  extractDraftClaimsFromDocument,
  extractKnowledgeEntities,
  localTextEmbedding512,
} from '@/lib/knowledge-graph/ingest'
import type {
  EvidenceExtractionInput,
  EvidenceExtractionResult,
  ModelGateway,
  EmbeddingResult,
} from '@/lib/model-gateway/types'

const LOCAL_EMBEDDING_MODEL = 'local-hash-512-v1'
const LOCAL_EXTRACTION_MODEL = 'local-heuristic-v1'
const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001'
const DEFAULT_DASHSCOPE_EMBEDDING_MODEL = 'text-embedding-v4'
const DEFAULT_DASHSCOPE_EMBEDDING_DIMENSIONS = 512
const DEFAULT_DASHSCOPE_EMBEDDING_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/embeddings'
const DEFAULT_DASHSCOPE_CHAT_MODEL = 'qwen-plus'
const DEFAULT_DASHSCOPE_CHAT_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'
const EMBEDDING_DIMENSIONS = 512
const DASHSCOPE_SUPPORTED_DIMENSIONS = new Set([512, 768, 1024, 1536, 2048])
const VALID_CLAIM_CATEGORIES = new Set([
  'backend',
  'distributed_systems',
  'reliability',
  'cloud',
  'full_stack',
  'frontend',
  'product',
  'ai_ml',
  'retrieval',
  'data',
  'quant',
  'systems',
  'consulting',
  'leadership',
  'other',
])
const VALID_ENTITY_TYPES = new Set(['company', 'project', 'technology', 'skill', 'domain'])

async function embedTextLocally(text: string): Promise<EmbeddingResult> {
  const vector = localTextEmbedding512(text)

  return {
    vector,
    dimensions: vector.length,
    provider: 'local',
    model: LOCAL_EMBEDDING_MODEL,
  }
}

async function embedTextWithGemini(text: string): Promise<EmbeddingResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return embedTextLocally(text)

  const model = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_GEMINI_EMBEDDING_MODEL
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  )

  if (!response.ok) {
    return embedTextLocally(text)
  }

  const data = await response.json() as { embedding?: { values?: number[] } }
  const vector = data.embedding?.values
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    return embedTextLocally(text)
  }

  return {
    vector: vector.map((value) => Number(value)),
    dimensions: vector.length,
    provider: 'gemini',
    model,
  }
}

function parseDashScopeDimensions(): number {
  const configuredDimensions = Number(process.env.DASHSCOPE_EMBEDDING_DIMENSIONS)
  if (DASHSCOPE_SUPPORTED_DIMENSIONS.has(configuredDimensions)) {
    return configuredDimensions
  }

  return DEFAULT_DASHSCOPE_EMBEDDING_DIMENSIONS
}

async function embedTextWithDashScope(text: string): Promise<EmbeddingResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return embedTextLocally(text)

  const model = process.env.DASHSCOPE_EMBEDDING_MODEL || DEFAULT_DASHSCOPE_EMBEDDING_MODEL
  const requestedDimensions = parseDashScopeDimensions()
  const endpoint = process.env.DASHSCOPE_EMBEDDING_URL || DEFAULT_DASHSCOPE_EMBEDDING_URL

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        dimensions: requestedDimensions,
      }),
    })

    if (!response.ok) {
      return embedTextLocally(text)
    }

    const data = await response.json() as { data?: Array<{ embedding?: number[] }> }
    const vector = data.data?.[0]?.embedding
    if (!Array.isArray(vector) || vector.length < EMBEDDING_DIMENSIONS) {
      return embedTextLocally(text)
    }

    return {
      vector: vector.slice(0, EMBEDDING_DIMENSIONS).map((value) => Number(value)),
      dimensions: EMBEDDING_DIMENSIONS,
      provider: 'dashscope',
      model: vector.length === EMBEDDING_DIMENSIONS && requestedDimensions === EMBEDDING_DIMENSIONS
        ? `${model}:${requestedDimensions}`
        : `${model}:${requestedDimensions}-truncated-${EMBEDDING_DIMENSIONS}`,
    }
  } catch {
    return embedTextLocally(text)
  }
}

async function extractEvidenceLocally(input: EvidenceExtractionInput): Promise<EvidenceExtractionResult> {
  return {
    claims: extractDraftClaimsFromDocument(input.rawText),
    entities: extractKnowledgeEntities(input.rawText),
    provider: 'local',
    model: LOCAL_EXTRACTION_MODEL,
  }
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.7
  return Math.min(1, Math.max(0, Number(value.toFixed(2))))
}

function normalizeCategory(value: unknown): string {
  if (typeof value === 'string' && VALID_CLAIM_CATEGORIES.has(value)) {
    return value
  }

  return 'other'
}

function normalizeEvidenceStrength(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value
  return 'medium'
}

function normalizeEntityType(value: unknown): 'company' | 'project' | 'technology' | 'skill' | 'domain' {
  if (typeof value === 'string' && VALID_ENTITY_TYPES.has(value)) {
    return value as 'company' | 'project' | 'technology' | 'skill' | 'domain'
  }

  return 'domain'
}

function parseDashScopeExtraction(content: string, model: string): EvidenceExtractionResult | null {
  const parsed = JSON.parse(content) as {
    claims?: Array<Record<string, unknown>>
    entities?: Array<Record<string, unknown>>
  }

  const claims = (Array.isArray(parsed.claims) ? parsed.claims : [])
    .filter((claim) => typeof claim.claim === 'string' && claim.claim.trim().length > 0)
    .slice(0, 12)
    .map((claim) => ({
      claim: String(claim.claim).trim().slice(0, 1000),
      category: normalizeCategory(claim.category),
      evidence_strength: normalizeEvidenceStrength(claim.evidence_strength),
      confidence: normalizeConfidence(claim.confidence),
      resume_usable: typeof claim.resume_usable === 'boolean' ? claim.resume_usable : true,
      best_role_archetypes: normalizeStringList(claim.best_role_archetypes),
      do_not_overclaim: normalizeStringList(claim.do_not_overclaim),
      metadata: {
        extraction_method: `dashscope:${model}`,
      },
    }))

  const entities = (Array.isArray(parsed.entities) ? parsed.entities : [])
    .filter((entity) => typeof entity.name === 'string' && entity.name.trim().length > 0)
    .slice(0, 24)
    .map((entity) => {
      const name = String(entity.name).trim().slice(0, 160)
      const normalizedName = typeof entity.normalized_name === 'string' && entity.normalized_name.trim()
        ? entity.normalized_name.trim().slice(0, 160)
        : name.toLowerCase()

      return {
        entity_type: normalizeEntityType(entity.entity_type),
        name,
        normalized_name: normalizedName,
      }
    })

  if (claims.length === 0 && entities.length === 0) return null

  return {
    claims,
    entities,
    provider: 'dashscope',
    model,
  }
}

function buildDashScopeExtractionPrompt(input: EvidenceExtractionInput): string {
  return [
    `Source type: ${input.sourceType}`,
    `Title: ${input.title}`,
    '',
    'Extract evidence-backed professional claims and entities from this source.',
    'Return JSON only with shape: {"claims":[{"claim":"...","category":"backend|distributed_systems|reliability|cloud|full_stack|frontend|product|ai_ml|retrieval|data|quant|systems|consulting|leadership|other","evidence_strength":"low|medium|high","confidence":0.0,"resume_usable":true,"best_role_archetypes":["..."],"do_not_overclaim":["..."]}],"entities":[{"entity_type":"company|project|technology|skill|domain","name":"...","normalized_name":"..."}]}.',
    'Every claim must be directly supported by the source text. Do not invent metrics, scale, users, revenue, titles, or production scope.',
    '',
    'Source text:',
    input.rawText.slice(0, 24000),
  ].join('\n')
}

async function extractEvidenceWithDashScope(input: EvidenceExtractionInput): Promise<EvidenceExtractionResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return extractEvidenceLocally(input)

  const model = process.env.DASHSCOPE_CHAT_MODEL || DEFAULT_DASHSCOPE_CHAT_MODEL
  const endpoint = process.env.DASHSCOPE_CHAT_URL || DEFAULT_DASHSCOPE_CHAT_URL

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You extract source-grounded resume evidence. Return valid JSON only.',
          },
          {
            role: 'user',
            content: buildDashScopeExtractionPrompt(input),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    })

    if (!response.ok) {
      return extractEvidenceLocally(input)
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return extractEvidenceLocally(input)
    }

    return parseDashScopeExtraction(content, model) ?? extractEvidenceLocally(input)
  } catch {
    return extractEvidenceLocally(input)
  }
}

export function createDefaultModelGateway(): ModelGateway {
  const embeddingProvider = process.env.KNOWLEDGE_EMBEDDING_PROVIDER
  const extractionProvider = process.env.KNOWLEDGE_EXTRACTION_PROVIDER

  return {
    embedText:
      embeddingProvider === 'gemini'
        ? embedTextWithGemini
        : embeddingProvider === 'dashscope'
          ? embedTextWithDashScope
          : embedTextLocally,
    extractEvidence: extractionProvider === 'dashscope' ? extractEvidenceWithDashScope : extractEvidenceLocally,
  }
}
