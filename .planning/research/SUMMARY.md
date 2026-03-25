# Project Research Summary

**Project:** AutoApply OS — Phase 4+ (Browser Extension, Referral Marketplace, Outreach, Interview Prep, Analytics)
**Domain:** Job application automation platform — ATS auto-fill extension, referral network, recruiter outreach, interview preparation, success analytics
**Researched:** 2026-03-25
**Confidence:** MEDIUM (architecture and pitfalls are HIGH; stack versions and competitor feature landscape are MEDIUM due to unavailability of live web search during research)

## Executive Summary

AutoApply is a compound intelligence platform for job seekers — not just a form-filler, but a system that learns and compounds value with each application. The core engineering challenge of Phase 4 is building a Manifest V3 Chrome extension using WXT that can reliably auto-fill Workday (the hardest ATS) and Greenhouse. This is genuinely difficult: Workday uses dynamically generated class names, React/Angular state that does not respond to naive `.value` assignment, multi-page navigation without URL changes, and XHR-loaded dropdowns. The entire product value proposition collapses if the extension fails on Workday, which represents roughly 40% of enterprise internship applications. Solving it correctly requires `data-automation-id` selectors (more stable than CSS classes), a full synthetic event dispatch sequence after each fill, MutationObserver-based waiting between pages, and a declarative field mapping registry that can be updated without a new Chrome Web Store submission.

The recommended approach is: build the extension as a new monorepo workspace (`apps/extension/`) using WXT with React, share types and Supabase configuration through a new `packages/shared/` workspace, and keep the Background Service Worker as the sole holder of auth state. The inviolable architectural rule is that Content Scripts never hold auth tokens — all authenticated operations flow through the Background Worker via typed `chrome.runtime` messages. The intelligence features (Q&A bank, interview prep auto-generation, AI cover letter, recruiter outreach) layer cleanly on top of the existing Supabase + Gemini Flash stack and should not require any net-new infrastructure beyond Resend for transactional email.

The two network-effect features — referral marketplace and aggregate success analytics — must not be built until user thresholds are met (1,000+ active applicants for the marketplace, 500+ opted-in users for aggregate analytics). Both suffer from cold-start and data sparsity problems that cannot be engineered around; they require critical mass. The right move is to scaffold demand collection (referral request forms, opt-in data pooling) early and unlock the full features only when the numbers justify it. The biggest risks overall are Workday DOM instability (build for update tolerance, not update resistance), Chrome Web Store review rejection (use narrow host permissions, write a clear privacy policy), and the referral marketplace cold-start (start request-only and seed referrer supply manually).

## Key Findings

### Recommended Stack

The existing stack (Next.js 14.2.35, React 18, TypeScript 5, Supabase JS 2, Tailwind, shadcn) requires no changes. The extension is a new workspace using WXT — chosen over Plasmo for its leaner abstraction and framework-agnostic design, and over raw MV3 for developer experience. Recharts handles analytics visualizations and integrates cleanly with the existing shadcn design system. Resend handles transactional and outreach email, selected over SendGrid for its built-in React Email template support and better developer experience. Stripe is deferred until monetization is active. No new databases, no Redis, no GraphQL — the existing Supabase PostgreSQL instance handles everything including the credit ledger and analytics aggregations via RPC functions.

**Core technologies:**
- **WXT** (`^0.19.x`): Browser extension framework — file-based routing for content scripts, Vite under the hood, hot reload; not Plasmo (vendor lock-in), not CRXJS (development stalled 2023)
- **Native DOM APIs + MutationObserver**: ATS form interaction — no abstraction library works reliably with Workday/Greenhouse React forms; raw DOM + synthetic events are required
- **Supabase (existing)**: All backend needs — profiles, referral ledger, realtime notifications, file storage, vault for secrets; no new database infrastructure
- **Gemini 2.0 Flash (existing)**: AI generation for interview prep, cover letters, outreach personalization — no new AI infrastructure needed
- **Recharts** (`^2.12.x`): Analytics charts — React-native, D3-backed, integrates with shadcn design system
- **Resend** (`^3.x`): Email sending for outreach and transactional notifications — React Email template support, better DX than SendGrid
- **Shared `packages/shared/`** workspace: Types, Supabase config, Zod schemas, field mapping registries — shared across web app and extension
- **Stripe** (`^14.x`): Deferred until monetization phase; do not add yet

