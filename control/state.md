# Control State

## Project
AutoApply OS — AI-powered job application platform with ATS auto-fill

## Milestone
v1.0 — 6 phases total

## Current Phase
**Phase 02: Greenhouse Auto-Fill & Tracking** — EXECUTING (final plan)

## Progress
```
Phase 01: Application Profiles + Extension Shell  ████████████ COMPLETE (7/7)
Phase 02: Greenhouse Auto-Fill & Tracking         ██████████░░ IN PROGRESS (5/6)
Phase 03: UI/UX Overhaul                          ░░░░░░░░░░░░ NOT STARTED
Phase 04: Workday Auto-Fill                       ░░░░░░░░░░░░ NOT STARTED
Phase 05: Q&A Intelligence                        ░░░░░░░░░░░░ NOT STARTED
Phase 06: Analytics + Cover Letters + Monetization░░░░░░░░░░░░ NOT STARTED
```

## Phase 02 Plan Status
- [x] 02-00 — Type contracts, Supabase migration, test stubs
- [x] 02-01 — Form scanner, mapper, events, file-upload (GSD SUMMARY created)
- [x] 02-02 — Field-mappings API, track-application API, background worker (GSD SUMMARY created)
- [x] 02-03 — Fill orchestrator + submission detector ✓ tests green
- [x] 02-04 — Shadow DOM preview panel UI ✓ (App.tsx, subcomponents, tests)
- [ ] 02-05 — Tracking sync + submission toast ← **NEXT (Wave 4, checkpoint)**

## Last Action
02-04 complete. Full UI pipeline shipped: PreviewPanel (preview|filling|complete states), MappingRow, UnmappedRow, FillProgressBar, FillResultBanner, component tests. WXT entrypoint conflict resolved — deleted old `greenhouse.content.ts` (detection logic merged into `greenhouse.content/index.tsx`).

## Open Blockers
- `npm run test -w apps/extension` routes through Codex sandbox PATH shim at Node 19 — use direct vitest instead (see test commands below)
- No other blockers

## Test Commands (Codex must use these)
```bash
# Extension tests — run from autoapply/apps/extension:
/Users/divyaanshseth/.nvm/versions/node/v20.20.1/bin/node ../../node_modules/vitest/vitest.mjs run --reporter=verbose

# Or from autoapply/:
npm run test --workspace=apps/extension
# (workspace flag, not -w shorthand, avoids the shim issue)
```
