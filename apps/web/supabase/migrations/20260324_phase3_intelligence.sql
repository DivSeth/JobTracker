-- Phase 3: Intelligence Layer schema additions

-- Gmail columns on profiles (no public.users table exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_history_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gmail_watch_expiry TIMESTAMPTZ;

-- Email processing queue
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gmail_message_id TEXT UNIQUE,
  subject TEXT,
  sender TEXT,
  body_preview TEXT,
  classification JSONB,
  entities JSONB,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_email_queue_user_status ON email_queue(user_id, status);

-- Deadlines extracted from emails
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  is_exact BOOLEAN DEFAULT TRUE,
  raw_text TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deadlines_user ON deadlines(user_id, datetime);

-- AI-generated weekly insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insights JSONB NOT NULL,
  response_rate NUMERIC,
  avg_days_to_response NUMERIC,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- AI call audit log
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  model TEXT NOT NULL,
  step TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON ai_logs(user_id, created_at DESC);

-- RLS policies
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_queue_user_policy ON email_queue
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY deadlines_user_policy ON deadlines
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY insights_user_policy ON insights
  FOR ALL USING (user_id = auth.uid());
