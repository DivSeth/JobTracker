---
phase: 01-application-profiles-extension-shell
plan: "00"
subsystem: testing
tags: [test-stubs, vitest, wave-0, scaffolding]
dependency_graph:
  requires: []
  provides:
    - test-stubs-PROF-01
    - test-stubs-PROF-02
    - test-stubs-PROF-03
    - test-stubs-PROF-04
    - test-stubs-PROF-05
    - test-stubs-PROF-06
    - test-stubs-EXT-03
    - test-stubs-EXT-05
  affects:
    - all subsequent Phase 1 implementation plans
tech_stack:
  added:
    - vitest (extension workspace)
  patterns:
    - test.todo stubs for pending implementation
    - vi.mock for Supabase server client
    - vi.stubGlobal for chrome API mocks
key_files:
  created:
    - autoapply/apps/web/__tests__/api/profiles/crud.test.ts
    - autoapply/apps/web/__tests__/api/profiles/upload.test.ts
    - autoapply/apps/web/__tests__/api/profiles/duplicate.test.ts
    - autoapply/apps/web/__tests__/lib/types/application-profile.test.ts
    - autoapply/apps/web/__tests__/lib/encryption.test.ts
    - autoapply/apps/extension/vitest.config.ts
    - autoapply/apps/extension/tsconfig.json
    - autoapply/apps/extension/package.json
    - autoapply/apps/extension/__tests__/ats-detection.test.ts
    - autoapply/apps/extension/__tests__/sync.test.ts
  modified: []
decisions:
  - Extension workspace created with vitest node environment (not jsdom) — extension scripts run in Node context, not browser DOM
  - Extension tsconfig added with @ path alias — consistent with web app convention
key_decisions:
  - Extension workspace created as separate npm workspace with vitest node environment
metrics:
  duration: "2 minutes"
  completed: "2026-03-26"
  tasks_completed: 2
  files_created: 10
  files_modified: 0
---

# Phase 01 Plan 00: Wave 0 Test Scaffolding Summary

7 test stub files covering all 11 Phase 1 requirements (PROF-01 through PROF-06, EXT-03, EXT-05) plus extension vitest infrastructure.

## What Was Built

**Web app test stubs (5 files, 38 todo entries):**
- `crud.test.ts` — PROF-01 (profile CRUD) and PROF-04 (default toggle), with Supabase + encryption mocks
- `upload.test.ts` — PROF-03 (resume/cover letter upload, size and type validation)
- `duplicate.test.ts` — PROF-05 (profile deep copy, name generation, file duplication)
- `application-profile.test.ts` — PROF-02 (Workday-parity Zod schema, all field types)
- `encryption.test.ts` — PROF-06 (PII encrypt/decrypt via Supabase RPC)

**Extension test infrastructure (5 files, 15 todo entries):**
- `vitest.config.ts` — node environment, `__tests__/**/*.test.ts` include pattern, `@` path alias
- `tsconfig.json` — TypeScript config with `@` path alias for extension
- `package.json` — extension workspace with vitest dev dependency
- `ats-detection.test.ts` — EXT-03 (Workday detection by DOM selectors + URL, Greenhouse detection)
- `sync.test.ts` — EXT-05 (profile sync, PII stripping, chrome.storage, alarms API)

## Verification

```
Web:       38 todo tests | 0 failures from new stubs | 26 test files discovered
Extension: 15 todo tests | 0 failures | 2 test files discovered
```

Pre-existing failures in web app (6 files, 10 tests) are from unrelated InsightsPage and other tests that were already failing before this plan — out of scope.

## Deviations from Plan

### Auto-applied additions

**1. [Rule 3 - Blocking] Created extension workspace infrastructure**
- **Found during:** Task 2
- **Issue:** Extension app directory did not exist — only `__tests__` dir had been scaffolded. `npm install -D vitest` requires a `package.json`
- **Fix:** Created `package.json` and `tsconfig.json` for the extension workspace alongside the vitest config
- **Files modified:** `autoapply/apps/extension/package.json`, `autoapply/apps/extension/tsconfig.json`
- **Commit:** 69a3694

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4657115 | Web app test stubs for PROF-01 through PROF-06 |
| 2 | 69a3694 | Extension vitest config and test stubs for EXT-03, EXT-05 |

## Known Stubs

All test entries are intentional `test.todo` stubs. These are not implementation stubs — they are the Wave 0 scaffolding designed to be filled in by subsequent implementation plans.

## Self-Check: PASSED
