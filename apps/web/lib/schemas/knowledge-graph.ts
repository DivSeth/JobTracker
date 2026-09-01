import { z } from 'zod'

const nonEmptyString = z.string().trim().min(1)
const nullableText = z.string().trim().min(1).nullable().optional()

export const evidenceSourceTypeSchema = z.enum([
  'resume',
  'work_experience_portfolio',
  'cover_letter',
  'project_note',
  'application_answer',
  'chatgpt_export',
  'linkedin',
  'github',
  'manual_note',
  'other',
])

export const evidenceSourceCreateSchema = z.object({
  source_type: evidenceSourceTypeSchema,
  title: nonEmptyString.max(200),
  source_date: z.string().date().nullable().optional(),
  storage_path: nullableText,
  original_url: z.string().trim().url().nullable().optional(),
  raw_text: nullableText,
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const evidenceChunkCreateSchema = z.object({
  evidence_source_id: z.string().uuid(),
  chunk_index: z.number().int().min(0),
  content: nonEmptyString,
  token_count: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const claimCategorySchema = z.enum([
  'backend',
  'distributed_systems',
  'reliability',
  'cloud',
  'full_stack',
  'frontend',
  'product',
  'ai_ml',
  'retrieval',
  'data',
  'quant',
  'systems',
  'consulting',
  'leadership',
  'other',
])

export const evidenceStrengthSchema = z.enum(['low', 'medium', 'high'])

export const professionalClaimCreateSchema = z.object({
  claim: nonEmptyString.max(1000),
  category: claimCategorySchema,
  evidence_strength: evidenceStrengthSchema,
  confidence: z.number().min(0).max(1),
  resume_usable: z.boolean().default(true),
  best_role_archetypes: z.array(nonEmptyString.max(80)).default([]),
  do_not_overclaim: z.array(nonEmptyString.max(300)).default([]),
  source_evidence_ids: z.array(z.string().uuid()).min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const networkSenioritySchema = z.enum([
  'student',
  'junior',
  'mid',
  'senior',
  'staff_plus',
  'manager',
  'director_plus',
  'recruiter',
  'unknown',
])

export const relationshipStrengthSchema = z.enum([
  'weak',
  'warm',
  'strong',
  'unknown',
])

export const reminderPreferenceSchema = z.enum([
  'before_applying',
  'after_applying',
  'only_if_high_fit',
  'never',
])

export const networkContactCreateSchema = z.object({
  full_name: nonEmptyString.max(160),
  company_name: nonEmptyString.max(160),
  role_title: nonEmptyString.max(160),
  seniority: networkSenioritySchema.default('unknown'),
  relationship_strength: relationshipStrengthSchema.default('unknown'),
  email: z.string().trim().email().nullable().optional(),
  phone_e164: z.string().regex(/^\+[1-9]\d{1,14}$/).nullable().optional(),
  linkedin_url: z.string().trim().url().nullable().optional(),
  referral_ok: z.boolean().default(false),
  reminder_preference: reminderPreferenceSchema.default('before_applying'),
  notes: nullableText,
  metadata: z.record(z.string(), z.unknown()).default({}),
}).refine(
  (contact) => Boolean(contact.email || contact.phone_e164 || contact.linkedin_url || contact.notes),
  {
    message: 'Add at least one contact method or relationship note',
    path: ['email'],
  }
)

export type EvidenceSourceCreateInput = z.input<typeof evidenceSourceCreateSchema>
export type EvidenceChunkCreateInput = z.input<typeof evidenceChunkCreateSchema>
export type ProfessionalClaimCreateInput = z.input<typeof professionalClaimCreateSchema>
export type NetworkContactCreateInput = z.input<typeof networkContactCreateSchema>
