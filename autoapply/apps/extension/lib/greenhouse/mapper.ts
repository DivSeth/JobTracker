import type {
  FieldMappingRule,
  GreenhouseField,
  MappedField,
} from '@/lib/greenhouse/types'

type UserProfile = {
  // Base identity
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  preferred_first_name?: string | null
  pronouns?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  portfolioUrl?: string | null
  date_of_birth?: string | null
  willing_to_relocate?: boolean | null
  work_arrangement_preference?: string | null
  earliest_start_date?: string | null
  referral_source?: string | null
  // Regional identity
  email?: string | null
  phone?: string | null
  phone_e164?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  region?: string | null
  postal_code?: string | null
  country?: string | null
  authorized_to_work?: boolean | null
  needs_sponsorship_now?: boolean | null
  needs_sponsorship_future?: boolean | null
  work_auth_status?: string | null
  work_auth_details?: string | null
  desired_salary_min?: number | null
  desired_salary_max?: number | null
  salary_currency?: string | null
  salary_cadence?: string | null
  current_compensation?: number | null
  notice_period_weeks?: number | null
  // Legacy fields
  location?: string | null
}

type ApplicationProfile = {
  experience?: unknown[]
  education?: unknown[]
  skills?: string[]
  resume_path?: string | null
  cover_letter_path?: string | null
  work_authorization?: string | null
  eeo_gender?: string | null
  eeo_race?: string | null
  eeo_veteran_status?: string | null
  eeo_disability_status?: string | null
}

type FillProfile = {
  userProfile?: UserProfile
  user_profile?: UserProfile
  applicationProfile?: ApplicationProfile
  application_profile?: ApplicationProfile
}

const DEFAULT_RULES: FieldMappingRule[] = [
  { field_pattern: '(^|_)first_?name$|first name', profile_path: 'first_name', source: 'user_profile', transform: 'first_name_or_split' },
  { field_pattern: '(^|_)last_?name$|last name', profile_path: 'last_name', source: 'user_profile', transform: 'last_name_or_split' },
  { field_pattern: 'preferred.*name|nickname', profile_path: 'preferred_first_name', source: 'user_profile' },
  { field_pattern: '^email$|email address', profile_path: 'email', source: 'user_profile' },
  { field_pattern: '^phone(_number)?$|phone number|mobile', profile_path: 'phone', source: 'user_profile', transform: 'format_phone' },
  { field_pattern: 'linkedin', profile_path: 'linkedin_url', source: 'user_profile' },
  { field_pattern: 'github', profile_path: 'github_url', source: 'user_profile' },
  { field_pattern: 'portfolio|website|personal site', profile_path: 'portfolio_url', source: 'user_profile' },
  { field_pattern: 'pronoun', profile_path: 'pronouns', source: 'user_profile' },
  { field_pattern: '^country$|country of residence|primary country', profile_path: 'country', source: 'user_profile' },
  { field_pattern: 'address.*1|street address', profile_path: 'address_line_1', source: 'user_profile' },
  { field_pattern: 'address.*2|apartment|\\bunit\\b', profile_path: 'address_line_2', source: 'user_profile' },
  { field_pattern: '^city$', profile_path: 'city', source: 'user_profile' },
  { field_pattern: '^state$|^region$|province', profile_path: 'region', source: 'user_profile' },
  { field_pattern: 'zip|postal', profile_path: 'postal_code', source: 'user_profile' },
  { field_pattern: 'authorized to work|work authorization|legally authorized', profile_path: 'authorized_to_work', source: 'user_profile', transform: 'yes_no' },
  { field_pattern: 'sponsorship.*future|require sponsorship in the future|now or in the future', profile_path: 'needs_sponsorship_future', source: 'user_profile', transform: 'yes_no' },
  { field_pattern: 'sponsorship.*now|currently require sponsorship', profile_path: 'needs_sponsorship_now', source: 'user_profile', transform: 'yes_no' },
  { field_pattern: 'visa status|work auth status|immigration status', profile_path: 'work_auth_status', source: 'user_profile' },
  { field_pattern: 'desired salary|salary expectation|expected salary|salary.*min', profile_path: 'desired_salary_min', source: 'user_profile' },
  { field_pattern: 'salary.*max|maximum salary', profile_path: 'desired_salary_max', source: 'user_profile' },
  { field_pattern: 'current.*salary|current.*ctc|current.*compensation', profile_path: 'current_compensation', source: 'user_profile' },
  { field_pattern: 'notice period', profile_path: 'notice_period_weeks', source: 'user_profile' },
  { field_pattern: 'start date|earliest.*start|available start', profile_path: 'earliest_start_date', source: 'user_profile' },
  { field_pattern: 'willing to relocate|open to relocation', profile_path: 'willing_to_relocate', source: 'user_profile', transform: 'yes_no' },
  { field_pattern: 'remote|hybrid|work arrangement|work model', profile_path: 'work_arrangement_preference', source: 'user_profile' },
  { field_pattern: 'hear about|referral source|how did you find', profile_path: 'referral_source', source: 'user_profile' },
  // Application-profile rules
  { field_pattern: 'resume|cv', profile_path: 'resume_path', source: 'application_profile', transform: 'file_upload' },
  { field_pattern: 'cover[_ ]?letter', profile_path: 'cover_letter_path', source: 'application_profile', transform: 'file_upload' },
  { field_pattern: 'school|university|college', profile_path: 'education[0].school', source: 'application_profile' },
  { field_pattern: 'degree', profile_path: 'education[0].degree', source: 'application_profile' },
  { field_pattern: 'major|field of study', profile_path: 'education[0].major', source: 'application_profile' },
  { field_pattern: 'company|employer', profile_path: 'experience[0].company', source: 'application_profile' },
  { field_pattern: 'title|role|position', profile_path: 'experience[0].role', source: 'application_profile' },
  { field_pattern: 'skill', profile_path: 'skills', source: 'application_profile', transform: 'join_skills' },
  { field_pattern: 'gender', profile_path: 'eeo_gender', source: 'application_profile' },
  { field_pattern: 'race|ethnicity', profile_path: 'eeo_race', source: 'application_profile' },
  { field_pattern: 'veteran', profile_path: 'eeo_veteran_status', source: 'application_profile' },
  { field_pattern: 'disability', profile_path: 'eeo_disability_status', source: 'application_profile' },
]

