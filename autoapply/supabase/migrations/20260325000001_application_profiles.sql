-- Enable pgcrypto for field-level encryption (PROF-06)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Application profiles table (many per user, per D-01/D-02/D-03)
CREATE TABLE application_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN DEFAULT FALSE,

  -- Work History (JSONB array)
  experience JSONB DEFAULT '[]',

  -- Education (JSONB array)
  education JSONB DEFAULT '[]',

  -- Skills
  skills TEXT[] DEFAULT '{}',

  -- Certifications (JSONB array)
  certifications JSONB DEFAULT '[]',

  -- Languages (JSONB array)
  languages JSONB DEFAULT '[]',

  -- EEO / Demographics (encrypted with pgcrypto per PROF-06)
  eeo_gender BYTEA,
  eeo_race BYTEA,
  eeo_veteran_status BYTEA,
  eeo_disability_status BYTEA,

  -- Work Authorization (encrypted)
  work_authorization BYTEA,
  sponsorship_required BOOLEAN,

  -- Files (Supabase Storage paths per D-06)
  resume_path TEXT,
  cover_letter_path TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_profiles_user ON application_profiles(user_id);
CREATE INDEX idx_app_profiles_default ON application_profiles(user_id, is_default) WHERE is_default = TRUE;

-- Row Level Security
ALTER TABLE application_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own application profiles"
  ON application_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Ensure only one default profile per user
CREATE OR REPLACE FUNCTION ensure_single_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE application_profiles
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_profile
  BEFORE INSERT OR UPDATE ON application_profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_profile();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_profile_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_profiles_updated
  BEFORE UPDATE ON application_profiles
  FOR EACH ROW EXECUTE FUNCTION update_app_profile_modified();

-- PII encryption helper functions
CREATE OR REPLACE FUNCTION encrypt_pii(val TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(val, encryption_key);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrypt_pii(val BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(val, encryption_key);
$$ LANGUAGE sql;

-- Supabase Storage bucket for resumes and cover letters
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own files
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
