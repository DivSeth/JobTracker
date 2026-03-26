import { describe, test, vi } from 'vitest'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock encryption helpers
vi.mock('@/lib/supabase/encryption', () => ({
  encryptPii: vi.fn(async (_supabase: unknown, val: string) => `encrypted:${val}`),
  decryptPii: vi.fn(async (_supabase: unknown, val: string) => val.replace('encrypted:', '')),
  PII_FIELDS: ['eeo_gender', 'eeo_race', 'eeo_veteran_status', 'eeo_disability_status', 'work_authorization'],
}))

describe('POST /api/profiles (PROF-01)', () => {
  test.todo('creates a new profile with valid data and returns 201')
  test.todo('returns 400 for invalid profile data (Zod validation)')
  test.todo('returns 401 when user is not authenticated')
  test.todo('encrypts PII fields on create')
})

describe('GET /api/profiles (PROF-01)', () => {
  test.todo('returns all profiles for the authenticated user')
  test.todo('decrypts PII fields on read')
  test.todo('orders profiles with default first')
})

describe('PATCH /api/profiles/[id] (PROF-04)', () => {
  test.todo('updates profile fields and returns updated profile')
  test.todo('sets is_default flag on a profile')
  test.todo('returns 404 for non-existent profile')
})

describe('DELETE /api/profiles/[id]', () => {
  test.todo('deletes a profile and returns success')
  test.todo('removes associated files from storage on delete')
})
