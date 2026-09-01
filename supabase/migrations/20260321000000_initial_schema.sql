-- Enable Vault for encrypted secret storage (Gmail OAuth tokens)
-- Pre-installed on Supabase hosted; explicit here for local dev reproducibility
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- ============================================================
-- Core user record
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  gmail_watch_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Structured profile (one row per user — UNIQUE enforced)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  skills TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',   -- [{school, degree, major, gpa, graduation_year}]
  experience JSONB DEFAULT '[]',  -- [{company, role, start, end, bullets[]}]
  preferences JSONB DEFAULT '{}'  -- {job_types[], locations[], remote_ok, min_salary}
);

-- ============================================================
-- Job sources — global, intentionally no RLS
-- ============================================================
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  job_type_tag TEXT,
  last_synced_sha TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- Jobs — global, intentionally no RLS
-- ============================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES job_sources(id),
  source_url TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_type TEXT,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  experience_level TEXT,
  remote_policy TEXT,
  apply_url TEXT,
  posted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(source_id, apply_url)
);

-- ============================================================
-- Per-user job scores
-- ============================================================
CREATE TABLE job_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,
  tier TEXT,         -- rule_skip | rule_match | claude_scored
  matching_skills TEXT[] DEFAULT '{}',
  skill_gaps TEXT[] DEFAULT '{}',
  verdict TEXT,      -- strong_match | stretch | skip
  reasoning TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- ============================================================
-- Application tracking
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'saved',
  applied_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  source TEXT DEFAULT 'manual'
);
-- Prevent duplicates: same user applying to same job twice
CREATE UNIQUE INDEX idx_applications_unique_job
  ON applications(user_id, job_id) WHERE job_id IS NOT NULL;

-- ============================================================
-- Email events + deadlines (populated in Phase 2)
-- ============================================================
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  gmail_message_id TEXT UNIQUE,
  category TEXT,
  raw_subject TEXT,
  entities JSONB,
  confidence FLOAT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  email_event_id UUID REFERENCES email_events(id),
  type TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,
  reminder_sent_at TIMESTAMPTZ
);

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB,
  response_rate FLOAT,
  avg_days_to_response FLOAT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes (critical for page-load queries)
-- ============================================================
CREATE INDEX idx_applications_user_id    ON applications(user_id);
CREATE INDEX idx_email_events_user_id    ON email_events(user_id);
CREATE INDEX idx_email_events_gmail_id   ON email_events(gmail_message_id);
CREATE INDEX idx_job_scores_user_score   ON job_scores(user_id, score DESC);
CREATE INDEX idx_deadlines_user_datetime ON deadlines(user_id, datetime);
CREATE INDEX idx_jobs_active_type        ON jobs(is_active, job_type);

-- ============================================================
-- RLS — enabled on all user-scoped tables
-- jobs and job_sources are intentionally PUBLIC (no RLS)
-- Edge Functions write using service role (bypasses RLS).
-- All Edge Function writes MUST include user_id explicitly.
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own"        ON users        FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_own"     ON profiles     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "job_scores_own"   ON job_scores   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "applications_own" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "email_events_own" ON email_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "deadlines_own"    ON deadlines    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "insights_own"     ON insights     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_own"      ON ai_logs      FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create users row when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
