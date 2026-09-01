-- Phase 2: ATS field mapping configuration table
CREATE TABLE ats_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  mappings JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, version)
);

-- RLS: readable by any authenticated user (global config, not user data)
ALTER TABLE ats_field_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ats_field_mappings_read" ON ats_field_mappings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add apply_url column to applications for dedup (per D-06)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS apply_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_user_apply_url
  ON applications (user_id, apply_url) WHERE apply_url IS NOT NULL;

-- Seed default Greenhouse field mappings (per D-09, MAP-03)
INSERT INTO ats_field_mappings (platform, version, mappings) VALUES (
  'greenhouse', 1, '[
    {"field_pattern": "first_name", "profile_path": "details.full_name", "source": "user_profile", "transform": "first_name"},
    {"field_pattern": "last_name", "profile_path": "details.full_name", "source": "user_profile", "transform": "last_name"},
    {"field_pattern": "email", "profile_path": "email", "source": "user_profile"},
    {"field_pattern": "phone", "profile_path": "details.phone", "source": "user_profile"},
    {"field_pattern": "resume", "profile_path": "resume_path", "source": "application_profile", "transform": "file_upload"},
    {"field_pattern": "cover_letter", "profile_path": "cover_letter_path", "source": "application_profile", "transform": "file_upload"},
    {"field_pattern": "linkedin|portfolio|website|url", "profile_path": "details.portfolio_url", "source": "user_profile"},
    {"field_pattern": "school", "profile_path": "education[0].school", "source": "application_profile"},
    {"field_pattern": "degree", "profile_path": "education[0].degree", "source": "application_profile"},
    {"field_pattern": "discipline|major|field_of_study", "profile_path": "education[0].major", "source": "application_profile"},
    {"field_pattern": "company", "profile_path": "experience[0].company", "source": "application_profile"},
    {"field_pattern": "title|position|role", "profile_path": "experience[0].role", "source": "application_profile"},
    {"field_pattern": "work_authorization|authorized|legally", "profile_path": "work_authorization", "source": "application_profile"},
    {"field_pattern": "sponsor", "profile_path": "sponsorship_required", "source": "application_profile"},
    {"field_pattern": "gender", "profile_path": "eeo_gender", "source": "application_profile"},
    {"field_pattern": "race|ethnicity", "profile_path": "eeo_race", "source": "application_profile"},
    {"field_pattern": "veteran", "profile_path": "eeo_veteran_status", "source": "application_profile"},
    {"field_pattern": "disability", "profile_path": "eeo_disability_status", "source": "application_profile"},
    {"field_pattern": "location|city|address", "profile_path": "details.location", "source": "user_profile"}
  ]'::jsonb
);
