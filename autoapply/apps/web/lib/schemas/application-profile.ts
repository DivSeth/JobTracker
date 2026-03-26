import { z } from 'zod'

export const certificationEntrySchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().nullable(),
  expiry: z.string().nullable(),
})

export const languageEntrySchema = z.object({
  language: z.string().min(1, 'Language is required'),
  proficiency: z.enum(['native', 'fluent', 'professional', 'basic']),
})

export const experienceEntrySchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  employment_type: z.enum(['full_time', 'internship', 'part_time', 'contract']),
  start: z.string().min(1, 'Start date is required'),
  end: z.string().nullable(),
  bullets: z.array(z.string()),
})

export const educationEntrySchema = z.object({
  school: z.string().min(1, 'School is required'),
  degree: z.string().min(1, 'Degree is required'),
  major: z.string().min(1, 'Major is required'),
  gpa: z.number().min(0).max(4.0).optional(),
  graduation_year: z.number().int().min(1950).max(2035),
})

export const applicationProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(50, 'Profile name too long'),
  is_default: z.boolean().default(false),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  languages: z.array(languageEntrySchema).default([]),
  eeo_gender: z.string().nullable().default(null),
  eeo_race: z.string().nullable().default(null),
  eeo_veteran_status: z.string().nullable().default(null),
  eeo_disability_status: z.string().nullable().default(null),
  work_authorization: z.string().nullable().default(null),
  sponsorship_required: z.boolean().nullable().default(null),
  resume_path: z.string().nullable().default(null),
  cover_letter_path: z.string().nullable().default(null),
})

export type ApplicationProfileInput = z.infer<typeof applicationProfileSchema>