**Version verification required before install:** `wxt`, `resend`, `recharts`, `@google/generative-ai` — all claimed version numbers are from training data (cutoff May 2025). Run `npm view <pkg> version` before installing.

### Expected Features

See `/Users/divyaanshseth/Downloads/AutoApply_Test/.planning/research/FEATURES.md` for full detail and competitor analysis.

**Must have (table stakes) — Phase 4 focus:**
- Workday auto-fill (multi-page, dynamic dropdowns, React state sync) — the hardest and most important ATS
- Greenhouse auto-fill — simpler, good starting point to validate the approach
- Application profiles with Workday-parity fields (identity, education, work history, skills, EEO, Q&A bank, documents)
- Resume file upload injection (DataTransfer API — cannot set `input[type=file].value` directly)
- Multiple named profiles per user (different resumes and field sets per role type)
- Unknown field detection with pause-and-ask (surface unknowns to user; save answers to bank)
- Application confirmation detection + tracking sync (close the loop with the dashboard)
- Extension popup with profile selection and fill status feedback

**Should have (competitive differentiators) — Phase 5 focus:**
- Q&A memory bank — fingerprint and fuzzy-match questions across applications; the compounding moat
- AI answer generation for unknown questions (Pro tier, opt-in)
- Interview prep auto-generation — triggered by Gmail pipeline when interview invite detected
- AI-personalized cover letter generation — Gemini Flash, per-profile + per-JD, uses Q&A bank context
- Ghost detection re-engagement suggestions — actionable next steps from existing Phase 3 ghost detection
- Personal funnel analytics dashboard — data already exists from Phase 3, just needs surfacing
- Profile-to-ATS field mapping preview — visual confidence builder before fill begins

**Defer until user thresholds are met — Phase 6/7:**
- Referral marketplace (full two-sided): requires 1,000+ active applicants AND 50+ verified referrers at 20+ companies
- Aggregate success analytics: requires 500+ users opted into the anonymous data pool
- Lever and Ashby auto-fill: expand ATS coverage after the core is stable
- Recruiter outreach email sending: AI-draft approach, user reviews before send

**Defer indefinitely (anti-features):**
- LinkedIn automation — ToS violation, account ban risk; generate templates, user sends manually, forever
- Mass auto-apply without review — ATS platforms detect and block this; damages user candidacy
- Headless browser submission — detectable via canvas fingerprinting
- CAPTCHA solving — pause and notify user instead
- Resume builder, video interview practice, in-app job board — separate products, not this one

### Architecture Approach

The architecture cleanly separates the Chrome extension from the Next.js web app while sharing a single Supabase backend. The extension has three contexts: Popup UI (React, profile selection and status), Content Scripts (one per ATS, injected only on matching URLs via WXT host permission patterns), and Background Worker (Supabase client, auth management, profile caching, message routing). The web app adds new pages (Referral Marketplace, Outreach, Interview Prep, Analytics) as standard Next.js routes consuming existing Supabase patterns.

