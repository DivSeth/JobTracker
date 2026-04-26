import type { StoredRegionalIdentity } from '../../utils/identity'

export type SelectionReason =
  | 'none'
  | 'single'
  | 'country-match'
  | 'ambiguous'
  | 'default'
  | 'chosen'

export interface SelectionResult {
  reason: SelectionReason
  selected: StoredRegionalIdentity | null
  candidates?: StoredRegionalIdentity[]
}

export interface SelectionInput {
  blocks: StoredRegionalIdentity[]
  detectedCountry: string | null
  chosenId: string | null
}

export function selectRegionalIdentity({
  blocks,
  detectedCountry,
  chosenId,
}: SelectionInput): SelectionResult {
  if (blocks.length === 0) {
    return { reason: 'none', selected: null }
  }

  if (chosenId) {
    const picked = blocks.find((b) => b.id === chosenId)
    if (picked) return { reason: 'chosen', selected: picked }
  }

  if (blocks.length === 1) {
    return { reason: 'single', selected: blocks[0] }
  }

  if (detectedCountry) {
    const matches = blocks.filter((b) => b.countryCodes.includes(detectedCountry))
    if (matches.length === 1) {
      return { reason: 'country-match', selected: matches[0] }
    }
    if (matches.length > 1) {
      return { reason: 'ambiguous', selected: null, candidates: matches }
    }
    const dflt = blocks.find((b) => b.isDefault)
    if (dflt) return { reason: 'default', selected: dflt }
    return { reason: 'ambiguous', selected: null, candidates: blocks }
  }

  return { reason: 'ambiguous', selected: null, candidates: blocks }
}
