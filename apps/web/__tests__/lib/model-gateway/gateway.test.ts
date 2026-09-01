import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultModelGateway } from '@/lib/model-gateway/gateway'

const originalEnv = { ...process.env }

afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...originalEnv }
})

describe('createDefaultModelGateway', () => {
  it('creates local embedding results with provider metadata', async () => {
    const gateway = createDefaultModelGateway()

    const result = await gateway.embedText('Built AutoApply OS with React and Supabase.')

    expect(result.vector).toHaveLength(512)
    expect(result.model).toBe('local-hash-512-v1')
    expect(result.provider).toBe('local')
    expect(result.dimensions).toBe(512)
  })

  it('extracts draft claims and entities through one provider boundary', async () => {
    const gateway = createDefaultModelGateway()

    const result = await gateway.extractEvidence({
      sourceType: 'work_experience_portfolio',
      title: 'Siemens portfolio',
      rawText: `
        Built distributed FastAPI workers for Siemens using Azure Service Bus.
        Optimized queue processing and documented reliability guardrails.
      `,
    })

    expect(result.provider).toBe('local')
    expect(result.model).toBe('local-heuristic-v1')
    expect(result.claims[0]?.claim).toContain('Built distributed FastAPI workers')
    expect(result.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: 'company', name: 'Siemens' }),
        expect.objectContaining({ entity_type: 'technology', name: 'Azure' }),
      ])
    )
  })

  it('uses DashScope chat extraction when configured', async () => {
    process.env.KNOWLEDGE_EXTRACTION_PROVIDER = 'dashscope'
    process.env.DASHSCOPE_API_KEY = 'test-key'
    process.env.DASHSCOPE_CHAT_MODEL = 'qwen-plus'
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                claims: [
                  {
                    claim: 'Built distributed FastAPI workers for Siemens using Azure Service Bus.',
                    category: 'backend',
                    evidence_strength: 'high',
                    confidence: 0.91,
                    resume_usable: true,
                    best_role_archetypes: ['backend', 'cloud'],
                    do_not_overclaim: ['Do not add scale metrics unless present in source.'],
                  },
                ],
                entities: [
                  {
                    entity_type: 'company',
                    name: 'Siemens',
                    normalized_name: 'siemens',
                  },
                  {
                    entity_type: 'technology',
                    name: 'Azure Service Bus',
                    normalized_name: 'azure service bus',
                  },
                ],
              }),
            },
          },
        ],
      }),
    } as Response)

    const gateway = createDefaultModelGateway()
    const result = await gateway.extractEvidence({
      sourceType: 'work_experience_portfolio',
      title: 'Siemens portfolio',
      rawText: 'Built distributed FastAPI workers for Siemens using Azure Service Bus.',
    })

    expect(result.provider).toBe('dashscope')
    expect(result.model).toBe('qwen-plus')
    expect(result.claims).toEqual([
      expect.objectContaining({
        claim: 'Built distributed FastAPI workers for Siemens using Azure Service Bus.',
        category: 'backend',
        evidence_strength: 'high',
        confidence: 0.91,
        metadata: expect.objectContaining({ extraction_method: 'dashscope:qwen-plus' }),
      }),
    ])
    expect(result.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: 'company', name: 'Siemens' }),
        expect.objectContaining({ entity_type: 'technology', name: 'Azure Service Bus' }),
      ])
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      })
    )
    const requestBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))
    expect(requestBody).toEqual(expect.objectContaining({
      model: 'qwen-plus',
      response_format: { type: 'json_object' },
      temperature: 0,
    }))
    expect(requestBody.messages[0].content).toContain('JSON')
    expect(requestBody.messages[1].content).toContain('Siemens portfolio')
  })

  it('falls back to local extraction when DashScope chat returns malformed JSON', async () => {
    process.env.KNOWLEDGE_EXTRACTION_PROVIDER = 'dashscope'
    process.env.DASHSCOPE_API_KEY = 'test-key'
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not json' } }],
      }),
    } as Response)

    const gateway = createDefaultModelGateway()
    const result = await gateway.extractEvidence({
      sourceType: 'project_note',
      title: 'AutoApply notes',
      rawText: 'Built AutoApply OS with React and Supabase.',
    })

    expect(result.provider).toBe('local')
    expect(result.model).toBe('local-heuristic-v1')
    expect(result.claims[0]?.claim).toContain('Built AutoApply OS')
  })

  it('uses Gemini embeddings when configured', async () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = 'gemini'
    process.env.GEMINI_API_KEY = 'test-key'
    process.env.GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001'
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        embedding: { values: Array.from({ length: 512 }, (_, index) => index / 512) },
      }),
    } as Response)

    const gateway = createDefaultModelGateway()
    const result = await gateway.embedText('Built semantic retrieval over evidence chunks.')

    expect(result.provider).toBe('gemini')
    expect(result.model).toBe('gemini-embedding-001')
    expect(result.dimensions).toBe(512)
    expect(result.vector).toHaveLength(512)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('models/gemini-embedding-001:embedContent'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Built semantic retrieval'),
      })
    )
  })

  it('falls back to local embeddings when Gemini is configured without an API key', async () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = 'gemini'
    delete process.env.GEMINI_API_KEY

    const gateway = createDefaultModelGateway()
    const result = await gateway.embedText('Fallback embedding text.')

    expect(result.provider).toBe('local')
    expect(result.model).toBe('local-hash-512-v1')
    expect(result.vector).toHaveLength(512)
  })

  it('uses DashScope embeddings when configured and stores native 512 dimensions', async () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = 'dashscope'
    process.env.DASHSCOPE_API_KEY = 'test-key'
    process.env.DASHSCOPE_EMBEDDING_MODEL = 'text-embedding-v4'
    process.env.DASHSCOPE_EMBEDDING_DIMENSIONS = '512'
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            embedding: Array.from({ length: 512 }, (_, index) => index / 512),
            index: 0,
            object: 'embedding',
          },
        ],
        model: 'text-embedding-v4',
        object: 'list',
        usage: { prompt_tokens: 12, total_tokens: 12 },
      }),
    } as Response)

    const gateway = createDefaultModelGateway()
    const result = await gateway.embedText('Built semantic retrieval over work evidence.')

    expect(result.provider).toBe('dashscope')
    expect(result.model).toBe('text-embedding-v4:512')
    expect(result.dimensions).toBe(512)
    expect(result.vector).toHaveLength(512)
    expect(result.vector[511]).toBe(511 / 512)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          model: 'text-embedding-v4',
          input: 'Built semantic retrieval over work evidence.',
          dimensions: 512,
        }),
      })
    )
  })

  it('falls back to local embeddings when DashScope returns an unusable vector', async () => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = 'dashscope'
    process.env.DASHSCOPE_API_KEY = 'test-key'
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ embedding: [0.1, 0.2] }],
      }),
    } as Response)

    const gateway = createDefaultModelGateway()
    const result = await gateway.embedText('Fallback embedding text.')

    expect(result.provider).toBe('local')
    expect(result.model).toBe('local-hash-512-v1')
    expect(result.vector).toHaveLength(512)
  })
})