**Major components:**
1. **Extension Background Worker** — sole holder of Supabase auth session; caches active profile in `chrome.storage.local`; routes messages between popup and content scripts; refreshes auth proactively before expiry
2. **ATS Content Scripts (per platform)** — implement a shared `ATSFiller` interface (`detect()`, `scanFields()`, `fill()`, `nextPage()`, `isComplete()`); injected only on matching host URL patterns; never hold auth tokens
3. **Declarative Field Mapping Registry** — `packages/shared/src/mappings/workday.ts` etc.; maps profile fields to ATS selectors; updatable as configuration without code changes or Chrome Web Store review
4. **Credit Ledger (append-only)** — `credit_transactions` table with computed balance via Supabase RPC; never a mutable balance column; prevents race conditions and enables audit trail for disputes
5. **Analytics RPC Functions** — expensive aggregation queries live in Supabase RPC functions or materialized views, never inline in Next.js API route handlers
6. **Referral Realtime Flow** — Supabase Realtime notifies referrers of new requests; credit milestones updated atomically via RPC transactions

### Critical Pitfalls

1. **Workday DOM Instability** — Workday pushes quarterly UI updates that break CSS-class-based selectors. Use `data-automation-id` attributes exclusively. Store selectors in the declarative field mapping registry so updates are config-only changes deployable via Supabase, not requiring Chrome Web Store review. Add graceful degradation: detect when expected fields are missing and tell the user instead of silently failing.

2. **React/Angular State Desync** — Setting `input.value` directly does not trigger ATS framework state updates. After every field fill, dispatch the full synthetic event sequence: `input` → `change` → `blur` (all with `{ bubbles: true }`). For dropdowns, click the dropdown open, find the option element, and click it — never set `.value` on a `<select>`. Fill one field at a time and wait for MutationObserver to confirm the DOM settled before moving to the next field.

3. **File Upload Browser Security Block** — `input[type=file].value` assignment is browser-blocked. Use the `DataTransfer` API: create a `DataTransfer` object, add the resume `File` blob (fetched from Supabase Storage by the Background Worker), and dispatch a synthetic `drop` event or assign `input.files = dataTransfer.files`. Test this separately on each ATS — Workday and Greenhouse handle file uploads differently.

4. **Extension-Web App Auth Desync** — The extension cannot access the web app's Supabase session cookies. Use `chrome.identity` for Google OAuth in the extension, exchange the Google token for a Supabase session via `signInWithIdToken()`, and store the session in `chrome.storage.local`. Background Worker refreshes proactively (not on failure). If auth expires mid-fill, queue filled data locally and sync on re-auth. Show a badge on the extension icon when login is needed.

5. **Chrome Web Store Review Rejection** — Overly broad permissions are the most common rejection cause. Request only: `activeTab`, `storage`, `identity`. Use specific host permission patterns (`*://*.myworkdayjobs.com/*`, `*://boards.greenhouse.io/*`) — not `<all_urls>`. Write a precise store description explaining exactly what data is accessed and why. Include a privacy policy URL (mandatory for extensions handling user data). Plan for 1-7 day review cycles per submission.

## Implications for Roadmap

Based on research, the feature dependency tree and pitfall landscape suggest a four-phase structure. The critical path is: Profiles → Extension → Q&A Bank → full auto-fill loop. Network-effect features cannot be built in parallel — they require the user base the earlier phases create.

### Phase 4: Core Auto-Fill Loop

**Rationale:** The product does not exist as a competitive offering without reliable auto-fill on Workday and Greenhouse. Everything else is irrelevant if the extension does not work. This phase must come first and must not be cut short.
**Delivers:** A working Chrome extension that fills Workday and Greenhouse applications from a named user profile, uploads a resume, handles unknown fields with pause-and-ask, and logs the application to the dashboard automatically.
**Addresses (from FEATURES.md):** Application profiles (Workday-parity fields), Greenhouse auto-fill (start here — simpler to validate approach), Workday auto-fill (the hard one), resume file upload injection, multiple named profiles, unknown field detection, application confirmation detection, tracking sync, extension popup UI.
**Avoids (from PITFALLS.md):** Workday DOM instability (use `data-automation-id` + declarative registry), React state desync (full event dispatch sequence), file upload browser block (DataTransfer API), auth desync (chrome.identity + proactive refresh), Chrome Web Store rejection (narrow host permissions, privacy policy required).
**Stack needs:** WXT, native DOM APIs, MutationObserver, `packages/shared/` workspace, Supabase Storage (resume files), `chrome.storage.local`, Zod.
**Research flag:** Needs `/gsd:research-phase` — Workday `data-automation-id` attribute stability in the current UI, WXT version and MV3 compatibility, DataTransfer API cross-ATS file upload behavior are ATS-specific details that require focused research before implementation.

