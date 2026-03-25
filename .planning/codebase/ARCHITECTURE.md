# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** Next.js 14 Server Components with API Routes (App Router)

**Key Characteristics:**
- Server-centric architecture using async React Server Components
- Auth-protected routes via middleware with Supabase
- RESTful API routes for application state mutations
- Supabase as single source of truth for data
- Modular lib utilities for cross-cutting concerns (ATS, AI, Gmail)

## Layers

**Presentation Layer:**
- Purpose: User-facing React components and page templates
- Location: `app/(auth)`, `app/(dashboard)`
- Contains: Page components (.tsx), layout wrappers, UI components
- Depends on: Supabase client, lib utilities, dashboard components
- Used by: Next.js router

**API Route Layer:**
- Purpose: Handle HTTP requests, authenticate users, apply business logic
- Location: `app/api/`
- Contains: RESTful endpoints for jobs, applications, profiles, Gmail webhooks
- Depends on: Supabase server client, lib utilities (ATS, AI, Gmail)
- Used by: Frontend components, external services (webhooks)

**Data Access Layer:**
- Purpose: Abstract Supabase client creation and queries
- Location: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Contains: Server/client Supabase client factories
- Depends on: Supabase SDK, Next.js cookies
- Used by: All API routes and server components

**Business Logic Layer:**
- Purpose: Application-specific logic isolated from routing
- Location: `lib/` (organized by domain)
- Contains: ATS platform handlers, AI scoring, Gmail integration, job filters
- Depends on: External APIs (Gemini, Gmail, ATS platforms)
- Used by: API routes, server components

**External Integration Layer:**
- Purpose: Manage third-party service interactions
- Location: `lib/ats/`, `lib/ai/`, `lib/gmail/`
- Contains: Platform-specific adapters (Greenhouse, Lever, Ashby, SmartRecruiters), AI clients, Gmail API handlers
- Depends on: External APIs, HTTP clients
- Used by: Business logic layer

## Data Flow

**Job Search & Sync Flow:**

1. User accesses `/jobs` page → `app/(dashboard)/jobs/page.tsx`
2. Page calls `GET /api/jobs` with filters
3. API route authenticates via Supabase, calls `parseJobFilters()`
4. Query builds with filters: `jobs.select().eq('is_active', true)`
5. Returns data with related job_scores, source info, company data
6. Component renders jobs in UI with filters and sort controls

**Application Lifecycle Flow:**

1. User creates/updates application via `POST /api/applications`
2. API validates user, inserts record to Supabase with `user_id`
3. Triggers optional background processes (ghost detection, email processing)
4. User views applications on dashboard at `/` pulling from `GET /api/applications`
5. Status changes via `PATCH /api/applications` update last_activity_at

**Gmail Intelligence Flow:**

1. Gmail webhook sent to `POST /api/gmail/webhook`
2. Webhook triggers `POST /api/gmail/process` to analyze emails
3. Process calls `lib/ai/email-classifier.ts` and `entity-extractor.ts` (Gemini)
4. Extracts decision data (accept/reject/info), deadlines, job entities
5. Updates corresponding applications with decision_date, decision_type
6. Feeds insights generation via `POST /api/insights/generate`

**Job Scoring Flow:**

1. `POST /api/jobs/score` triggered per job
2. Calls `lib/scoring/gemini-scorer.ts` (AI) or `rule-scorer.ts` (fallback)
3. Compares job requirements against user profile (resume, skills)
4. Returns score (0-100), tier, matching_skills, skill_gaps, reasoning
5. Stores in `job_scores` table linked to user and job
6. Dashboard displays on job cards for quick filtering

## Key Abstractions

**ATS Adapter Pattern:**
- Purpose: Unify different job board/ATS platform interactions
- Examples: `lib/ats/greenhouse.ts`, `lib/ats/lever.ts`, `lib/ats/ashby.ts`, `lib/ats/smartrecruiters.ts`, `lib/ats/remoteok.ts`
- Pattern: Each adapter exports fetch/parse functions returning normalized job data

**Scorer Pattern:**
- Purpose: Evaluate job match against user profile
- Examples: `lib/scoring/gemini-scorer.ts` (AI-based), `lib/scoring/rule-scorer.ts` (heuristic)
- Pattern: Scorer takes job + user profile, returns standardized score object

**AI Module Pattern:**
- Purpose: LLM-powered document/email analysis
- Examples: `lib/ai/email-classifier.ts`, `lib/ai/entity-extractor.ts`, `lib/ai/deadline-extractor.ts`, `lib/ai/gemini.ts`
- Pattern: Each module takes text input, returns structured typed output via Gemini

**Gmail Integration Pattern:**
- Purpose: Manage Gmail API operations and webhook handling
- Examples: `lib/gmail/client.ts`, `lib/gmail/vault.ts`, `lib/gmail/refresh.ts`
- Pattern: Client wraps Gmail API, vault manages token refresh, webhooks trigger processing

## Entry Points

**Web Entry Point:**
- Location: `app/layout.tsx`
- Triggers: Next.js server start
- Responsibilities: Root layout, font loading, theme script injection

**Auth Flow Entry:**
- Location: `app/(auth)/login/page.tsx` + `app/api/auth/callback/route.ts`
- Triggers: User authentication via Supabase OAuth
- Responsibilities: Redirect to Supabase auth, handle callback, set auth cookies

**Dashboard Entry:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: Authenticated user navigation
- Responsibilities: Check auth via server Supabase client, render sidebar + main layout

**API Entry Points:**
- Location: `app/api/*/route.ts` (35+ endpoints)
- Triggers: Frontend fetch requests, external webhooks, cron jobs
- Responsibilities: Auth check, input validation, business logic execution, response formatting

**Middleware Entry:**
- Location: `middleware.ts`
- Triggers: Every request
- Responsibilities: Auth session management, public/protected route routing, cookie sync

## Error Handling

**Strategy:** Try-catch at API route level with generic error responses

**Patterns:**
- Auth errors → 401 Unauthorized
- Server errors → 500 with error.message
- Validation errors → Handled in individual routes (no global validator)
- Supabase query errors → Logged and returned as `{ error: message }`

## Cross-Cutting Concerns

**Logging:** Console-based (no centralized logger configured)

**Validation:** Per-route, primarily form data validation in API routes

**Authentication:** Supabase Auth (OAuth + JWT) via middleware + server components
- Public routes whitelisted in middleware.ts
- Protected routes redirect to /login
- User context passed via `supabase.auth.getUser()`

**Type Safety:** TypeScript with Supabase-generated types (likely in `supabase/types.ts` or similar)

---

*Architecture analysis: 2026-03-24*
