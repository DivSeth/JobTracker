import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  '../../supabase/migrations/20260817000000_knowledge_graph_foundation.sql'
)

const migrationSql = () => readFileSync(migrationPath, 'utf8').toLowerCase()

describe('knowledge graph foundation migration', () => {
  it('creates the evidence, claim, role, artifact, validation, and networking tables', () => {
    const sql = migrationSql()

    for (const table of [
      'evidence_sources',
      'evidence_chunks',
      'professional_claims',
      'claim_entities',
      'claim_relationships',
      'role_archetypes',
      'claim_role_relevance',
      'job_analyses',
      'generated_artifacts',
      'application_answers',
      'validation_results',
      'network_contacts',
      'network_contact_roles',
      'network_interactions',
      'network_alerts',
    ]) {
      expect(sql).toContain(`create table if not exists ${table}`)
    }
  })

  it('enables RLS and user ownership policies on user-scoped knowledge graph tables', () => {
    const sql = migrationSql()

    for (const table of [
      'evidence_sources',
      'professional_claims',
      'job_analyses',
      'generated_artifacts',
      'application_answers',
      'network_contacts',
    ]) {
      expect(sql).toContain(`alter table ${table} enable row level security`)
      expect(sql).toContain(`create policy ${table}_own`)
    }
  })

  it('adds indexes for retrieval, company contact alerts, and application answer reuse', () => {
    const sql = migrationSql()

    expect(sql).toContain('idx_professional_claims_user_category')
    expect(sql).toContain('idx_claim_role_relevance_claim')
    expect(sql).toContain('idx_job_analyses_user_job')
    expect(sql).toContain('idx_network_contact_roles_company')
    expect(sql).toContain('idx_application_answers_user_question_hash')
  })
})