### Phase 5: Intelligence Extensions

**Rationale:** Once the auto-fill loop is closed, the Q&A bank is the compounding moat that separates AutoApply from Simplify and all stateless competitors. Interview prep and cover letter generation piggyback on existing Gmail + Gemini Flash infrastructure with minimal new work. Personal analytics surfaces data that already exists in Phase 3. This phase converts Phase 4 utility into long-term intelligence.
**Delivers:** Q&A memory bank that accumulates and reuses answers across applications; AI answer generation (Pro tier); auto-triggered interview prep packages when Gmail detects an interview invite; AI cover letter generation per job; personal analytics dashboard; ghost detection re-engagement action suggestions.
**Addresses (from FEATURES.md):** Q&A memory bank, AI answer generation, interview prep auto-generation (triggered by existing Gmail pipeline — zero new infrastructure), AI cover letter generation, personal funnel analytics, ghost detection re-engagement, profile-to-ATS field mapping preview.
**Avoids (from PITFALLS.md):** Q&A bank pollution (show answers before reuse, require explicit save confirmation, allow tagging as general vs. company-specific, never auto-save), analytics misleading correlations (require 50+ application minimum before showing patterns, always show confidence intervals).
**Stack needs:** Gemini 2.0 Flash (existing), Recharts, Supabase (existing). Optional: fuzzy matching library for Q&A question fingerprinting.
**Research flag:** Q&A question fingerprinting approach needs a decision: edit distance fuzzy matching (simple, no new dependencies) vs. lightweight embeddings (smarter but adds complexity and cost). This decision affects the data model design and should be made before implementation begins.

### Phase 6: Network Expansion

**Rationale:** After Phase 4-5 establish a working product and early user base, expand ATS coverage and activate recruiter outreach to drive Pro tier engagement and preview the marketplace vision. The referral request form (one-sided, applicant-only) goes live here to collect demand signals before committing to the full marketplace build.
**Delivers:** Lever and Ashby ATS support (expands addressable applications by ~20%); recruiter outreach email drafting and sending via Gmail OAuth; LinkedIn message template generation (manual send only, never automate); referral request form (applicant side only, for demand validation); profile-to-ATS field mapping preview.
**Addresses (from FEATURES.md):** Lever + Ashby auto-fill, recruiter outreach (email draft + send), LinkedIn templates (generate text, user pastes manually), referral request form (one-sided demand collection), field mapping preview.
**Avoids (from PITFALLS.md):** Outreach email deliverability issues (custom sending domain, content variation per recipient, per-user sending limits, CAN-SPAM compliance, bounce rate throttling), LinkedIn automation ToS ban risk (templates only, forever, no exceptions), marketplace cold start (start request-only — no supply side yet, no empty directory problem).
**Stack needs:** Resend, Gemini Flash (existing), Gmail OAuth (existing), Supabase Realtime (existing for referral request notifications).
**Research flag:** Recruiter contact discovery (email pattern guessing + SMTP verification) needs research — current accuracy of pattern-based approaches and whether Hunter.io API cost is justified as a Pro feature. Check current pricing and API availability.

### Phase 7: Marketplace and Aggregate Analytics

