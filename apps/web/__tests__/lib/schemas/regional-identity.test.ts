import { describe, it, expect } from 'vitest'
import { regionalIdentityCreateSchema } from '@/lib/schemas/regional-identity'

describe('regionalIdentityCreateSchema', () => {
  const valid = {
    label: 'US student',
    country_codes: ['US'],
    is_default: false,
    email: 'me@school.edu',
    phone_e164: '+14155551234',
    country: 'US',
    authorized_to_work: true,
    needs_sponsorship_now: false,
    needs_sponsorship_future: true,
    salary_cadence: 'annual',
    desired_salary_min: 120000,
    desired_salary_max: 150000,
    salary_currency: 'USD',
  }

  it('accepts a well-formed regional identity', () => {
    expect(() => regionalIdentityCreateSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing required email', () => {
    const { email: _drop, ...bad } = valid
    void _drop
    expect(() => regionalIdentityCreateSchema.parse(bad)).toThrow()
  })

  it('rejects missing country', () => {
    const { country: _drop, ...bad } = valid
    void _drop
    expect(() => regionalIdentityCreateSchema.parse(bad)).toThrow()
  })

  it('rejects invalid ISO country code', () => {
    expect(() =>
      regionalIdentityCreateSchema.parse({ ...valid, country: 'XX' })
    ).toThrow()
  })

  it('rejects empty country_codes array', () => {
    expect(() =>
      regionalIdentityCreateSchema.parse({ ...valid, country_codes: [] })
    ).toThrow()
  })

  it('rejects invalid salary_cadence', () => {
    expect(() =>
      regionalIdentityCreateSchema.parse({ ...valid, salary_cadence: 'yearly' })
    ).toThrow()
  })

  it('rejects invalid E.164 phone', () => {
    expect(() =>
      regionalIdentityCreateSchema.parse({ ...valid, phone_e164: '415-555-1234' })
    ).toThrow()
  })

  it('accepts eeo fields', () => {
    const withEeo = {
      ...valid,
      eeo_gender: 'Male',
      eeo_race: 'Asian',
      eeo_veteran_status: 'Not a veteran',
      eeo_disability_status: 'No',
    }
    expect(() => regionalIdentityCreateSchema.parse(withEeo)).not.toThrow()
  })

  it('accepts null eeo fields', () => {
    const withNullEeo = {
      ...valid,
      eeo_gender: null,
      eeo_race: null,
      eeo_veteran_status: null,
      eeo_disability_status: null,
    }
    expect(() => regionalIdentityCreateSchema.parse(withNullEeo)).not.toThrow()
  })

  it('accepts default_profile_id as uuid', () => {
    const withProfileId = {
      ...valid,
      default_profile_id: '550e8400-e29b-41d4-a716-446655440000',
    }
    expect(() => regionalIdentityCreateSchema.parse(withProfileId)).not.toThrow()
  })

  it('accepts null default_profile_id', () => {
    const withNullId = { ...valid, default_profile_id: null }
    expect(() => regionalIdentityCreateSchema.parse(withNullId)).not.toThrow()
  })
})
