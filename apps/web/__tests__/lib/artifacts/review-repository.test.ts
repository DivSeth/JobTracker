import { describe, expect, it, vi } from 'vitest'
import { loadRecentGeneratedArtifacts, updateGeneratedArtifactStatus } from '@/lib/artifacts/repository'

function createSelectClient(results: Record<string, unknown[]>) {
  const calls: Array<{ table: string; op: string; args: unknown[] }> = []

  const chainFor = (table: string) => {
    const chain = {
      select: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'select', args })
        return chain
      }),
      eq: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'eq', args })
        return chain
      }),
      order: vi.fn((...args: unknown[]) => {
        calls.push({ table, op: 'order', args })
        return chain
      }),
      limit: vi.fn(async (...args: unknown[]) => {
        calls.push({ table, op: 'limit', args })
        return { data: results[table] ?? [], error: null }
      }),
    }

    return chain
  }

  return {
    calls,
    client: {
      from(table: string) {
        return chainFor(table)
      },
    },
  }
}

function createUpdateClient() {
  const calls: Array<{ table: string; op: string; args: unknown[] }> = []
  const chain = {
    update: vi.fn((...args: unknown[]) => {
      calls.push({ table: 'generated_artifacts', op: 'update', args })
      return chain
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ table: 'generated_artifacts', op: 'eq', args })
      return chain
    }),
    select: vi.fn((...args: unknown[]) => {
      calls.push({ table: 'generated_artifacts', op: 'select', args })
      return chain
    }),
    single: vi.fn(async () => ({ data: { id: 'artifact-1', status: 'approved' }, error: null })),
  }

  return {
    calls,
    client: {
      from(table: string) {
        expect(table).toBe('generated_artifacts')
        return chain
      },
    },
  }
}

describe('loadRecentGeneratedArtifacts', () => {
  it('loads recent generated artifacts for the authenticated user', async () => {
    const mock = createSelectClient({
      generated_artifacts: [
        {
          id: 'artifact-1',
          artifact_type: 'resume_tex',
          status: 'draft',
          content: '% resume draft',
          created_at: '2026-08-18T00:00:00Z',
        },
      ],
    })

    const artifacts = await loadRecentGeneratedArtifacts(mock.client, 'user-1')

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0]).toEqual(expect.objectContaining({ id: 'artifact-1', status: 'draft' }))
    expect(mock.calls).toEqual(
      expect.arrayContaining([
        { table: 'generated_artifacts', op: 'eq', args: ['user_id', 'user-1'] },
        { table: 'generated_artifacts', op: 'limit', args: [10] },
      ])
    )
  })
})

describe('updateGeneratedArtifactStatus', () => {
  it('updates an artifact status within the current user boundary', async () => {
    const mock = createUpdateClient()

    const artifact = await updateGeneratedArtifactStatus(mock.client, 'user-1', 'artifact-1', 'approved')

    expect(artifact).toEqual({ id: 'artifact-1', status: 'approved' })
    expect(mock.calls).toEqual(
      expect.arrayContaining([
        { table: 'generated_artifacts', op: 'update', args: [expect.objectContaining({ status: 'approved' })] },
        { table: 'generated_artifacts', op: 'eq', args: ['id', 'artifact-1'] },
        { table: 'generated_artifacts', op: 'eq', args: ['user_id', 'user-1'] },
      ])
    )
  })
})
