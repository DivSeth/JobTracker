# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**Job Aggregation Platforms:**
- SmartRecruiters - Job listings aggregation
  - Endpoint: `https://api.smartrecruiters.com/v1/companies/{slug}/postings`
  - Implementation: `lib/ats/smartrecruiters.ts`
  - No auth required (public API)

- Greenhouse - Job listings aggregation
  - Endpoint: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs`
  - Implementation: `lib/ats/greenhouse.ts`
  - No auth required (public API)

- Lever - Job listings aggregation
  - Implementation: `lib/ats/lever.ts`
  - No auth required (public API)

- Ashby - Job listings aggregation
  - Implementation: `lib/ats/ashby.ts`
  - No auth required (public API)

- RemoteOK - Job listings aggregation
  - Implementation: `lib/ats/remoteok.ts`
  - No auth required (public API)

**AI & LLM Services:**
- Google Gemini API - Email classification, job matching, deadline extraction
  - Model: `gemini-2.0-flash`
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - SDK/Client: Direct fetch (no SDK)
  - Auth: `GEMINI_API_KEY` (environment variable)
  - Implementation: `lib/ai/gemini.ts`, `lib/ai/email-classifier.ts`, `lib/ai/application-matcher.ts`, `lib/ai/deadline-extractor.ts`, `lib/ai/entity-extractor.ts`
  - Usage: JSON response mode, system instructions, token counting

**Code Repository Access:**
- GitHub API - Repository metadata retrieval
  - Auth: `GITHUB_TOKEN` (personal access token, repo read scope)
  - Implementation: Referenced in `.env.local.example`
  - Scope: Repository read access

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` (2.99.3) and `@supabase/ssr` (0.9.0)
  - Location: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
  - Features:
    - Row-level security (RLS) enabled
    - Real-time subscriptions
    - Authentication via Supabase Auth

**File Storage:**
- Supabase Storage - Resume uploads and profile exports
  - Integrated via same Supabase client
  - Used in: `app/api/profile/upload-resume/route.ts`, `app/api/profile/export/route.ts`

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (managed PostgreSQL with email/OAuth support)
  - Implementation: `lib/supabase/client.ts`, `lib/supabase/server.ts`
  - Client library: `@supabase/ssr` for SSR support
  - Session management: Cookie-based (via SSR helpers)
  - Protected routes: Middleware-based auth checks in `middleware.ts`
  - Public endpoints: Login, auth callbacks, webhooks, job operations

**OAuth Providers:**
- Google OAuth 2.0 - Gmail integration
  - Client ID: `GOOGLE_CLIENT_ID`
  - Client Secret: `GOOGLE_CLIENT_SECRET`
  - Scopes: Gmail read-only, Calendar event read
  - Token endpoint: `https://oauth2.googleapis.com/token`
  - Authorization endpoint: `https://accounts.google.com/o/oauth2/v2/auth`
  - Implementation: `lib/gmail/refresh.ts` (token refresh, auth URL building, code exchange)
  - Callback route: `app/api/auth/gmail/callback/route.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Console logging (implied via error handling patterns)

## CI/CD & Deployment

**Hosting:**
- Vercel (detected via `.vercel/` directory)
- Deployment config: `vercel.json`

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, etc.)

## Environment Configuration

**Required env vars (from `.env.local.example`):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase server key (server-side only)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (server-side only)
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)
- `GITHUB_TOKEN` - GitHub personal access token (optional, server-side only)

**Secrets location:**
- `.env.local` (local development)
- `.env.local.example` exists as reference template
- Production secrets configured in Vercel environment settings

## Webhooks & Callbacks

**Incoming:**
- Gmail Push Notifications - Push watch subscriptions for email monitoring
  - Endpoint: `app/api/gmail/webhook/route.ts`
  - Triggers: Incoming emails matched by subscription
  - Processing: `app/api/gmail/process/route.ts`

- Supabase Auth Callbacks
  - Endpoint: `app/api/auth/callback/route.ts`
  - Triggers: OAuth completion, email verification

- Google OAuth Callback
  - Endpoint: `app/api/auth/gmail/callback/route.ts`
  - Triggers: Gmail auth completion

**Outgoing:**
- Gmail Watch API Setup - Subscribe to mailbox changes
  - Endpoint: `app/api/gmail/watch/route.ts`
  - Purpose: Set up push notifications for incoming mail

## External Service Patterns

**ATS Job Fetching Pattern:**
All ATS platforms follow standardized fetch/transform pattern:
- Location: `lib/ats/{platform}.ts`
- Pattern: Fetch raw job data → Convert to `StandardizedJob` type
- Timeout: 5000ms for SmartRecruiters, 15000ms for Greenhouse
- Error handling: Graceful degradation (returns partial results)

**AI Processing Pattern:**
All AI tasks use Gemini API directly:
- System instructions for task specification
- Temperature: 0.1 (deterministic)
- Max tokens: 1024
- Response format: JSON only
- Token counting: Usage metrics tracked

**Gmail Integration Pattern:**
OAuth 2.0 with token refresh:
- Scopes: `gmail.readonly`, `calendar.events`
- Refresh buffer: 5 minutes before expiry
- Token storage: Supabase vault (encrypted)

---

*Integration audit: 2026-03-24*
