import { describe, it, expect } from 'vitest'
// import { render } from '@testing-library/react'

describe('MappingRow', () => {
  it.todo('renders Greenhouse label and profile value')
  it.todo('renders CheckCircle2 icon when status is filled')
  it.todo('renders gray Circle icon when status is pending')
})

describe('UnmappedRow', () => {
  it.todo('renders Greenhouse label and "No match" text')
  it.todo('renders AlertTriangle icon in amber')
})

describe('FillProgressBar', () => {
  it.todo('renders progress bar with correct fill percentage')
  it.todo('displays "Filling N of M fields..." text')
})

describe('FillResultBanner', () => {
  it.todo('shows success message when all fields filled')
  it.todo('shows partial message with skipped count')
  it.todo('shows error message with error count')
})
