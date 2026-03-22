-- Add profile_details JSONB column for personal info (name, phone, bio, resume/portfolio URLs)
-- Keeps preferences JSONB strictly for job search preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_details JSONB DEFAULT '{}';

-- Add Summer 2026 job sources
INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/Summer2026-Internships', 'SimplifyJobs/Summer2026-Internships', 'internship', true),
  ('https://github.com/vanshb03/Summer2026-Internships', 'vanshb03/Summer2026-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
