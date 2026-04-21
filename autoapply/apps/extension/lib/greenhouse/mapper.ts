import type {
  FieldMappingRule,
  GreenhouseField,
  MappedField,
} from '@/lib/greenhouse/types'

type UserProfile = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  portfolio_url?: string | null
  portfolioUrl?: string | null
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
  {
    field_pattern: '(^|_)first_?name$|first name',
    profile_path: 'full_name',
    source: 'user_profile',
    transform: 'first_name',
  },
  {
    field_pattern: '(^|_)last_?name$|last name',
    profile_path: 'full_name',
    source: 'user_profile',
    transform: 'last_name',
  },
  {
    field_pattern: '^email$|email address',
    profile_path: 'email',
    source: 'user_profile',
  },
  {
    field_pattern: '^phone(_number)?$|phone number|mobile',
    profile_path: 'phone',
    source: 'user_profile',
    transform: 'format_phone',
  },
  {
    field_pattern: 'portfolio|website|linkedin|url',
    profile_path: 'portfolio_url',
    source: 'user_profile',
  },
  {
    field_pattern: 'resume|cv',
    profile_path: 'resume_path',
    source: 'application_profile',
    transform: 'file_upload',
  },
  {
    field_pattern: 'cover[_ ]?letter',
    profile_path: 'cover_letter_path',
    source: 'application_profile',
    transform: 'file_upload',
  },
  {
    field_pattern: 'school|university|college',
    profile_path: 'education[0].school',
    source: 'application_profile',
  },
  {
    field_pattern: 'degree',
    profile_path: 'education[0].degree',
    source: 'application_profile',
  },
  {
    field_pattern: 'major|field of study',
    profile_path: 'education[0].major',
    source: 'application_profile',
  },
  {
    field_pattern: 'company|employer',
    profile_path: 'experience[0].company',
    source: 'application_profile',
  },
  {
    field_pattern: 'title|role|position',
    profile_path: 'experience[0].role',
    source: 'application_profile',
  },
  {
    field_pattern: 'skill',
    profile_path: 'skills',
    source: 'application_profile',
    transform: 'join_skills',
  },
  {
    field_pattern: 'work authorization|authorized to work|sponsorship',
    profile_path: 'work_authorization',
    source: 'application_profile',
  },
  {
    field_pattern: 'gender',
    profile_path: 'eeo_gender',
    source: 'application_profile',
  },
  {
    field_pattern: 'race|ethnicity',
    profile_path: 'eeo_race',
    source: 'application_profile',
  },
  {
    field_pattern: 'veteran',
    profile_path: 'eeo_veteran_status',
    source: 'application_profile',
  },
  {
    field_pattern: 'disability',
    profile_path: 'eeo_disability_status',
    source: 'application_profile',
  },
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
  transform: FieldMappingRule['transform']
): string | null {
  if (transform === 'join_skills') {
    return Array.isArray(value) ? value.join(', ') : null
  }

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

  if (value == null) return null
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
  rule: FieldMappingRule
): string | null {
  const sourceProfile = getSourceProfile(profile, rule.source)
  const rawValue = getValueAtPath(sourceProfile, rule.profile_path)
  return applyTransform(rawValue, rule.transform)
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
      profileValue: resolveProfileValue(profile, rule),
      profilePath: rule.profile_path,
      source: rule.source,
      transform: rule.transform ?? null,
      isMasked: isMaskedField(field),
    }
  })
}
