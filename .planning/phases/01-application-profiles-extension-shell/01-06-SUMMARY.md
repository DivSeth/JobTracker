---
phase: 01-application-profiles-extension-shell
plan: "06"
subsystem: profiles
tags: [ai-parsing, resume, gemini, two-step-flow, pdf-parse]
dependency_graph:
  requires: [01-01, 01-02, 01-04]
  provides: [resume-ai-parse-endpoint, resume-parser-component, two-step-parse-flow]
  affects: [ApplicationProfileForm, ResumeUploader]
tech_stack:
  added: [pdf-parse, "@types/pdf-parse"]
  patterns: [two-step-review-flow, gemini-structured-extraction, cjs-esm-compat-import]
key_files:
  created:
    - autoapply/apps/web/app/api/profiles/[id]/parse-resume/route.ts
    - autoapply/apps/web/components/profiles/ResumeParser.tsx
  modified:
    - autoapply/apps/web/components/profiles/ResumeUploader.tsx
    - autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx
    - autoapply/apps/web/package.json
decisions:
  - "pdf-parse CJS compat: imported as `import * as pdfParseModule` with runtime fallback for .default — avoids TS1192 no-default-export error"
  - "ResumeParser renders above the Tabs in ApplicationProfileForm — visible without requiring tab switch"
  - "Parse failure after upload shows error but keeps the file — upload and parse are independent operations"
metrics:
  duration_seconds: 1664
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 3
  files_created: 2
  files_modified: 3
requirements:
  - PROF-03
---

# Phase 01 Plan 06: Resume AI Parsing Two-Step Flow Summary

Resume AI parsing with Gemini extraction — PDF upload triggers structured data extraction, shown in editable review panel before populating the profile form (D-05 compliance).

## What Was Built

### Task 1: POST /api/profiles/[id]/parse-resume

New API route that implements the "parse" step of D-05's two-step flow:

- Accepts both `multipart/form-data` (direct file upload) and JSON body with `resume_path` (for re-parsing an already-uploaded file)
- Extracts text from PDF buffer using `pdf-parse` (CJS/ESM compat import pattern)
- Returns 422 if extracted text < 50 characters (image-based or corrupted PDF)
- Builds structured extraction prompt and calls `callGemini` with `parseGeminiJSON`
- Extracts: `experience[]`, `education[]`, `skills[]`, `certifications[]`, `languages[]`
- Returns 500 with user-friendly error on Gemini failure: "Resume parsing failed. Try uploading a different file, or fill in your details manually."
- Success: `{ data: ResumeParseResult, tokens: { input, output } }`

### Task 2: ResumeParser Component + Two-Step Flow Wiring

**ResumeParser.tsx** — editable extraction preview component:
- Heading: "Review Extracted Data" (exact UI-SPEC.md copywriting)
- Subtext: "We extracted the following from your resume. Review and correct any fields before saving."
- Editable sections for all 5 data types: experience (with employment type select, start/end month inputs, current checkbox, bullets textarea), education, skills (TagInput), certifications, languages
- Add/remove buttons for each section
- Bottom actions: "Apply to Profile" (calls `onApply`) and "Dismiss" (calls `onDismiss`)
- All edits are local state only — data flows to parent only on "Apply to Profile"

**ResumeUploader.tsx** — updated with parse integration:
- New `onParseComplete?: (data: ResumeParseData) => void` prop
- After resume upload succeeds, automatically calls `/api/profiles/[id]/parse-resume` with `{ resume_path }`
- Shows `'parsing'` state with "Parsing resume..." + spinner between upload and parse completion
- On parse success: calls `onParseComplete(data)` for parent to show ResumeParser
- On parse failure: shows error message but keeps the uploaded file (upload and parse are independent)

**ApplicationProfileForm.tsx** — wired to complete the D-05 flow:
- New `parsedData: ResumeParseData | null` state
- Renders `<ResumeParser>` panel above the Tabs when `parsedData !== null`
- `handleApplyParsedData`: merges all 5 fields into form state and sets `isDirty = true`
- `onDismiss` closes the preview without applying data
- Passes `onParseComplete={setParsedData}` to `<ResumeUploader>`

## Deviations from Plan

### Rule 3 (Auto-fix blocking) — Missing Plan 01-04 Task 2 artifacts

Plan 01-06 depends on `ResumeUploader.tsx`, `ApplicationProfileForm.tsx`, and `profiles/[id]/page.tsx` from Plan 01-04 Task 2. These were found as untracked (unstaged) files in the repo, created by a parallel agent running Plan 01-04. They were committed as part of Task 2's commit in this plan.

**Files staged in Task 2 commit (as dependency resolution):**
- `autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx` (baseline from 01-04)
- `autoapply/apps/web/components/profiles/ResumeUploader.tsx` (baseline + 01-06 parse integration)
- `autoapply/apps/web/app/(dashboard)/profiles/[id]/page.tsx` (from 01-04, was untracked)

**Note:** The `profiles/[id]/page.tsx` was already committed by another agent in `feat(01-04)` — git showed it as untracked in the worktree but the main branch had it.

### Rule 1 (Auto-fix bug) — pdf-parse has no default export

`pdf-parse` is a CommonJS module and TypeScript reported `error TS1192: Module has no default export`. Fixed by importing as `import * as pdfParseModule` with a runtime fallback:
```typescript
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
```

## Known Stubs

None — the parse endpoint calls Gemini, ResumeParser fully populates from extracted data, and "Apply to Profile" merges data into form state. The full D-05 flow is wired end-to-end.

## Checkpoint: Task 3 — Human Verification Required

Task 3 is a `checkpoint:human-verify` requiring end-to-end manual testing of the two-step flow. Execution is paused here.

**What to verify:**
1. Start dev server: `cd autoapply/apps/web && npm run dev`
2. Navigate to a profile edit page: http://localhost:3000/profiles/[any-id]
3. Go to Documents tab, upload a PDF resume
4. Verify "Parsing resume..." spinner appears after upload
5. Verify "Review Extracted Data" panel appears with editable fields
6. Correct a field, click "Apply to Profile"
7. Verify Experience, Education, Skills tabs populate with corrected data
8. Verify Save Profile button is enabled (isDirty = true)
9. Optional: click "Dismiss" — verify preview closes without applying

## Self-Check

- [x] `autoapply/apps/web/app/api/profiles/[id]/parse-resume/route.ts` — EXISTS
- [x] `autoapply/apps/web/components/profiles/ResumeParser.tsx` — EXISTS
- [x] `autoapply/apps/web/components/profiles/ResumeUploader.tsx` — EXISTS (updated)
- [x] `autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx` — EXISTS (updated)
- [x] Task 1 commit: `a5d9e0f`
- [x] Task 2 commit: `fd3285d`
- [x] TypeScript: no errors in new files (pre-existing errors in other routes unrelated to this plan)
- [x] `pdf-parse` in package.json dependencies

## Self-Check: PASSED
