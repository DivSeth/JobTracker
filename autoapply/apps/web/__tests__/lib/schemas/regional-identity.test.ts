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
})