function splitFullName(fullName: string | null | undefined): { first: string | null; last: string | null } {
  const normalized = fullName?.trim()
  if (!normalized) return { first: null, last: null }
  const parts = normalized.split(/\s+/).filter(Boolean)
  return {
    first: parts[0] ?? null,
    last: parts.length > 1 ? parts.slice(1).join(' ') : null,
  }
}

function formatPhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return value
}

function matchYesNoOption(field: GreenhouseField | undefined, which: 'yes' | 'no'): string | null {
  const options = (field as unknown as { options?: string[] })?.options
  if (!options) return null
  const pattern = which === 'yes' ? /^yes/i : /^no/i
  return options.find((o) => pattern.test(o)) ?? null
}

function getSourceProfile(profile: FillProfile, source: FieldMappingRule['source']): Record<string, unknown> {
  if (source === 'user_profile') {
    return (profile.userProfile ?? profile.user_profile ?? {}) as Record<string, unknown>
  }
  return (profile.applicationProfile ?? profile.application_profile ?? {}) as Record<string, unknown>
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((accumulator, segment) => {
      if (accumulator == null || typeof accumulator !== 'object') return null
      return (accumulator as Record<string, unknown>)[segment] ?? null
    }, source)
}

function applyTransform(
  value: unknown,
  transform: FieldMappingRule['transform'],
  field?: GreenhouseField,
  profile?: FillProfile
): string | null {
  if (transform === 'join_skills') {
    return Array.isArray(value) ? value.join(', ') : null
  }

  if (transform === 'first_name_or_split') {
    if (typeof value === 'string' && value) return value
    const fn = (profile?.userProfile as { full_name?: string | null } | undefined)?.full_name
    return splitFullName(fn ?? null).first
  }

  if (transform === 'last_name_or_split') {
    if (typeof value === 'string' && value) return value
    const fn = (profile?.userProfile as { full_name?: string | null } | undefined)?.full_name
    return splitFullName(fn ?? null).last
  }

  // Legacy transforms kept for backward compatibility
  if (transform === 'first_name') {
    return splitFullName(typeof value === 'string' ? value : null).first
  }

  if (transform === 'last_name') {
    return splitFullName(typeof value === 'string' ? value : null).last
  }

  if (transform === 'format_phone') {
    return formatPhone(typeof value === 'string' ? value : null)
  }

  if (transform === 'file_upload') {
    return typeof value === 'string' && value.length > 0 ? value : null
  }

  if (transform === 'yes_no') {
    if (value === true) return matchYesNoOption(field, 'yes') ?? 'Yes'
    if (value === false) return matchYesNoOption(field, 'no') ?? 'No'
    return null
  }

  if (value == null) return null
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return typeof value === 'string' ? value : String(value)
}

function isMaskedField(field: GreenhouseField): boolean {
  const haystack = `${field.name} ${field.label}`.toLowerCase()
  return /(eeo|gender|race|ethnicity|veteran|disability|work_authorization|authorized to work|sponsorship)/.test(
    haystack
  )
}

function findRule(field: GreenhouseField): FieldMappingRule | undefined {
  const haystacks = [field.name, field.label].map((value) => value.toLowerCase())
  return DEFAULT_RULES.find((rule) => {
    const pattern = new RegExp(rule.field_pattern, 'i')
    return haystacks.some((haystack) => pattern.test(haystack))
  })
}

export function resolveProfileValue(
  profile: FillProfile,
  rule: FieldMappingRule,
  field?: GreenhouseField
): string | null {
  const sourceProfile = getSourceProfile(profile, rule.source)
  const rawValue = getValueAtPath(sourceProfile, rule.profile_path)
  return applyTransform(rawValue, rule.transform, field, profile)
}

export function mapProfileToFields(profile: FillProfile, fields: GreenhouseField[]): MappedField[] {
  return fields.map((field) => {
    const rule = findRule(field)
    const isCustomQuestion = /^question_\d+$/i.test(field.name)

    if (!rule || (isCustomQuestion && !rule)) {
      return {
        field,
        profileValue: null,
        profilePath: null,
        source: null,
        transform: null,
        isMasked: isMaskedField(field),
      }
    }

    return {
      field,
      profileValue: resolveProfileValue(profile, rule, field),
      profilePath: rule.profile_path,
      source: rule.source,
      transform: rule.transform ?? null,
      isMasked: isMaskedField(field),
    }
  })
}
