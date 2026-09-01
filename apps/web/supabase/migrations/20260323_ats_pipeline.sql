-- Companies registry
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ats_platform, slug)
);

CREATE INDEX idx_companies_active_platform ON companies(is_active, ats_platform);

-- Jobs table additions
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ats_job_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS normalized_key TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_platform TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing jobs
UPDATE jobs SET source_platform = 'github' WHERE source_id IS NOT NULL AND source_platform IS NULL;

-- Make source_id nullable
ALTER TABLE jobs ALTER COLUMN source_id DROP NOT NULL;

-- Dedup index
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_normalized_key ON jobs(normalized_key) WHERE normalized_key IS NOT NULL;

-- Staleness index
CREATE INDEX IF NOT EXISTS idx_jobs_company_active ON jobs(company_id, is_active) WHERE company_id IS NOT NULL;
