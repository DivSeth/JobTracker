---
phase: 02-greenhouse-auto-fill-tracking
plan: 00
subsystem: greenhouse-auto-fill
tags: [types, migration, test-stubs, wave-0]
dependency_graph:
  requires: [01-application-profiles-extension-shell]
  provides: [greenhouse-types, ats-field-mappings-table, apply-url-column, wave-0-test-stubs]
  affects: [02-01, 02-02, 02-03, 02-04, 02-05]
tech_stack:
  added: []
  patterns: [type-first-contracts, wave-0-test-stubs]
key_files:
  created:
    - autoapply/apps/extension/lib/greenhouse/types.ts
    - autoapply/supabase/migrations/20260330000001_ats_field_mappings.sql
    - autoapply/apps/extension/lib/greenhouse/scanner.test.ts
    - autoapply/apps/extension/lib/greenhouse/mapper.test.ts
    - autoapply/apps/extension/lib/greenhouse/filler.test.ts
    - autoapply/apps/extension/lib/greenhouse/detector.test.ts
    - autoapply/apps/extension/lib/form-fill/events.test.ts
    - autoapply/apps/extension/lib/form-fill/file-upload.test.ts
    - autoapply/apps/web/__tests__/api/extension/track-application.test.ts
    - autoapply/apps/web/__tests__/api/extension/field-mappings.test.ts
    - autoapply/apps/extension/entrypoints/greenhouse.content/App.test.tsx
    - autoapply/apps/extension/entrypoints/greenhouse.content/components.test.tsx
  modified:
    - autoapply/apps/extension/vitest.config.ts
decisions:
  - Expanded extension vitest include patterns to discover lib/ and entrypoints/ test files
metrics:
  duration_seconds: 214
  completed: "2026-03-31T02:04:41Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 12
  files_modified: 1
---

# Phase 02 Plan 00: Wave 0 Type Contracts, Migration & Test Stubs Summary

Type-first contracts defining all Greenhouse auto-fill interfaces, Supabase migration for ats_field_mappings table with 19 seed mapping rules, and 10 test stub files with 91 it.todo() placeholders covering all Phase 2 requirement IDs.

## What Was Done

### Task 1: Type contracts + Supabase migration (42746a3)

Created `autoapply/apps/extension/lib/greenhouse/types.ts` exporting 9 type definitions that establish contracts for all downstream Phase 2 plans:
- GreenhouseField, FieldMappingRule, FieldMappingConfig - form scanning and mapping config
- MappedField - profile-to-field mapping result with isMasked flag for PII
- FillStatus, FillFieldResult, FillResult - fill operation tracking
- TrackApplicationPayload - extension-to-web tracking payload
- UserIdentity - non-PII user fields for chrome.storage.local

Created `autoapply/supabase/migrations/20260330000001_ats_field_mappings.sql`:
- CREATE TABLE ats_field_mappings with platform, version, JSONB mappings, RLS policy
- ALTER TABLE applications ADD COLUMN apply_url with partial unique index for dedup
- INSERT seed data: 19 Greenhouse field mapping rules covering name, email, phone, resume, cover letter, LinkedIn, education, experience, EEO, work authorization, and location

### Task 2: Wave 0 test stubs (aec27a6)

Created 10 test stub files with 91 it.todo() placeholders:
- 4 extension lib/greenhouse tests: scanner (9), mapper (10), filler (7), detector (7)
- 2 extension lib/form-fill tests: events (6), file-upload (4)
- 2 web API tests: track-application (11), field-mappings (4)
- 2 extension UI tests: App.test.tsx PreviewPanel (8), components.test.tsx MappingRow/UnmappedRow/FillProgressBar/FillResultBanner (10)

Updated extension vitest.config.ts include patterns to discover tests in lib/ and entrypoints/ directories.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended vitest include patterns for test discovery**
- **Found during:** Task 2
- **Issue:** Extension vitest.config.ts only included `__tests__/**/*.test.ts`, so test stubs in `lib/` and `entrypoints/` would not be discovered
- **Fix:** Added `lib/**/*.test.ts` and `entrypoints/**/*.test.{ts,tsx}` to the include array
- **Files modified:** autoapply/apps/extension/vitest.config.ts
- **Commit:** aec27a6

## Verification Results

- 8 exported interfaces in types.ts
- 4 greenhouse test files, 2 form-fill test files, 2 web API test files, 2 UI test files
- Migration file exists with CREATE TABLE, apply_url column, seed data
- vitest discovers all 10 extension test files (76 todos) and 2 web test files (15 todos)
- Zero test failures (all stubs use it.todo)

## Known Stubs

None - this plan intentionally creates test stubs (it.todo) that will be implemented by downstream plans 02-01 through 02-05.

## Self-Check: PASSED
