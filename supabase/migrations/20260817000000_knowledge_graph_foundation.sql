-- Phase 1: Evidence Vault, Claim Store, Artifact Tracking, and Networking Graph

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Evidence Vault
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'resume',
    'work_experience_portfolio',
    'cover_letter',
    'project_note',
    'application_answer',
    'chatgpt_export',
    'linkedin',
    'github',
    'manual_note',
    'other'
  )),
  title TEXT NOT NULL,
  source_date DATE,
  storage_path TEXT,
  original_url TEXT,
  raw_text TEXT,
  content_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_source_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  token_count INTEGER CHECK (token_count IS NULL OR token_count >= 0),
  embedding vector(512),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evidence_source_id, chunk_index)
);

-- ============================================================
-- Claim Store / Knowledge Graph
-- ============================================================
CREATE TABLE IF NOT EXISTS professional_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'backend',
    'distributed_systems',
    'reliability',
    'cloud',
    'full_stack',
    'frontend',
    'product',
    'ai_ml',
    'retrieval',
    'data',
    'quant',
    'systems',
    'consulting',
    'leadership',
    'other'
  )),
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('low', 'medium', 'high')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  resume_usable BOOLEAN DEFAULT TRUE,
  best_role_archetypes TEXT[] DEFAULT '{}',
  do_not_overclaim TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'archived')),
  embedding vector(512),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_claim_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES professional_claims(id) ON DELETE CASCADE,
  evidence_source_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
  evidence_chunk_id UUID REFERENCES evidence_chunks(id) ON DELETE SET NULL,
  support_level TEXT DEFAULT 'supports' CHECK (support_level IN ('supports', 'partial', 'contradicts')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(claim_id, evidence_source_id, evidence_chunk_id)
);

CREATE TABLE IF NOT EXISTS claim_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'company',
    'project',
    'technology',
    'skill',
    'metric',
    'domain',
    'role',
    'credential',
    'person',
    'other'
  )),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, normalized_name)
);

CREATE TABLE IF NOT EXISTS claim_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES professional_claims(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES claim_entities(id) ON DELETE CASCADE,
  related_claim_id UUID REFERENCES professional_claims(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  weight NUMERIC DEFAULT 1 CHECK (weight >= 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (entity_id IS NOT NULL OR related_claim_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS role_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  default_strategy JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_role_relevance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES professional_claims(id) ON DELETE CASCADE,
  role_archetype_id UUID NOT NULL REFERENCES role_archetypes(id) ON DELETE CASCADE,
  relevance_score NUMERIC NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(claim_id, role_archetype_id)
);

-- ============================================================
-- Job Analysis, Generated Artifacts, Answers, and Validation
-- ============================================================
CREATE TABLE IF NOT EXISTS job_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  apply_url TEXT,
  company_name TEXT,
  normalized_company TEXT,
  title TEXT,
  role_archetype_id UUID REFERENCES role_archetypes(id) ON DELETE SET NULL,
  seniority TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  requirements JSONB DEFAULT '[]',
  hidden_priorities JSONB DEFAULT '[]',
  strategy JSONB DEFAULT '{}',
  fit_score NUMERIC CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 1)),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  job_analysis_id UUID REFERENCES job_analyses(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'resume_tex',
    'resume_pdf',
    'cover_letter',
    'short_answer',
    'fill_plan',
    'outreach_draft'
  )),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'approved', 'rejected', 'archived')),
  content TEXT,
  storage_path TEXT,
  prompt_version TEXT,
  model TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  job_analysis_id UUID REFERENCES job_analyses(id) ON DELETE SET NULL,
  artifact_id UUID REFERENCES generated_artifacts(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  answer_source TEXT DEFAULT 'generated' CHECK (answer_source IN ('profile', 'claim', 'generated', 'manual')),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'needs_review', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES generated_artifacts(id) ON DELETE CASCADE,
  application_answer_id UUID REFERENCES application_answers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES professional_claims(id) ON DELETE SET NULL,
  validation_type TEXT NOT NULL CHECK (validation_type IN (
    'claim_support',
    'overclaim',
    'metric_support',
    'citation',
    'pii',
    'policy',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'blocking')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'needs_review', 'blocked')),
  message TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (artifact_id IS NOT NULL OR application_answer_id IS NOT NULL)
);

