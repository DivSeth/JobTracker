---
phase: 2
slug: greenhouse-auto-fill-tracking
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `autoapply/apps/extension/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=autoapply/apps/extension` |
| **Full suite command** | `npm run test --workspace=autoapply/apps/extension && npm run test --workspace=autoapply/apps/web` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=autoapply/apps/extension`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | GH-01 | unit | `cd autoapply/apps/extension && npx vitest run lib/greenhouse/scanner.test.ts lib/greenhouse/mapper.test.ts --reporter=verbose` | W0: `autoapply/apps/extension/lib/greenhouse/scanner.test.ts` | ⬜ pending |
| 02-01-02 | 01 | 1 | MAP-01 | unit | `cd autoapply/apps/extension && npx vitest run lib/form-fill/events.test.ts lib/form-fill/file-upload.test.ts --reporter=verbose` | W0: `autoapply/apps/extension/lib/greenhouse/mapper.test.ts` | ⬜ pending |
| 02-02-01 | 02 | 1 | MAP-03 | unit | `cd autoapply/apps/web && npx vitest run __tests__/api/extension/ --reporter=verbose` | W0: `autoapply/apps/web/__tests__/api/extension/field-mappings.test.ts` | ⬜ pending |
| 02-02-02 | 02 | 1 | SYNC-01 | unit | `cd autoapply/apps/web && npx vitest run __tests__/api/extension/track-application.test.ts --reporter=verbose` | W0: `autoapply/apps/web/__tests__/api/extension/track-application.test.ts` | ⬜ pending |
| 02-03-01 | 03 | 2 | GH-03 | unit | `cd autoapply/apps/extension && npx vitest run lib/greenhouse/filler.test.ts --reporter=verbose` | W0: `autoapply/apps/extension/lib/greenhouse/filler.test.ts` | ⬜ pending |
| 02-03-02 | 03 | 2 | SYNC-02 | unit | `cd autoapply/apps/extension && npx vitest run lib/greenhouse/detector.test.ts --reporter=verbose` | W0: `autoapply/apps/extension/lib/greenhouse/detector.test.ts` | ⬜ pending |
| 02-04-01 | 04 | 3 | MAP-01 | component | `cd autoapply/apps/extension && npx vitest run entrypoints/greenhouse.content/ --reporter=verbose` | W0: `autoapply/apps/extension/entrypoints/greenhouse.content/App.test.tsx` | ⬜ pending |
| 02-04-02 | 04 | 3 | MAP-02 | component | `cd autoapply/apps/extension && npx vitest run entrypoints/greenhouse.content/components.test.tsx --reporter=verbose` | W0: `autoapply/apps/extension/entrypoints/greenhouse.content/components.test.tsx` | ⬜ pending |
| 02-05-01 | 05 | 4 | SYNC-01 | integration | `cd autoapply/apps/extension && npx vitest run entrypoints/greenhouse.content/ --reporter=verbose` | W0: `autoapply/apps/extension/entrypoints/greenhouse.content/App.test.tsx` | ⬜ pending |
| 02-05-02 | 05 | 4 | E2E | manual | `cd autoapply/apps/extension && npm run build` | N/A (checkpoint) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `autoapply/apps/extension/lib/greenhouse/scanner.test.ts` — stubs for GH-01
- [x] `autoapply/apps/extension/lib/greenhouse/mapper.test.ts` — stubs for MAP-01, MAP-02
- [x] `autoapply/apps/extension/lib/greenhouse/filler.test.ts` — stubs for GH-02, GH-03
- [x] `autoapply/apps/extension/lib/greenhouse/detector.test.ts` — stubs for SYNC-02
- [x] `autoapply/apps/extension/lib/form-fill/events.test.ts` — stubs for GH-01
- [x] `autoapply/apps/extension/lib/form-fill/file-upload.test.ts` — stubs for GH-02
- [x] `autoapply/apps/web/__tests__/api/extension/track-application.test.ts` — stubs for SYNC-01, SYNC-03
- [x] `autoapply/apps/web/__tests__/api/extension/field-mappings.test.ts` — stubs for MAP-03
- [x] `autoapply/apps/extension/entrypoints/greenhouse.content/App.test.tsx` — stubs for MAP-01, MAP-02
- [x] `autoapply/apps/extension/entrypoints/greenhouse.content/components.test.tsx` — stubs for MAP-01, GH-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shadow DOM preview renders on live Greenhouse page | MAP-01 | Requires real Chrome extension + live Greenhouse job URL | Load extension in dev mode, navigate to a Greenhouse hosted job, click Apply, verify field mapping panel appears |
| File upload (resume/cover letter) fills correctly | GH-04 | File input via DataTransfer API can't be simulated in jsdom | Load extension, click Apply, verify resume/cover letter file inputs populate |
| Submission detection fires on confirmation page | GH-03 | Requires real Greenhouse form submission flow | Complete a test application, verify dashboard shows "Submitted" status |
| Application auto-created in Kanban after fill | SYNC-01 | Requires full extension + API integration | Submit via extension, check dashboard Kanban for new application card |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
