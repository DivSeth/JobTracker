# Requirements: AutoApply OS

**Defined:** 2026-03-25
**Core Value:** One-click application submission with full ATS form auto-fill powered by role-specific profiles

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Application Profiles

- [x] **PROF-01**: User can create multiple named application profiles (e.g., "Quant", "SWE", "PM")
- [x] **PROF-02**: Each profile stores full Workday-parity fields: personal info, work history, education, skills, certifications, EEO/demographics
- [x] **PROF-03**: Each profile has an associated resume file (PDF) and optional cover letter
- [x] **PROF-04**: User can set a default profile and switch between profiles
- [x] **PROF-05**: User can duplicate a profile and modify it to create variants
- [x] **PROF-06**: Profile data is encrypted at rest (PII protection)

### Browser Extension

- [ ] **EXT-01**: Chrome extension (Manifest V3) with popup showing connection status and active profile
- [ ] **EXT-02**: Extension authenticates with web app via token relay (OAuth through web app tab)
- [x] **EXT-03**: Extension detects when user is on a supported ATS application page (Workday, Greenhouse)
- [x] **EXT-04**: Profile selection popup appears when user triggers auto-fill on a job application
- [x] **EXT-05**: Extension syncs profile data from web app to local storage for offline-capable fill

### Workday Auto-Fill

- [ ] **WD-01**: Auto-fill all standard Workday text fields (name, email, phone, address, LinkedIn)
- [ ] **WD-02**: Navigate multi-page Workday forms automatically (5-8 page wizard)
- [ ] **WD-03**: Populate Workday dropdown fields via synthetic event dispatch (country, state, degree type)
- [ ] **WD-04**: Upload resume PDF to Workday's custom upload widget
- [ ] **WD-05**: Fill EEO/demographic sections from profile data
- [ ] **WD-06**: Fill work history entries (multiple positions with dates, descriptions)
- [ ] **WD-07**: Fill education entries (multiple schools with degrees, GPAs, dates)
- [ ] **WD-08**: Use `data-automation-id` selectors for DOM resilience against Workday UI updates
- [ ] **WD-09**: Human-like interaction simulation (typing delays, focus/blur, mouse events) to avoid bot detection

### Greenhouse Auto-Fill

- [ ] **GH-01**: Auto-fill all standard Greenhouse text fields
- [ ] **GH-02**: Upload resume and cover letter via standard file input
- [ ] **GH-03**: Fill dropdown selections (work authorization, degree type)
- [ ] **GH-04**: Fill custom application questions from profile or Q&A bank

### Q&A Intelligence

- [ ] **QA-01**: When extension encounters an unknown screening question, pause and prompt user to answer
- [ ] **QA-02**: Save user's answer to Q&A memory bank with question fingerprint for future matching
- [ ] **QA-03**: On subsequent applications, fuzzy-match new questions against Q&A bank and auto-fill matching answers
- [ ] **QA-04**: User can toggle per-profile: "pause-and-ask" mode vs "AI-generate" mode for unknown questions
- [ ] **QA-05**: In AI-generate mode, Gemini generates answers from profile context + job description
- [ ] **QA-06**: User can review, edit, and manage Q&A bank entries from web app

### Field Mapping & Preview

- [ ] **MAP-01**: Before filling, show visual preview of which profile fields map to which ATS form fields
- [ ] **MAP-02**: Indicate unmapped fields (fields the extension will skip or ask about)
- [ ] **MAP-03**: ATS field mappings stored as configuration in Supabase (updatable without extension release)

### Tracking Sync

- [ ] **SYNC-01**: After auto-fill completion, automatically create application entry in dashboard Kanban
- [ ] **SYNC-02**: Detect application confirmation (success page, redirect, toast) and mark as submitted
- [ ] **SYNC-03**: Link auto-filled application to the job listing if it exists in the jobs database

### UI/UX Overhaul

- [ ] **UI-01**: Redesigned profiles management page with intuitive profile creation/editing flow
- [ ] **UI-02**: Updated dashboard reflecting auto-fill metrics and extension status
- [ ] **UI-03**: Polished extension popup and field mapping preview with the design system
- [ ] **UI-04**: Cohesive visual identity across web app and extension
- [ ] **UI-05**: Responsive design audit ensuring all pages work on common screen sizes

### Personal Analytics

- [ ] **ANLYT-01**: Dashboard showing total applications submitted, response rate, status breakdown
- [ ] **ANLYT-02**: Activity timeline chart (applications over time)
- [ ] **ANLYT-03**: Breakdown by profile used (which profile gets best response rates)
- [ ] **ANLYT-04**: Average time-to-response and time-in-stage metrics

### AI Cover Letters

- [ ] **COVR-01**: Generate role-specific cover letter from profile + job description context
- [ ] **COVR-02**: User can edit generated cover letter before attaching
- [ ] **COVR-03**: Save generated cover letters to profile for reuse
- [ ] **COVR-04**: Cover letter generation uses Q&A bank answers for personalization

### Monetization Foundation

- [ ] **MONET-01**: Free tier with limited auto-fills per month (e.g., 10) and rule-based scoring only
- [ ] **MONET-02**: Pro tier unlocks unlimited auto-fill, AI-generate mode, AI cover letters, AI scoring
- [ ] **MONET-03**: Stripe integration for subscription billing
- [ ] **MONET-04**: Usage tracking to enforce tier limits

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interview Prep

