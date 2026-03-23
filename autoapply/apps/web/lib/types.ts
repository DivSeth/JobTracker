export type JobType = 'internship' | 'new_grad' | 'fulltime'
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

export interface Job {
  id: string; source_id: string; source_url: string | null
  title: string; company: string; location: string | null
  job_type: JobType | null; required_skills: string[]
  preferred_skills: string[]; experience_level: string | null
  remote_policy: string | null; apply_url: string | null
  posted_at: string | null; first_seen_at: string; is_active: boolean
  company_domain?: string | null; company_logo_url?: string | null
  salary_min?: number | null; salary_max?: number | null
  enriched_at?: string | null
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
}
