export type JobType = 'internship' | 'new_grad' | 'fulltime'
export type ATSPlatform = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
export type SourcePlatform = ATSPlatform | 'remoteok' | 'github'
export type ApplicationStatus =
  | 'saved' | 'applied' | 'oa' | 'interviewing'
  | 'offer' | 'rejected' | 'ghosted'

export interface User {
  id: string; email: string; timezone: string
  gmail_watch_expiry: string | null; created_at: string
}

export interface EducationEntry {
  school: string; degree: string; major: string
  gpa?: number; graduation_year: number
}

export interface ExperienceEntry {
  company: string; role: string; employment_type: 'full_time' | 'internship' | 'part_time' | 'contract'
  start: string; end: string | null; bullets: string[]
}

export interface ProfileDetails {
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  resume_url: string | null
  portfolio_url: string | null
}

export interface UserPreferences {
  job_types: JobType[]; locations: string[]
  remote_ok: boolean; min_salary: number | null
}

export interface Profile {
  id: string; user_id: string; details: ProfileDetails
  skills: string[]; education: EducationEntry[]
  experience: ExperienceEntry[]; preferences: UserPreferences
}

export interface JobSource {
  id: string; repo_url: string; repo_name: string
  job_type_tag: JobType | null; last_synced_sha: string | null
  last_synced_at: string | null; is_active: boolean
}

export interface Company {
  id: string
  name: string
  slug: string
  ats_platform: ATSPlatform
  domain: string | null
  logo_url: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface Job {
  id: string; source_id?: string | null; source_url: string | null
  title: string; company: string; location: string | null
  job_type: JobType | null; required_skills: string[]
  preferred_skills: string[]; experience_level: string | null
  remote_policy: string | null; apply_url: string | null
  posted_at: string | null; first_seen_at: string; is_active: boolean
  company_domain?: string | null; company_logo_url?: string | null
  salary_min?: number | null; salary_max?: number | null
  enriched_at?: string | null
  company_id?: string | null
  ats_job_id?: string | null
  description?: string | null
  department?: string | null
  normalized_key?: string | null
  source_platform?: SourcePlatform | null
  updated_at?: string | null
}

export interface JobScore {
  id: string; job_id: string; user_id: string; score: number
  tier: 'rule_skip' | 'rule_match' | 'claude_scored'
  matching_skills: string[]; skill_gaps: string[]
  verdict: 'strong_match' | 'stretch' | 'skip'
  reasoning: string | null; scored_at: string
}

export interface Application {
  id: string; user_id: string; job_id: string | null
  status: ApplicationStatus; applied_at: string | null
  last_activity_at: string; notes: string | null
  source: 'manual' | 'email_detected'
}

// Joined types used in UI
export interface ApplicationWithJob extends Application {
  job?: Job | null
}

export interface JobWithScore extends Job {
  score?: JobScore | null
  source?: JobSource | null
  job_scores?: JobScore[]
  company_info?: Company | null
}

export interface EmailQueueItem {
  id: string
  user_id: string
  gmail_message_id: string
  subject: string | null
  sender: string | null
  body_preview: string | null
  classification: EmailClassification | null
  entities: EmailEntities | null
  status: 'pending' | 'processing' | 'done' | 'failed'
  error: string | null
  created_at: string
  processed_at: string | null
}

export interface EmailClassification {
  category: 'oa' | 'interview_invite' | 'rejection' | 'offer' | 'application_confirm' | 'other'
  confidence: number
  reasoning: string
}

export interface EmailEntities {
  company_name: string
  role_title: string
  job_type: 'internship' | 'new_grad' | 'fulltime' | 'unknown'
  location: string | null
  confidence: number
}

export interface ExtractedDeadline {
  type: 'oa_submission' | 'interview_slot' | 'offer_deadline' | 'other'
  datetime: string
  is_exact: boolean
  confidence: number
  raw_text: string
}

export interface Insight {
  id: string
  user_id: string
  insights: InsightItem[]
  response_rate: number | null
  avg_days_to_response: number | null
  week_start: string
  created_at: string
}

export interface InsightItem {
  type: 'stat' | 'recommendation' | 'warning'
  message: string
  data_point: string | null
}

// --- Application Profiles (Phase 1) ---

export interface CertificationEntry {
  name: string
  issuer: string
  date: string | null
  expiry: string | null
}

export interface LanguageEntry {
  language: string
  proficiency: 'native' | 'fluent' | 'professional' | 'basic'
}

export interface ApplicationProfile {
  id: string
  user_id: string
  name: string
  is_default: boolean

  // Work History
  experience: ExperienceEntry[]

  // Education
  education: EducationEntry[]

  // Skills and Certifications
  skills: string[]
  certifications: CertificationEntry[]
  languages: LanguageEntry[]

  // EEO / Demographics (per-profile per D-02, encrypted at rest per PROF-06)
  eeo_gender: string | null
  eeo_race: string | null
  eeo_veteran_status: string | null
  eeo_disability_status: string | null

  // Work Authorization (encrypted at rest)
  work_authorization: string | null
  sponsorship_required: boolean | null

  // Files (Supabase Storage paths per D-06)
  resume_path: string | null
  cover_letter_path: string | null

  // Metadata
  created_at: string
  updated_at: string
}
