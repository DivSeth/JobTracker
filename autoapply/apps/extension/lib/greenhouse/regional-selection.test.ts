import { describe, it, expect } from 'vitest'
import { selectRegionalIdentity } from './regional-selection'
import type { StoredRegionalIdentity } from '../../utils/identity'

const make = (overrides: Partial<StoredRegionalIdentity>): StoredRegionalIdentity => ({
  id: 'r1',
  label: 'US',
  countryCodes: ['US'],
  isDefault: false,
  email: 'e@x.com',
  phoneE164: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  region: null,
  postalCode: null,
  country: 'US',
  authorizedToWork: null,
  needsSponsorshipNow: null,
  needsSponsorshipFuture: null,
  workAuthStatus: null,
  workAuthDetails: null,
  desiredSalaryMin: null,
  desiredSalaryMax: null,
  salaryCurrency: null,
  salaryCadence: null,
  currentCompensation: null,
  noticePeriodWeeks: null,
  ...overrides,
})

describe('selectRegionalIdentity', () => {
  it('returns reason=none when blocks is empty', () => {
    const r = selectRegionalIdentity({ blocks: [], detectedCountry: 'US', chosenId: null })
    expect(r.reason).toBe('none')
  })

  it('auto-selects the sole block when only one exists', () => {
    const only = make({})
    const r = selectRegionalIdentity({ blocks: [only], detectedCountry: 'US', chosenId: null })
    expect(r.reason).toBe('single')
    expect(r.selected?.id).toBe('r1')
  })

  it('auto-selects the unique country match', () => {
    const us = make({ id: 'r1', countryCodes: ['US'] })
    const india = make({ id: 'r2', countryCodes: ['IN'], country: 'IN' })
    const r = selectRegionalIdentity({
      blocks: [us, india],
      detectedCountry: 'IN',
      chosenId: null,
    })
    expect(r.reason).toBe('country-match')
    expect(r.selected?.id).toBe('r2')
  })

  it('requests a picker when multiple blocks match country', () => {
    const a = make({ id: 'a', countryCodes: ['US'] })
    const b = make({ id: 'b', countryCodes: ['US'], label: 'US personal' })
    const r = selectRegionalIdentity({
      blocks: [a, b],
      detectedCountry: 'US',
      chosenId: null,
    })
    expect(r.reason).toBe('ambiguous')
    expect(r.candidates?.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('requests a picker when detectedCountry is null and there are multiple blocks', () => {
    const a = make({ id: 'a', countryCodes: ['US'] })
    const b = make({ id: 'b', countryCodes: ['IN'] })
    const r = selectRegionalIdentity({
      blocks: [a, b],
      detectedCountry: null,
      chosenId: null,
    })
    expect(r.reason).toBe('ambiguous')
  })

  it('falls back to the default when no country match and default exists', () => {
    const a = make({ id: 'a', countryCodes: ['US'], isDefault: true })
    const b = make({ id: 'b', countryCodes: ['IN'] })
    const r = selectRegionalIdentity({
      blocks: [a, b],
      detectedCountry: 'GB',
      chosenId: null,
    })
    expect(r.reason).toBe('default')
    expect(r.selected?.id).toBe('a')
  })

  it('honors an explicit chosenId from the picker', () => {
    const a = make({ id: 'a', countryCodes: ['US'] })
    const b = make({ id: 'b', countryCodes: ['US'] })
    const r = selectRegionalIdentity({
      blocks: [a, b],
      detectedCountry: 'US',
      chosenId: 'b',
    })
    expect(r.reason).toBe('chosen')
    expect(r.selected?.id).toBe('b')
  })
})
