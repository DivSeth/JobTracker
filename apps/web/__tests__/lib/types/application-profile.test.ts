import { describe, test } from 'vitest'

describe('ApplicationProfile type and Zod schema (PROF-02)', () => {
  test.todo('applicationProfileSchema accepts valid full profile data')
  test.todo('applicationProfileSchema rejects missing required name field')
  test.todo('applicationProfileSchema accepts empty arrays for experience, education, skills')
  test.todo('applicationProfileSchema validates experience entry structure')
  test.todo('applicationProfileSchema validates education entry structure')
  test.todo('applicationProfileSchema validates certification entry structure')
  test.todo('applicationProfileSchema validates language proficiency enum')
  test.todo('applicationProfileSchema accepts null for all EEO fields')
  test.todo('applicationProfileSchema has all Workday-parity fields (experience, education, skills, certifications, languages, EEO, work auth, files)')
})
