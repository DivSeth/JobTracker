import { z } from 'zod'

export const baseIdentitySchema = z.object({
  first_name: z.string().min(1).max(100).nullable(),
  last_name: z.string().min(1).max(100).nullable(),
  preferred_first_name: z.string().max(100).nullable(),
  pronouns: z.string().max(50).nullable(),
  linkedin_url: z.string().url().nullable(),
  github_url: z.string().url().nullable(),
  portfolio_url: z.string().url().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  willing_to_relocate: z.boolean(),
  work_arrangement_preference: z
    .enum(['remote', 'hybrid', 'onsite', 'any'])
    .nullable(),
  earliest_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  referral_source: z.string().max(200).nullable(),
})

export const baseIdentityPatchSchema = baseIdentitySchema.partial()

export type BaseIdentity = z.infer<typeof baseIdentitySchema>
export type BaseIdentityPatch = z.infer<typeof baseIdentityPatchSchema>
