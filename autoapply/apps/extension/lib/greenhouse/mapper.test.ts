import { describe, it, expect } from 'vitest'
// import { mapProfileToFields } from './mapper'

describe('mapProfileToFields', () => {
  it.todo('maps first_name field to user profile full_name with first_name transform')
  it.todo('maps email field to user profile email')
  it.todo('maps resume field with file_upload transform')
  it.todo('maps education fields to application_profile education[0]')
  it.todo('maps experience fields to application_profile experience[0]')
  it.todo('returns unmapped MappedField with null profileValue for unknown custom questions')
  it.todo('marks EEO fields as isMasked=true')
  it.todo('marks work_authorization fields as isMasked=true')
  it.todo('uses regex matching for field_pattern against field name')
  it.todo('uses regex matching for field_pattern against field label')
})