-- ============================================================
-- Networking Graph
-- ============================================================
CREATE TABLE IF NOT EXISTS network_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  primary_email TEXT,
  phone_e164 TEXT,
  linkedin_url TEXT,
  relationship_strength TEXT DEFAULT 'unknown' CHECK (relationship_strength IN ('weak', 'warm', 'strong', 'unknown')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (primary_email IS NOT NULL OR phone_e164 IS NOT NULL OR linkedin_url IS NOT NULL OR notes IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS network_contact_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES network_contacts(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  normalized_company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  seniority TEXT DEFAULT 'unknown' CHECK (seniority IN (
    'student',
    'junior',
    'mid',
    'senior',
    'staff_plus',
    'manager',
    'director_plus',
    'recruiter',
    'unknown'
  )),
  is_current BOOLEAN DEFAULT TRUE,
  referral_ok BOOLEAN DEFAULT FALSE,
  reminder_preference TEXT DEFAULT 'before_applying' CHECK (reminder_preference IN (
    'before_applying',
    'after_applying',
    'only_if_high_fit',
    'never'
  )),
  started_on DATE,
  ended_on DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES network_contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'met',
    'email',
    'call',
    'message',
    'referral',
    'other'
  )),
  occurred_on DATE,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_analysis_id UUID REFERENCES job_analyses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES network_contacts(id) ON DELETE CASCADE,
  contact_role_id UUID REFERENCES network_contact_roles(id) ON DELETE SET NULL,
  alert_type TEXT DEFAULT 'company_match' CHECK (alert_type IN ('company_match', 'team_match', 'recruiter_match')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'messaged', 'snoozed')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_evidence_sources_user_type ON evidence_sources(user_id, source_type);
CREATE INDEX IF NOT EXISTS idx_evidence_chunks_source ON evidence_chunks(evidence_source_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_professional_claims_user_category ON professional_claims(user_id, category, status);
CREATE INDEX IF NOT EXISTS idx_professional_claim_evidence_claim ON professional_claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_relationships_claim ON claim_relationships(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_role_relevance_claim ON claim_role_relevance(claim_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user_job ON job_analyses(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user_company ON job_analyses(user_id, normalized_company);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_user_job_analysis ON generated_artifacts(user_id, job_analysis_id);
CREATE INDEX IF NOT EXISTS idx_application_answers_user_question_hash ON application_answers(user_id, question_hash);
CREATE INDEX IF NOT EXISTS idx_validation_results_artifact ON validation_results(artifact_id, severity);
CREATE INDEX IF NOT EXISTS idx_network_contacts_user_name ON network_contacts(user_id, full_name);
CREATE INDEX IF NOT EXISTS idx_network_contact_roles_company ON network_contact_roles(user_id, normalized_company);
CREATE INDEX IF NOT EXISTS idx_network_alerts_user_status ON network_alerts(user_id, status, created_at DESC);

-- Vector indexes are intentionally deferred until we have enough rows to tune lists/probes.

-- ============================================================
-- Seed role archetypes
-- ============================================================
INSERT INTO role_archetypes (key, label, description)
VALUES
  ('backend', 'Backend SWE', 'Backend, distributed systems, APIs, reliability, and cloud services.'),
  ('full_stack', 'Full-Stack / Product Engineer', 'End-to-end product engineering across frontend, backend, and user workflows.'),
  ('frontend', 'Frontend Engineer', 'Client-side product, UI systems, accessibility, and web performance.'),
  ('ai_ml', 'AI / ML Engineer', 'Applied AI, ML, data, retrieval, evaluation, and model-powered product work.'),
  ('ai_platform', 'AI Platform Engineer', 'Infrastructure and systems for model-backed applications, retrieval, evals, and deployment.'),
  ('quant_swe', 'Quant / C++ SWE', 'Low-level systems, C++, performance, matching engines, and trading-adjacent engineering.'),
  ('sre_infra', 'SRE / Infrastructure', 'Reliability, operations, observability, cloud infrastructure, and production hardening.'),
  ('consulting', 'Consulting / Business Analyst', 'Client-facing analysis, delivery, stakeholder management, and business framing.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_role_relevance ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_contact_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_sources_own ON evidence_sources
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY evidence_chunks_own ON evidence_chunks
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY professional_claims_own ON professional_claims
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY professional_claim_evidence_own ON professional_claim_evidence
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY claim_entities_own ON claim_entities
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY claim_relationships_own ON claim_relationships
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY claim_role_relevance_own ON claim_role_relevance
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY job_analyses_own ON job_analyses
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY generated_artifacts_own ON generated_artifacts
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY application_answers_own ON application_answers
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY validation_results_own ON validation_results
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY network_contacts_own ON network_contacts
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY network_contact_roles_own ON network_contact_roles
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY network_interactions_own ON network_interactions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY network_alerts_own ON network_alerts
  FOR ALL USING (user_id = auth.uid());
