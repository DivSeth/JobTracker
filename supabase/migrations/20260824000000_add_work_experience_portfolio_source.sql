ALTER TABLE evidence_sources
  DROP CONSTRAINT IF EXISTS evidence_sources_source_type_check;

ALTER TABLE evidence_sources
  ADD CONSTRAINT evidence_sources_source_type_check
  CHECK (source_type IN (
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
  ));
