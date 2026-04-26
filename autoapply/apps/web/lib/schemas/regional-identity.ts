import { z } from 'zod'
import { COUNTRY_CODE_SET } from '@/lib/profile/country-codes'

const countryCode = z
  .string()
  .length(2)
  .refine((v) => COUNTRY_CODE_SET.has(v), 'unsupported country code')

export const regionalIdentityCreateSchema = z.object({
  label: z.string().min(1).max(80),
  country_codes: z.array(countryCode).min(1),
  is_default: z.boolean().optional().default(false),

  email: z.string().email().or(z.literal('')),
  phone_e164: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'must be E.164 (e.g. +14155551234)')
    .nullable()
    .optional(),
  address_line_1: z.string().max(200).nullable().optional(),
  address_line_2: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  country: countryCode,

  authorized_to_work: z.boolean().nullable().optional(),
  needs_sponsorship_now: z.boolean().nullable().optional(),
  needs_sponsorship_future: z.boolean().nullable().optional(),
  work_auth_status: z.string().max(100).nullable().optional(),
  work_auth_details: z.string().max(500).nullable().optional(),

  desired_salary_min: z.number().int().nonnegative().nullable().optional(),
  desired_salary_max: z.number().int().nonnegative().nullable().optional(),
  salary_currency: z.string().length(3).nullable().optional(),
  salary_cadence: z
    .enum(['annual', 'monthly', 'hourly', 'lpa'])
    .nullable()
    .optional(),
  current_compensation: z.number().int().nonnegative().nullable().optional(),

  notice_period_weeks: z.number().int().min(0).max(52).nullable().optional(),
})

export const regionalIdentityUpdateSchema = regionalIdentityCreateSchema.partial()

export type RegionalIdentityCreate = z.infer<typeof regionalIdentityCreateSchema>
export type RegionalIdentityUpdate = z.infer<typeof regionalIdentityUpdateSchema>
