import { describe, it, expect } from 'vitest'
import { baseIdentitySchema, baseIdentityPatchSchema } from '@/lib/schemas/base-identity'

const validBase = {
  first_name: 'Jane',
  last_name: 'Doe',
  preferred_first_name: null,
  pronouns: null,
  linkedin_url: 'https://linkedin.com/in/janedoe',
  github_url: null,
  portfolio_url: null,
  date_of_birth: '1999-06-15',
  willing_to_relocate: false,
  work_arrangement_preference: 'remote' as const,
  earliest_start_date: '2025-05-01',
  referral_source: null,
}

describe('baseIdentitySchema', () => {
  it('accepts a well-formed base identity', () => {
    expect(() => baseIdentitySchema.parse(validBase)).not.toThrow()
  })

  it('rejects first_name: empty string', () => {
    expect(() =>
      baseIdentitySchema.parse({ ...validBase, first_name: '' })
    ).toThrow()
  })

  it('rejects malformed linkedin_url', () => {
    expect(() =>
      baseIdentitySchema.parse({ ...validBase, linkedin_url: 'not-a-url' })
    ).toThrow()
  })

  it('rejects date_of_birth with invalid month: "2024-13-01"', () => {
    expect(() =>
      baseIdentitySchema.parse({ ...validBase, date_of_birth: '2024-13-01' })
    ).toThrow()
  })

  it('rejects date_of_birth with impossible day: "2024-02-30"', () => {
    expect(() =>
      baseIdentitySchema.parse({ ...validBase, date_of_birth: '2024-02-30' })
    ).toThrow()
  })

  it('rejects invalid work_arrangement_preference: "anywhere"', () => {
    expect(() =>
      baseIdentitySchema.parse({ ...validBase, work_arrangement_preference: 'anywhere' })
    ).toThrow()
  })
})

describe('baseIdentityPatchSchema', () => {
  it('accepts a partial patch with only first_name', () => {
    expect(() => baseIdentityPatchSchema.parse({ first_name: 'Jane' })).not.toThrow()
  })

  it('makes willing_to_relocate optional (can be omitted)', () => {
    const { willing_to_relocate: _drop, ...withoutReloc } = validBase
    void _drop
    expect(() => baseIdentityPatchSchema.parse(withoutReloc)).not.toThrow()
  })

  it('rejects willing_to_relocate: null (not nullable)', () => {
    expect(() =>
      baseIdentityPatchSchema.parse({ ...validBase, willing_to_relocate: null })
    ).toThrow()
  })
})
