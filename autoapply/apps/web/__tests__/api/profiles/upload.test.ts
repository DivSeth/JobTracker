import { describe, test, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/profiles/[id]/upload (PROF-03)', () => {
  test.todo('uploads a resume PDF and updates profile resume_path')
  test.todo('uploads a cover letter PDF and updates profile cover_letter_path')
  test.todo('rejects files over 5MB with 400')
  test.todo('rejects non-PDF files with 400')
  test.todo('returns signed URL after successful upload')
  test.todo('returns 404 if profile does not belong to user')
})
