import { describe, it, expect } from 'vitest'
// import { render } from '@testing-library/react'

describe('PreviewPanel', () => {
  it.todo('renders "Review Field Mappings" heading in preview state')
  it.todo('renders MappingRow for each mapped field with green checkmark')
  it.todo('renders UnmappedRow for fields with null profileValue')
  it.todo('renders lock icon with "[protected]" for isMasked fields (D-02)')
  it.todo('shows duplicate warning banner when duplicateInfo.exists is true (D-05)')
  it.todo('transitions to filling state on Confirm Fill click')
  it.todo('transitions to complete state after fill resolves')
  it.todo('renders FillResultBanner with filled/skipped/errors in complete state')
})