- **PREP-01**: Auto-generate interview prep package when Gmail detects interview invite
- **PREP-02**: Prep includes: company research brief, role-specific questions, STAR story prompts, technical checklist
- **PREP-03**: Day-by-day prep timeline integrated with Google Calendar

### Ghost Re-engagement

- **GHOST-01**: When app is ghosted, suggest follow-up actions (email template, LinkedIn message, re-apply timing)
- **GHOST-02**: One-click follow-up email generation using connected Gmail

### Recruiter Outreach

- **OUTREACH-01**: AI-personalized cold email generation to recruiters at target companies
- **OUTREACH-02**: LinkedIn message draft generation (user copy-pastes manually — no automation)
- **OUTREACH-03**: Recruiter contact discovery via email pattern matching
- **OUTREACH-04**: Follow-up sequence management with open/reply tracking

### Referral System

- **REF-01**: One-sided referral request form (applicant requests referral at target company)
- **REF-02**: Demand tracking (which companies have the most referral requests)

### Additional ATS Support

- **ATS-01**: Lever auto-fill adapter
- **ATS-02**: Ashby auto-fill adapter
- **ATS-03**: SmartRecruiters auto-fill adapter

### Network Features (Post-Traction)

- **NET-01**: Full referral marketplace with credit system (referrers earn credits on interview/offer)
- **NET-02**: Aggregate success pattern analytics (anonymized, k-anonymized)
- **NET-03**: Company-level intelligence (interview rates, response times, common questions)
- **NET-04**: Cohort benchmarking (compare against peers in same grad year / role category)

### Mobile

- **MOB-01**: Native iOS app for application tracking and analytics
- **MOB-02**: Native Android app for application tracking and analytics
- **MOB-03**: Push notifications for status changes detected via Gmail

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mass auto-apply / spray-and-pray | ATS platforms detect and block; damages user's candidacy; LazyApply's model is anti-user |
| LinkedIn automation / bot messaging | LinkedIn bans automated accounts; legal risk under CFAA; users lose their network |
| Headless browser submission | Detectable via canvas fingerprinting; ATS vendors flag these submissions |
| CAPTCHA solving | Ethically dubious, technically fragile, constant arms race |
| Resume builder | Teal/Jobscan already do this well; full product in itself; dilutes focus |
| Video interview practice | Enormous infrastructure for marginal value; Pramp/Interviewing.io own this |
| In-app job board / employer postings | Competing with Indeed/LinkedIn is impossible; stay as application layer |
| Salary negotiation tools | Niche post-offer feature; levels.fyi owns this space |
| Automated interview scheduling | Too many edge cases; high risk of scheduling errors damaging candidacy |
| Taleo/iCIMS at launch | Legacy enterprise ATS; high complexity, declining market share |
| B2B org admin panels in v1 | Architecture supports it, but don't build UI until B2C proven |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| PROF-03 | Phase 1 | Complete |
| PROF-04 | Phase 1 | Complete |
| PROF-05 | Phase 1 | Complete |
| PROF-06 | Phase 1 | Complete |
| EXT-01 | Phase 1 | Pending |
| EXT-02 | Phase 1 | Pending |
| EXT-03 | Phase 1 | Complete |
| EXT-04 | Phase 1 | Complete |
| EXT-05 | Phase 1 | Complete |
| GH-01 | Phase 2 | Pending |
| GH-02 | Phase 2 | Pending |
| GH-03 | Phase 2 | Pending |
| GH-04 | Phase 2 | Pending |
| MAP-01 | Phase 2 | Pending |
| MAP-02 | Phase 2 | Pending |
| MAP-03 | Phase 2 | Pending |
| SYNC-01 | Phase 2 | Pending |
| SYNC-02 | Phase 2 | Pending |
| SYNC-03 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| WD-01 | Phase 4 | Pending |
| WD-02 | Phase 4 | Pending |
| WD-03 | Phase 4 | Pending |
| WD-04 | Phase 4 | Pending |
| WD-05 | Phase 4 | Pending |
| WD-06 | Phase 4 | Pending |
| WD-07 | Phase 4 | Pending |
| WD-08 | Phase 4 | Pending |
| WD-09 | Phase 4 | Pending |
| QA-01 | Phase 5 | Pending |
| QA-02 | Phase 5 | Pending |
| QA-03 | Phase 5 | Pending |
| QA-04 | Phase 5 | Pending |
| QA-05 | Phase 5 | Pending |
| QA-06 | Phase 5 | Pending |
| ANLYT-01 | Phase 6 | Pending |
| ANLYT-02 | Phase 6 | Pending |
| ANLYT-03 | Phase 6 | Pending |
| ANLYT-04 | Phase 6 | Pending |
| COVR-01 | Phase 6 | Pending |
| COVR-02 | Phase 6 | Pending |
| COVR-03 | Phase 6 | Pending |
| COVR-04 | Phase 6 | Pending |
| MONET-01 | Phase 6 | Pending |
| MONET-02 | Phase 6 | Pending |
| MONET-03 | Phase 6 | Pending |
| MONET-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap revision (Phase 3 UI/UX Overhaul inserted)*
