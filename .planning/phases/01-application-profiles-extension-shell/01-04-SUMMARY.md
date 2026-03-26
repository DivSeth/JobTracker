---
phase: 01-application-profiles-extension-shell
plan: 04
subsystem: ui
tags: [react, next.js, supabase, tailwind, shadcn, tabs, file-upload]

requires:
  - phase: 01-01
    provides: ApplicationProfile type definitions, Supabase migration with application_profiles table
  - phase: 01-02
    provides: API routes for profile CRUD, duplicate, upload endpoints

provides:
  - Profile list page at /profiles with card grid, empty state, and create CTA
  - ProfileCard component with default star toggle, three-dot menu, delete confirmation
  - ApplicationProfileForm with 5-tab layout covering all Workday-parity fields
  - ResumeUploader with drag-and-drop, PDF validation, and upload progress
  - Sidebar updated with App Profiles nav item

affects:
  - extension popup (consumes profiles created here)
  - Phase 4 Workday auto-fill (relies on ApplicationProfile structure)

tech-stack:
  added: []
  patterns:
    - Server component fetches application_profiles directly via Supabase, passes list to client ProfileListClient
    - ProfileListClient handles CRUD actions (PATCH/POST/DELETE) with router.refresh() for revalidation
    - ApplicationProfileForm uses isDirty state pattern — Save button disabled until edits made
    - Zod validation on save with per-tab error dot indicators
    - ResumeUploader uses FormData POST to /api/profiles/[id]/upload with drag-and-drop and click-to-select

key-files:
  created:
    - autoapply/apps/web/app/(dashboard)/profiles/page.tsx
    - autoapply/apps/web/app/(dashboard)/profiles/[id]/page.tsx
    - autoapply/apps/web/components/profiles/ProfileCard.tsx
    - autoapply/apps/web/components/profiles/ProfileListClient.tsx
    - autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx
    - autoapply/apps/web/components/profiles/ResumeUploader.tsx
  modified:
    - autoapply/apps/web/components/layout/Sidebar.tsx

key-decisions:
  - "ProfileListClient wraps ProfileCard grid client-side to handle PATCH/duplicate/delete while keeping parent page as server component"
  - "Delete confirmation uses inline dialog state (not a separate shadcn Dialog) to avoid adding new component dependency"
  - "Profile edit page handles 'new' case by inserting empty profile server-side then redirecting — avoids client-side creation race conditions"

patterns-established:
  - "Server-component list page + client-component action wrapper pattern for profile management"
  - "5-tab form layout for ApplicationProfile: Experience, Education, Skills & Certs, EEO & Authorization, Documents"

requirements-completed:
  - PROF-05

duration: 29min
completed: 2026-03-26
---

# Phase 01 Plan 04: Profile Management UI Summary

**Built profile management UI with list page, 5-tab edit form, resume uploader, and ProfileCard component with default toggle, duplicate, and delete actions wired to API routes from Plan 02.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-03-26T06:05:47Z
- **Completed:** 2026-03-26T06:34:33Z
- **Tasks:** 2/3 (Task 3 is checkpoint:human-verify — awaiting user approval)
- **Files modified:** 7

## Accomplishments

### Task 1: Profile list page and ProfileCard (fb51121)

- `ProfileCard` component with 4px left indicator strip (primary for default, outline-variant for others), star toggle with proper `aria-label`, three-dot overflow menu with duplicate/delete, field completion indicator (filled/total)
- `ProfileListClient` client wrapper handles PATCH (set default), POST (duplicate), DELETE with confirmation dialog
- Profile list page at `/profiles` queries `application_profiles` table server-side, shows grid or empty state ("No profiles yet")
- Sidebar updated with `App Profiles` nav item using `Users` icon from lucide-react

### Task 2: Profile edit page, ApplicationProfileForm, ResumeUploader (e82d69a)

- `ApplicationProfileForm` with shadcn `Tabs` component, 5 tabs: Experience, Education, Skills & Certs, EEO & Authorization, Documents
- Experience tab: add/remove entries, employment type select, start/end month pickers with "Current" checkbox, bullet textarea
- Education tab: school/degree/major/GPA/graduation year with add/remove
- Skills & Certs tab: TagInput for skills (reuses existing component), certifications list, languages with proficiency select
- EEO & Authorization tab: all EEOC select fields with encryption note, work authorization select, sponsorship checkbox
- Documents tab: renders ResumeUploader
- Form saves via `PATCH /api/profiles/[id]` with Zod validation, dirty state tracking, red dot tab error indicators
- `ResumeUploader`: drag-and-drop + click-to-select, PDF/5MB validation, upload progress state, success display with Replace button, error messages per UI-SPEC.md copywriting
- Profile edit page (`/profiles/[id]`) handles "new" by inserting empty profile and redirecting

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All form state is wired to the `ApplicationProfile` type. The save action calls real PATCH API endpoint. Upload calls real POST endpoint. The list page fetches real data from Supabase.

## Self-Check

- [x] `autoapply/apps/web/app/(dashboard)/profiles/page.tsx` exists
- [x] `autoapply/apps/web/app/(dashboard)/profiles/[id]/page.tsx` exists
- [x] `autoapply/apps/web/components/profiles/ProfileCard.tsx` exists
- [x] `autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx` exists
- [x] `autoapply/apps/web/components/profiles/ResumeUploader.tsx` exists
- [x] Commit fb51121 exists (Task 1)
- [x] Commit e82d69a exists (Task 2)
- [x] `npx tsc --noEmit` passes for all new files (pre-existing route.ts errors from Plan 02 not caused by this plan)

## Self-Check: PASSED
