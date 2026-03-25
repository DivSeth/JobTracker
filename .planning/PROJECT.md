# AutoApply OS

## What This Is

An AI-powered job application platform that automates the entire job search lifecycle — from discovering roles and auto-filling applications across ATS platforms, to tracking responses via Gmail intelligence, preparing for interviews, and connecting applicants with referrers at target companies. Built for college students grinding through the internship and new-grad application cycle.

## Core Value

One-click application submission with full ATS form auto-fill powered by user-created role-specific profiles — eliminating the repetitive manual labor of filling out the same information hundreds of times.

## Requirements

### Validated

- ✓ Multi-source ATS job pipeline (Greenhouse, Lever, Ashby, SmartRecruiters, RemoteOK) — Phase: ATS Pipeline
- ✓ Job listing with filters (type, location, country, role category) — Phase 1 + 2A
- ✓ Application tracking with Kanban board — Phase 1
- ✓ Google OAuth authentication — Phase 1
- ✓ User profile with skills/preferences — Phase 1 + 2A
- ✓ Gmail integration with AI email classification (Gemini Flash) — Phase 3
- ✓ Job scoring (rule-based + AI) — Phase 3
- ✓ Ghost detection for stale applications — Phase 3
- ✓ Weekly AI-generated insights — Phase 3
- ✓ Google Calendar integration for deadlines — Phase 3
- ✓ "Cognitive Workspace" design system (tonal architecture, no-line rule) — Phase 2A

### Active

**Core Loop (ASAP):**
- [ ] Browser extension for ATS auto-fill (Workday + Greenhouse at launch)
- [ ] Role-specific application profiles (full Workday-parity fields: work history, education, skills, certs, EEO, custom answers)
- [ ] Profile selection popup on apply (choose quant vs SWE vs custom profile)
- [ ] Unknown question handling (user choice: pause-and-ask or AI-generate from profile)
- [ ] Q&A memory bank (remember answers to custom screening questions across applications)

**Intelligence & Differentiation (Summer 2026):**
- [ ] Interview prep auto-generation (triggered when app moves to interview stage via Gmail detection)
- [ ] Success pattern analytics (aggregate anonymized data: which resume styles, timing, answers get callbacks)
- [ ] Referral marketplace with credit system (referrers earn credits when referral gets hired)
- [ ] Multi-channel recruiter outreach (AI-personalized LinkedIn DMs + cold emails)

**Platform Completeness:**
- [ ] Freemium + Pro tier (free: rule-based scoring, limited auto-fills; pro: AI scoring, unlimited auto-fill, outreach, analytics)
- [ ] Native mobile app (iOS/Android)
- [ ] B2B org accounts for universities/bootcamps (deferred architecture, not v1)

### Out of Scope

- Real-time chat / messaging between users — not core to job application workflow
- Video content / portfolio hosting — stay focused on the application pipeline
- Manual job posting by employers — this is an applicant tool, not a job board
- OAuth providers beyond Google — Google covers the target demographic
- Taleo/iCIMS support at launch — legacy enterprise ATS, add after Workday + Greenhouse proven
- B2B org features in v1 — architecture should support it, but don't build admin panels yet

## Context

**Existing Codebase:**
- Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Supabase (PostgreSQL + Auth + RLS + Vault for token storage)
- Gemini 2.0 Flash for all AI (free tier)
- Gmail API + Google Calendar API integration
- Deployed on Vercel + Supabase cloud
- 35+ API endpoints, 5 ATS platform adapters
- Comprehensive design system ("The Intelligent Curator" / Cognitive Workspace)

**Target User:**
- College students applying for internships and new-grad roles
- High-volume applicants (50-200+ applications per cycle)
- Primarily applying to tech (SWE) and finance (quant) roles
- Workday and Greenhouse are their most common ATS encounters

**Competition:**
- Simplify, LazyApply, Sonara — basic auto-fill tools
- AutoApply differentiates with: intelligence layer (Gmail tracking, scoring, ghost detection), success pattern analytics, referral marketplace, interview prep pipeline, recruiter outreach

**AI Strategy:**
- Bootstrap on Gemini Flash free tier
- Rule-based fallbacks for 85% of scoring/classification
- Scale AI spend with user traction and funding
- Pro tier absorbs AI costs once monetized

**Monetization:**
- Freemium model: free tier with limits on auto-fills and rule-based features
- Pro tier: unlimited auto-fill, AI scoring, recruiter outreach, success analytics
- Future: B2B licensing to universities/bootcamps

## Constraints

- **Budget**: Zero infrastructure budget at launch — free tiers only (Gemini Flash, Supabase free, Vercel Hobby). Scale spending with traction.
- **ATS Complexity**: Workday forms are multi-page with dynamic fields. Extension must handle page navigation, dropdown population, file uploads.
- **Privacy**: PII encryption required from day 1. GDPR-ready data policies. Users trust us with resumes, work history, and auto-submission credentials.
- **Tech Stack**: Next.js 14 + Supabase + Gemini (established). Browser extension adds Chrome Extension Manifest V3.
- **Timeline**: Core auto-fill loop ASAP. Full platform (prep, analytics, referrals, outreach) by summer 2026.
- **Scalability**: Architecture must support multi-tenant (B2B) even if not built yet. No decisions that lock out org-level accounts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser extension for auto-fill (not in-app iframe) | ATS platforms block iframe embedding; extension has DOM access | — Pending |
| Workday + Greenhouse first | Covers majority of target user's applications | — Pending |
| User choice: pause-on-unknown vs AI-generate | Power users want speed, cautious users want control | — Pending |
| Credit-based referral marketplace | Incentivizes participation, creates network effect | — Pending |
| Gemini Flash free tier at launch | Zero budget constraint; rule-based fallbacks for reliability | ✓ Good |
| Freemium + Pro monetization | Low barrier to entry for students; pro features fund AI costs | — Pending |
| B2C first, B2B architecture later | Don't over-build, but don't paint yourself into a corner | — Pending |
| Native mobile app in roadmap | Full platform vision, but web-first for core loop | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