**Rationale:** Full two-sided referral marketplace and aggregate analytics require user thresholds that earlier phases must create. Do not plan this phase in detail until Phase 4-6 metrics justify it: 1,000+ active applicants, 500+ users opted into data pooling, 50+ verified referrers manually recruited across 20+ companies.
**Delivers:** Full referral marketplace (verified referrer registration via company email verification, applicant-referrer match flow, credit system with milestone rewards, reputation and anti-gaming layer); aggregate success pattern analytics (optimal timing, skill match thresholds, company responsiveness rankings); cohort benchmarking; company-level intelligence dashboard.
**Addresses (from FEATURES.md):** Full referral marketplace, credit economy (earn on referral submit/interview/offer, redeem for Pro tier), aggregate analytics Tier B, cohort benchmarking, company-level intelligence.
**Avoids (from PITFALLS.md):** Marketplace cold start (launch only after verified referrer supply and applicant demand are confirmed), credit system gaming (require proof of referral submission, enforce review period before credits are awarded), analytics data quality (k-anonymization with minimum group size of 10, confidence intervals on all reported patterns, opt-in only with default off, show sample size on every metric).
**Stack needs:** Supabase Realtime (existing), Supabase RPC + materialized views for anonymized aggregates, Resend for match notifications, Stripe (introduce here for credit monetization when justified), Recharts (existing).
**Research flag:** Skip `/gsd:research-phase` for referral marketplace mechanics — two-sided marketplace patterns, credit economy design, and reputation systems are well-documented. Do research PostgreSQL k-anonymization query patterns and materialized view strategies before building aggregate analytics.

### Phase Ordering Rationale

- **Extension before everything** because the feature dependency graph from FEATURES.md shows application profiles and extension as the root of the entire tree. The Q&A bank, interview prep, outreach, and analytics all depend on applications being submitted and tracked through the extension.
- **Intelligence before network effects** because Q&A bank, interview prep, and cover letter generation are single-user features that deliver value at any user count. Referral marketplace and aggregate analytics have hard user-count prerequisites that make them technically impossible to build correctly before scale exists.
- **Referral request form in Phase 6, not Phase 7** because collecting applicant demand data early (even before referrer supply exists) validates the marketplace hypothesis with real signals before committing to the full two-sided build.
- **Outreach in Phase 6, not Phase 5** because recruiter contact discovery requires the product to be credible and established before cold emails go out under the AutoApply brand. Phases 4-5 build that credibility.
- **Aggregate analytics last** because the data quality and privacy requirements (500+ users, explicit opt-in, k-anonymization minimum group size of 10) make it technically misleading — not just incomplete — to build before scale exists.

### Research Flags

Phases needing `/gsd:research-phase` during planning:
- **Phase 4 (Extension):** Current Workday `data-automation-id` attribute stability, WXT latest version and MV3 compatibility status, DataTransfer API behavior on Workday custom upload widgets vs. Greenhouse standard inputs. These are ATS-specific details that change with ATS updates and must be validated against live pages.
- **Phase 5 (Intelligence):** Q&A bank question fingerprinting strategy — edit distance vs. lightweight embeddings. Decision affects the data model and cannot easily be changed later.
- **Phase 6 (Outreach):** Recruiter email pattern guessing accuracy vs. Hunter.io/Apollo.io cost-benefit. Current SMTP verification reliability.

Phases with standard, well-documented patterns (skip `/gsd:research-phase`):
- **Phase 5 (Personal Analytics):** Recharts + PostgreSQL aggregate queries are standard. Application funnel metrics are well-understood. Data already exists from Phase 3.
- **Phase 6 (ATS Expansion — Lever/Ashby):** Both use standard HTML form patterns, far simpler than Workday. Apply the same `ATSFiller` interface. No new patterns needed.
- **Phase 7 (Marketplace mechanics):** Two-sided marketplace design, credit economy, and reputation systems are thoroughly documented. Standard implementation of established patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (existing) | HIGH | Verified from `package.json` and codebase analysis. Next.js, Supabase, Gemini are confirmed. |
| Stack (new additions) | MEDIUM | WXT, Resend, Recharts are established libraries but exact versions are from training data (cutoff May 2025). Verify with `npm view <pkg> version` before installing. |
| Features | MEDIUM | Table stakes features and Workday complexity are HIGH (well-documented). Competitor feature landscape (Simplify, LazyApply) is MEDIUM — may have evolved since May 2025. ATS market share percentages are LOW. |
| Architecture | HIGH | Extension architecture patterns (Background Worker auth, typed message bus, ATSFiller adapter, append-only credit ledger, RPC for analytics) are established patterns grounded in the existing codebase structure and MV3 documentation. |
| Pitfalls | HIGH | Workday DOM instability, React state desync, DataTransfer file upload workaround, Chrome Web Store review policies, two-sided marketplace cold start — all are extremely well-documented and consistently reported across developer communities. Not speculative. |

