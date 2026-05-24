-- 20260524000000_profiles_autofill_redesign.sql
-- Move EEO from application_profiles → user_regional_identities.
-- Add default_profile_id to user_regional_identities.
-- Drop preferences from profiles.

-- 1. Add EEO + default_profile_id to regional identities
ALTER TABLE user_regional_identities
  ADD COLUMN IF NOT EXISTS eeo_gender TEXT,
  ADD COLUMN IF NOT EXISTS eeo_race TEXT,
  ADD COLUMN IF NOT EXISTS eeo_veteran_status TEXT,
  ADD COLUMN IF NOT EXISTS eeo_disability_status TEXT,
  ADD COLUMN IF NOT EXISTS default_profile_id UUID
    REFERENCES application_profiles(id) ON DELETE SET NULL;

-- 1a. Add index on default_profile_id for query performance
CREATE INDEX IF NOT EXISTS idx_user_regional_identities_default_profile_id
  ON user_regional_identities(default_profile_id);

-- 2. Migrate existing EEO data before dropping source columns
-- Pass 1: Migrate EEO into the is_default regional identity (if exists)
UPDATE user_regional_identities uri
SET
  eeo_gender            = ap.eeo_gender,
  eeo_race              = ap.eeo_race,
  eeo_veteran_status    = ap.eeo_veteran_status,
  eeo_disability_status = ap.eeo_disability_status
FROM (
  SELECT DISTINCT ON (user_id) user_id, eeo_gender, eeo_race, eeo_veteran_status, eeo_disability_status
  FROM application_profiles
  WHERE eeo_gender IS NOT NULL OR eeo_race IS NOT NULL
     OR eeo_veteran_status IS NOT NULL OR eeo_disability_status IS NOT NULL
  ORDER BY user_id, is_default DESC
) ap
WHERE ap.user_id = uri.user_id
  AND uri.is_default = true;

-- Pass 2: For users where no is_default = true regional row was updated, migrate EEO into any of their regional identities
UPDATE user_regional_identities uri
SET
  eeo_gender            = ap.eeo_gender,
  eeo_race              = ap.eeo_race,
  eeo_veteran_status    = ap.eeo_veteran_status,
  eeo_disability_status = ap.eeo_disability_status
FROM (
  SELECT DISTINCT ON (user_id) user_id, eeo_gender, eeo_race, eeo_veteran_status, eeo_disability_status
  FROM application_profiles
  WHERE eeo_gender IS NOT NULL OR eeo_race IS NOT NULL
     OR eeo_veteran_status IS NOT NULL OR eeo_disability_status IS NOT NULL
  ORDER BY user_id, is_default DESC
) ap
WHERE ap.user_id = uri.user_id
  AND uri.eeo_gender IS NULL  -- not already migrated
  AND uri.id = (
    SELECT id FROM user_regional_identities WHERE user_id = uri.user_id ORDER BY created_at ASC LIMIT 1
  );

-- 3. Remove EEO + work auth columns from application_profiles
ALTER TABLE application_profiles
  DROP COLUMN IF EXISTS eeo_gender,
  DROP COLUMN IF EXISTS eeo_race,
  DROP COLUMN IF EXISTS eeo_veteran_status,
  DROP COLUMN IF EXISTS eeo_disability_status,
  DROP COLUMN IF EXISTS work_authorization,
  DROP COLUMN IF EXISTS sponsorship_required;

-- 4. Remove preferences from profiles (salary lives in regional, job_types unused)
ALTER TABLE profiles
  DROP COLUMN IF EXISTS preferences;
