import { z } from 'zod'

const isoDate = z.string().refine(
  (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(v + 'T00:00:00Z')
    if (isNaN(d.getTime())) return false
    const [y, m, day] = v.split('-').map(Number)
    return (
      d.getUTCFullYear() === y &&
      d.getUTCMonth() + 1 === m &&
      d.getUTCDate() === day
    )
  },
  { message: 'must be a valid YYYY-MM-DD date' },
)

const nullableUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .nullable()

export const baseIdentitySchema = z.object({
  first_name: z.string().min(1).max(100).nullable(),
  last_name: z.string().min(1).max(100).nullable(),
  preferred_first_name: z.string().max(100).nullable(),
  pronouns: z.string().max(50).nullable(),
  linkedin_url: nullableUrl,
  github_url: nullableUrl,
  portfolio_url: nullableUrl,
  date_of_birth: isoDate.nullable(),
  willing_to_relocate: z.boolean(),
  work_arrangement_preference: z
    .enum(['remote', 'hybrid', 'onsite', 'any'])
    .nullable(),
  earliest_start_date: isoDate.nullable(),
  referral_source: z.string().max(200).nullable(),
})

export const baseIdentityPatchSchema = baseIdentitySchema.partial()

export type BaseIdentity = z.infer<typeof baseIdentitySchema>
export type BaseIdentityPatch = z.infer<typeof baseIdentityPatchSchema>
