import { describe, it, expect } from 'vitest'
// import { scanGreenhouseForm } from './scanner'

describe('scanGreenhouseForm', () => {
  it.todo('discovers standard text inputs (first_name, last_name, email, phone)')
  it.todo('discovers select elements with their options')
  it.todo('discovers textarea fields')
  it.todo('discovers file inputs (resume, cover_letter)')
  it.todo('extracts label text for each field')
  it.todo('marks required fields based on .field_required or required attribute')
  it.todo('discovers custom question fields with question_{ID} pattern')
  it.todo('returns empty array when no form is found')
  it.todo('ignores hidden and submit inputs')
})
