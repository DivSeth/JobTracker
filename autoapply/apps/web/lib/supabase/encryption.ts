import { createClient } from '@/lib/supabase/server'

const ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY!

/**
 * Encrypt a PII field value using pgcrypto pgp_sym_encrypt.
 * Call from server-side only (API routes).
 */
export async function encryptPii(supabase: Awaited<ReturnType<typeof createClient>>, value: string): Promise<string> {
  const { data, error } = await supabase.rpc('encrypt_pii', {
    val: value,
    encryption_key: ENCRYPTION_KEY,
  })
  if (error) throw new Error(`Encryption failed: ${error.message}`)
  return data
}

/**
 * Decrypt a PII field value using pgcrypto pgp_sym_decrypt.
 * Call from server-side only (API routes).
 */
export async function decryptPii(supabase: Awaited<ReturnType<typeof createClient>>, encryptedValue: string): Promise<string> {
  const { data, error } = await supabase.rpc('decrypt_pii', {
    val: encryptedValue,
    encryption_key: ENCRYPTION_KEY,
  })
  if (error) throw new Error(`Decryption failed: ${error.message}`)
  return data
}

/** Fields on ApplicationProfile that require PII encryption */
export const PII_FIELDS = [
  'eeo_gender',
  'eeo_race',
  'eeo_veteran_status',
  'eeo_disability_status',
  'work_authorization',
] as const
