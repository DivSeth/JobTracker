import { describe, test, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/profiles/[id]/duplicate (PROF-05)', () => {
  test.todo('duplicates a profile with all fields copied')
  test.todo('sets duplicate name to "{name} (Copy)" by default')
  test.todo('accepts custom name in request body')
  test.todo('sets is_default to false on duplicate')
  test.todo('duplicates resume and cover letter files in storage')
  test.todo('returns 404 if source profile does not belong to user')
})
