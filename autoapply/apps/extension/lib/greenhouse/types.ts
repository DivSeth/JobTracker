/** A discovered form field on a Greenhouse application page */
export interface GreenhouseField {
  selector: string          // CSS selector to locate this field
  name: string              // input name attribute (e.g., "first_name", "question_12345")
  label: string             // human-readable label from <label> or parent text
  type: 'text' | 'email' | 'tel' | 'select' | 'combobox' | 'textarea' | 'file' | 'checkbox' | 'radio' | 'url'
  required: boolean
  options?: string[]        // for select/radio: available option texts
  value?: string            // current value if pre-filled
  isEeo?: boolean
}

/** A single mapping rule from the remote config */
export interface FieldMappingRule {
  field_pattern: string     // regex pattern to match against field name or label
  profile_path: string      // dot-notation path into profile data (e.g., "education[0].school")
  source: 'application_profile' | 'user_profile'
  transform?: 'first_name' | 'last_name' | 'file_upload' | 'join_skills' | 'format_phone' | 'first_name_or_split' | 'last_name_or_split' | 'yes_no' | 'country_name' | 'degree_type'
  isEeo?: boolean
}

/** Remote field mapping configuration fetched from Supabase */
export interface FieldMappingConfig {
  platform: 'greenhouse' | 'workday'
  version: number
  mappings: FieldMappingRule[]
  is_active: boolean
}

/** Result of mapping a profile field to a Greenhouse form field */
export interface MappedField {
  field: GreenhouseField           // the discovered form field
  profileValue: string | null      // resolved value from profile (null = unmapped)
  profilePath: string | null       // which profile field provided the value
  source: 'application_profile' | 'user_profile' | null
  transform?: string | null
  isMasked: boolean                // true for EEO/work_auth fields (shown as "[protected]")
  isEeo?: boolean
}

/** Status of filling a single field */
export type FillStatus = 'pending' | 'filled' | 'skipped' | 'error'

/** Result of a single field fill operation */
export interface FillFieldResult {
  field: GreenhouseField
  status: FillStatus
  error?: string
}

/** Overall fill operation result */
export interface FillResult {
  total: number
  filled: number
  skipped: number
  errors: number
  results: FillFieldResult[]
}

/** Payload for tracking an auto-filled application */
export interface TrackApplicationPayload {
  applyUrl: string
  jobTitle: string
  companyName: string
  profileId: string
  source: 'extension_autofill'
}

/** User identity fields stored in chrome.storage.local (non-PII only) */
export interface UserIdentity {
  email: string
  fullName: string | null
  phone: string | null
  portfolioUrl: string | null
  location: string | null
}
