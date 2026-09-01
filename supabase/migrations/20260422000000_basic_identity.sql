-- 20260422000000_basic_identity.sql
-- Phase 02-07: Basic Identity
--
-- Extends `profiles` with country-invariant base identity columns, and adds
-- `user_regional_identities` for per-country identity variants (email, phone,
-- address, work-auth, compensation).

-- ============================================================
-- 1. Extend `profiles` with base identity
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN preferred_first_name TEXT,
  ADD COLUMN pronouns TEXT,
  ADD COLUMN linkedin_url TEXT,
  ADD COLUMN github_url TEXT,
  ADD COLUMN portfolio_url TEXT,
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN willing_to_relocate BOOLEAN DEFAULT FALSE,
  ADD COLUMN work_arrangement_preference TEXT
    CHECK (work_arrangement_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  ADD COLUMN earliest_start_date DATE,
  ADD COLUMN referral_source TEXT;

-- ============================================================
-- 2. Regional identities
-- ============================================================
CREATE TABLE user_regional_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  country_codes TEXT[] NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  email TEXT NOT NULL,
  phone_e164 TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,

  authorized_to_work BOOLEAN,
  needs_sponsorship_now BOOLEAN,
  needs_sponsorship_future BOOLEAN,
  work_auth_status TEXT,
  work_auth_details TEXT,

  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  salary_currency TEXT,
  salary_cadence TEXT CHECK (salary_cadence IN ('annual', 'monthly', 'hourly', 'lpa')),
  current_compensation INTEGER,

  notice_period_weeks INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regional_identities_user ON user_regional_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_regional_identities_default
  ON user_regional_identities(user_id, is_default)
  WHERE is_default = TRUE;

-- One default per user (mirrors application_profiles pattern)
CREATE OR REPLACE FUNCTION ensure_single_default_regional_identity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE user_regional_identities
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_regional_identity
  BEFORE INSERT OR UPDATE ON user_regional_identities
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_regional_identity();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_regional_identity_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_regional_identity_updated
  BEFORE UPDATE ON user_regional_identities
  FOR EACH ROW EXECUTE FUNCTION update_regional_identity_modified();

ALTER TABLE user_regional_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own regional identities"
  ON user_regional_identities FOR ALL
  USING (auth.uid() = user_id);