**Overall confidence:** MEDIUM-HIGH

The architectural decisions and pitfall prevention strategies are sound regardless of exact package versions. The primary uncertainty is competitor feature parity (Simplify may have added Workday support or a Q&A bank since May 2025) and exact package version numbers.

### Gaps to Address

- **Current Simplify feature set:** Validate before Phase 4 ships. If Simplify has added full Workday support and a Q&A bank, the competitive positioning changes. Check their Chrome Web Store listing and recent changelog before finalizing Phase 5 messaging.
- **Workday current DOM structure:** Validate that `data-automation-id` attributes still exist and are stable in the current Workday UI before writing the field mapping registry. Workday's quarterly updates may have changed the attribute strategy. Must test against a live Workday application page early in Phase 4.
- **WXT version maturity:** Run `npm view wxt version` and check GitHub release activity before committing. The framework choice is HIGH confidence; the version is unverified.
- **Greenhouse and Lever form stability:** Test manually on a real application page before writing the field mapping. HTML form structures can shift.
- **Recruiter email discovery accuracy:** Test SMTP-based email pattern verification against real recruiter addresses before shipping the Phase 6 outreach feature. Documented 60-70% accuracy may not hold in 2026.
- **Hunter.io/Apollo.io current pricing:** Check before deciding whether recruiter contact enrichment is viable as a Pro tier cost. Pricing may have changed significantly.
- **GDPR/CCPA implications for extension PII caching:** Profile data cached in `chrome.storage.local` may include EEO fields. Needs legal review before Chrome Web Store submission, especially for users in the EU.

## Sources

### Primary (HIGH confidence — confirmed from codebase)
- `autoapply/apps/web/package.json` — existing stack versions (Next.js 14.2.35, React 18, TypeScript 5, Supabase JS 2.99.3, Tailwind 3.4.1, shadcn 4.1.0, Vitest 4.1.0, Playwright 1.58.2)
- `.planning/codebase/ARCHITECTURE.md` — existing architecture patterns, data flows, and established conventions
- Existing Gmail integration, Gemini Flash usage, Supabase Vault — confirmed from codebase inspection

### Secondary (MEDIUM confidence — training data, multiple sources agree)
- Chrome Extension Manifest V3 policies, permission model, and host permission patterns
- WXT framework architecture and feature set (wxt.dev — training data)
- Workday DOM structure and `data-automation-id` pattern (widely documented in developer forums)
- React synthetic event requirements for framework-managed forms (React documentation)
- Two-sided marketplace cold-start dynamics and credit economy design (standard product literature)
- Simplify, LazyApply, Sonara competitive feature landscape (pre-May 2025 training data)
- Resend API, React Email integration, CAN-SPAM compliance requirements
- Recharts React charting library patterns

### Tertiary (LOW confidence — estimates or unverified)
- ATS platform market share estimates (Workday ~40%, Greenhouse ~25%, Lever ~15% — rough estimates that vary by industry segment)
- Current Hunter.io / Apollo.io pricing and API capabilities
- Package version numbers for WXT, Resend, Recharts, Stripe (training data only — verify with `npm view`)
- Resend free tier current limits (may have changed since May 2025)

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
