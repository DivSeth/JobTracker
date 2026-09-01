import { describe, test } from 'vitest'

describe('PII encryption helpers (PROF-06)', () => {
  test.todo('encryptPii calls Supabase RPC encrypt_pii with value and key')
  test.todo('decryptPii calls Supabase RPC decrypt_pii with encrypted value and key')
  test.todo('PII_FIELDS contains all 5 sensitive fields')
  test.todo('encryptPii throws on Supabase RPC error')
  test.todo('decryptPii throws on Supabase RPC error')
})
