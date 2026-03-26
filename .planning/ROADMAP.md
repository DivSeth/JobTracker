# Roadmap: AutoApply OS

## Overview

AutoApply OS delivers one-click ATS auto-fill through a Chrome extension powered by role-specific application profiles. The roadmap builds from the foundation outward: profiles and extension infrastructure first, then Greenhouse auto-fill (simpler, validates approach), then a UI/UX overhaul to bring the entire product to startup quality, then Workday (the hard one that covers 40% of target applications), then Q&A intelligence (the compounding moat), and finally analytics, cover letters, and monetization to complete the product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Application Profiles & Extension Shell** - Role-specific profiles with encrypted PII and Chrome extension infrastructure with auth relay
- [ ] **Phase 2: Greenhouse Auto-Fill & Tracking** - End-to-end auto-fill on Greenhouse with field mapping preview and application tracking sync
- [ ] **Phase 3: UI/UX Overhaul** - Polish the entire product UI to startup quality with cohesive design system across web app and extension
- [ ] **Phase 4: Workday Auto-Fill** - Multi-page Workday form auto-fill with dynamic dropdowns, file upload, and bot detection avoidance
- [ ] **Phase 5: Q&A Intelligence** - Question memory bank with fuzzy matching and AI-generate mode for unknown screening questions
- [ ] **Phase 6: Analytics, Cover Letters & Monetization** - Personal analytics dashboard, AI cover letter generation, and freemium/pro tier with Stripe billing

## Phase Details

### Phase 1: Application Profiles & Extension Shell
**Goal**: Users can create and manage role-specific application profiles with full Workday-parity fields, and the Chrome extension authenticates and syncs profile data for auto-fill
**Depends on**: Nothing (first phase)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, EXT-01, EXT-02, EXT-03, EXT-04, EXT-05
**Success Criteria** (what must be TRUE):
  1. User can create multiple named profiles (e.g., "Quant", "SWE") each storing work history, education, skills, certifications, EEO fields, and resume PDF
  2. User can set a default profile, switch between profiles, and duplicate a profile to create variants
  3. Profile PII is encrypted at rest in Supabase
  4. Chrome extension shows connection status, detects supported ATS pages (Workday/Greenhouse URLs), and presents profile selection popup when user triggers auto-fill
  5. Extension authenticates with the web app via token relay and syncs selected profile data to local storage
**Plans**: 7 plans

Plans:
- [x] 01-00-PLAN.md — Wave 0 test stubs for all phase requirements (Nyquist compliance)
- [x] 01-01-PLAN.md — Data model, Zod schema, Supabase migration, pgcrypto encryption
- [x] 01-02-PLAN.md — Profile CRUD API routes, file upload, duplicate, middleware update
- [x] 01-03-PLAN.md — Chrome extension scaffold (WXT + React), token relay auth, background worker
- [ ] 01-04-PLAN.md — Profile management UI (list page, tabbed edit form, resume uploader, sidebar nav)
- [x] 01-05-PLAN.md — Extension ATS detection, popup mini dashboard, profile sync
- [ ] 01-06-PLAN.md — Resume AI parsing two-step flow (Gemini extraction, editable preview, form population)

### Phase 2: Greenhouse Auto-Fill & Tracking
**Goal**: Users can auto-fill an entire Greenhouse application from their selected profile with a visual preview of field mappings, and completed applications automatically appear in the dashboard
**Depends on**: Phase 1
**Requirements**: GH-01, GH-02, GH-03, GH-04, MAP-01, MAP-02, MAP-03, SYNC-01, SYNC-02, SYNC-03
**Success Criteria** (what must be TRUE):
  1. User sees a visual preview of which profile fields map to which Greenhouse form fields (including unmapped fields) before auto-fill begins
  2. Extension auto-fills all standard Greenhouse text fields, dropdowns, custom questions, and uploads resume/cover letter
  3. After auto-fill, an application entry is automatically created in the dashboard Kanban with a link to the job listing
  4. Extension detects submission confirmation and marks the application as submitted
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: UI/UX Overhaul
**Goal**: The entire product — web app and extension — feels like a polished startup product with a cohesive visual identity, intuitive flows, and professional quality that builds user trust
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. User can create and edit profiles through a redesigned management page with clear visual hierarchy and intuitive multi-step flow
  2. Dashboard reflects auto-fill activity metrics (fills completed, success rate) and extension connection status at a glance
  3. Extension popup and field mapping preview use the same design system as the web app and look professional (consistent typography, spacing, color)
  4. Every page in the web app and extension shares a cohesive visual identity following the Cognitive Workspace design system
  5. All pages render correctly and remain usable on screen widths from 1024px to 1920px (common laptop/desktop sizes)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Workday Auto-Fill
**Goal**: Users can auto-fill the full multi-page Workday application wizard from their profile, including dynamic dropdowns, file uploads, and work history/education entries
**Depends on**: Phase 2
**Requirements**: WD-01, WD-02, WD-03, WD-04, WD-05, WD-06, WD-07, WD-08, WD-09
**Success Criteria** (what must be TRUE):
  1. Extension navigates the 5-8 page Workday wizard automatically, filling text fields, dropdowns, EEO sections, work history, and education entries across all pages
  2. Resume PDF uploads successfully to Workday's custom upload widget via DataTransfer API
  3. Extension uses `data-automation-id` selectors (not CSS classes) and simulates human-like interaction (typing delays, focus/blur events) to avoid bot detection
  4. When expected Workday fields are missing or changed, the extension degrades gracefully (notifies user) rather than silently failing
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Q&A Intelligence
**Goal**: The extension learns from every application, building a memory bank of screening question answers that compounds value over time
**Depends on**: Phase 2
**Requirements**: QA-01, QA-02, QA-03, QA-04, QA-05, QA-06
**Success Criteria** (what must be TRUE):
  1. When the extension encounters an unknown screening question during auto-fill, it pauses and prompts the user to answer
  2. User's answers are saved to the Q&A bank with question fingerprints, and on future applications matching questions are auto-filled from the bank
  3. User can toggle per-profile between "pause-and-ask" and "AI-generate" mode, where AI generates answers from profile context and job description
  4. User can review, edit, and manage all Q&A bank entries from the web app
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Analytics, Cover Letters & Monetization
**Goal**: Users gain insight into their application performance, can generate AI cover letters, and the platform enforces free/pro tier limits with Stripe billing
**Depends on**: Phase 2
**Requirements**: ANLYT-01, ANLYT-02, ANLYT-03, ANLYT-04, COVR-01, COVR-02, COVR-03, COVR-04, MONET-01, MONET-02, MONET-03, MONET-04
**Success Criteria** (what must be TRUE):
  1. Dashboard shows total applications, response rate, status breakdown, activity timeline, per-profile response rates, and time-to-response metrics
  2. User can generate an AI cover letter from their profile + job description, edit it, save it to their profile, and the generation uses Q&A bank answers for personalization
  3. Free tier users are limited to a fixed number of auto-fills per month with rule-based scoring only
  4. Pro tier unlocks unlimited auto-fill, AI-generate mode for Q&A, AI cover letters, and AI scoring
  5. Stripe subscription billing works for pro tier upgrades and usage tracking enforces tier limits
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Application Profiles & Extension Shell | 5/7 | In Progress|  |
| 2. Greenhouse Auto-Fill & Tracking | 0/? | Not started | - |
| 3. UI/UX Overhaul | 0/? | Not started | - |
| 4. Workday Auto-Fill | 0/? | Not started | - |
| 5. Q&A Intelligence | 0/? | Not started | - |
| 6. Analytics, Cover Letters & Monetization | 0/? | Not started | - |
