# ATS Pipeline Design — Multi-Source Job Data Overhaul

**Date:** 2026-03-23
**Status:** Approved
**Replaces:** GitHub markdown repo scraping (SimplifyJobs)

---

## Overview

Replace the fragile GitHub markdown parser with a multi-source ATS pipeline that pulls structured JSON directly from public, no-auth job board APIs. Jobs are deduplicated across sources, classified by type (Internship / New Grad / Full Time), and enriched with logos, salary, and skills data.

## Data Sources

| Platform | Endpoint | Auth | Fields |
|----------|----------|------|--------|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{slug}/jobs` | None | title, location, URL, department, date |
| Lever | `api.lever.co/v0/postings/{slug}?mode=json` | None | title, location, categories, apply link, team |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{slug}` | None | title, department, team, location, remote flag, employment type, apply URL |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/{slug}/postings` | None | title, location, department (paginated, 100/page) |
| RemoteOK | `remoteok.com/api` | None | title, company, tags/skills, salary, apply URL |
| JSearch (RapidAPI) | `jsearch.p.rapidapi.com/search` | API Key | salary, skills, logos, experience level, remote policy |

JSearch remains as an enrichment layer only — not a primary source.

## Company Registry

### Schema

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  ats_platform TEXT NOT NULL,  -- 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ats_platform, slug)
);

CREATE INDEX idx_companies_active_platform ON companies(is_active, ats_platform);
```

### Population Strategy

One-time extraction from existing `jobs.apply_url` values:

1. Query all distinct `apply_url` values from `jobs` table
2. Pattern-match for ATS slugs:
   - Greenhouse: `boards.greenhouse.io/{slug}/` or `job-boards.greenhouse.io/{slug}/`
   - Lever: `jobs.lever.co/{slug}/`
   - Ashby: `jobs.ashbyhq.com/{slug}/`
   - SmartRecruiters: `jobs.smartrecruiters.com/{slug}/`
3. Pair each slug with the `company` name from the job record
4. Deduplicate by `(ats_platform, slug)`
5. Insert into `companies` table
6. Backfill `logo_url` with Google favicon: `https://www.google.com/s2/favicons?domain={domain}&sz=64`
7. Backfill `domain` from slug where obvious (e.g., slug "stripe" → "stripe.com")

**Expected yield:** ~100-200 companies with Greenhouse/Lever boards, plus some Ashby/SmartRecruiters.

## Jobs Table Changes

```sql
-- New columns
ALTER TABLE jobs ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE jobs ADD COLUMN ats_job_id TEXT;
ALTER TABLE jobs ADD COLUMN description TEXT;
ALTER TABLE jobs ADD COLUMN department TEXT;
ALTER TABLE jobs ADD COLUMN normalized_key TEXT;
ALTER TABLE jobs ADD COLUMN source_platform TEXT;  -- 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'remoteok' | 'github'
ALTER TABLE jobs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill source_platform for existing GitHub-sourced jobs
UPDATE jobs SET source_platform = 'github' WHERE source_id IS NOT NULL;

-- Make source_id nullable (legacy GitHub jobs keep theirs, new ATS jobs use company_id)
ALTER TABLE jobs ALTER COLUMN source_id DROP NOT NULL;

-- Index for dedup
CREATE UNIQUE INDEX idx_jobs_normalized_key ON jobs(normalized_key) WHERE normalized_key IS NOT NULL;

-- Index for staleness check
CREATE INDEX idx_jobs_company_active ON jobs(company_id, is_active) WHERE company_id IS NOT NULL;
```

### Backfill: Link existing jobs to companies

After the company registry is populated, backfill `company_id` on existing jobs by matching `apply_url` patterns to company slugs. This ensures staleness logic covers legacy jobs too.

```sql
-- Example: backfill Greenhouse-sourced legacy jobs
UPDATE jobs j SET company_id = c.id
FROM companies c
WHERE c.ats_platform = 'greenhouse'
  AND j.apply_url LIKE '%greenhouse.io/' || c.slug || '/%'
  AND j.company_id IS NULL;
-- Repeat for lever, ashby, smartrecruiters patterns
```

## Sync Pipeline

### Endpoint: `POST /api/jobs/sync-ats`

Auth: `CRON_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` via Bearer token.

### Flow

```
For each active company in companies table:
  1. Fetch all jobs from ATS API
  2. Filter: keep only SWE-related titles
  3. Classify: internship / new_grad / fulltime
  4. For each job:
     a. Compute normalized_key = lower(company_name | title | location)
     b. Check if normalized_key exists in DB
     c. If exists: update fields (title, location, apply_url, etc.)
     d. If new: insert
  5. Deactivate: any job with this company_id that wasn't in the API response
  6. Update company.last_synced_at

Then bulk RemoteOK sync:
  1. Fetch remoteok.com/api
  2. Filter SWE titles
  3. For each job:
     a. Compute normalized_key
     b. Skip if normalized_key already exists (ATS source wins)
     c. Insert remainder

Then JSearch enrichment (existing endpoint):
  - Fill salary/skills/logo gaps on unenriched jobs
```

### SWE Title Filter

Keep jobs where title contains any of (case-insensitive):
```
software, engineer, developer, swe, frontend, backend, fullstack,
full-stack, full stack, devops, sre, infrastructure, platform,
data engineer, ML engineer, machine learning, mobile, iOS, android,
cloud, systems, embedded, security engineer, QA, SDET, test engineer
```

### Job Type Classification

From title keywords (case-insensitive, checked in order):

1. **Internship:** `intern, co-op, coop, internship`
2. **New Grad:** `new grad, new-grad, entry level, entry-level, junior, associate, university, early career, recent graduate, early-career`
3. **Full Time:** everything else that passed the SWE filter

### Normalization for Dedup

```typescript
function normalizeKey(company: string, title: string, location: string | null): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const loc = location ? norm(location) : 'unknown'
  return `${norm(company)}|${norm(title)}|${loc}`
}
```

**Known trade-off:** When `location` is null/empty for two genuinely different roles with the same title at the same company, they'll collide and only one is kept. This is acceptable — better to occasionally merge two similar postings than to allow widespread duplicates across sources.

### Dedup Priority

When the same normalized_key appears from multiple sources:
1. Greenhouse (most structured, departments)
2. Lever (good categories/team data)
3. Ashby (good metadata, remote flags)
4. SmartRecruiters
5. RemoteOK (least structured)

Higher-priority source overwrites lower. This is enforced by sync order — ATS sources run first, RemoteOK skips existing keys.

### Staleness / Auto-Deactivate

After syncing a company, any job with that `company_id` that has `is_active = true` but whose `ats_job_id` was NOT in the latest API response gets set to `is_active = false`.

This means the jobs page always reflects what's actually open.

## ATS Client Modules

### `lib/ats/greenhouse.ts`

```typescript
interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  updated_at: string
  departments: { name: string }[]
}

async function fetchGreenhouseJobs(slug: string): Promise<GreenhouseJob[]>
// GET boards-api.greenhouse.io/v1/boards/{slug}/jobs
// NOTE: Do NOT use ?content=true — it returns full HTML descriptions and
// blows up response size for large companies. Departments are included
// without it. If descriptions are needed later, fetch individual jobs.
```

### `lib/ats/lever.ts`

```typescript
interface LeverJob {
  id: string
  text: string  // title
  categories: { team: string; location: string; commitment: string }
  applyUrl: string
  hostedUrl: string
  additionalPlain?: string  // salary sometimes buried here, not a structured field
}

async function fetchLeverJobs(slug: string): Promise<LeverJob[]>
// GET api.lever.co/v0/postings/{slug}?mode=json
// IMPORTANT: ?mode=json is required or you get HTML back
// Supports pagination: ?skip=0&limit=100 — must paginate for large boards
```

### `lib/ats/ashby.ts`

```typescript
interface AshbyResponse {
  jobs: AshbyJob[]  // top-level response wraps jobs in { jobs: [...] }
}

interface AshbyJob {
  id: string
  title: string
  department: string
  team: string
  location: string
  secondaryLocations: string[]
  employmentType: string
  isRemote: boolean
  jobUrl: string
  applyUrl: string
}

async function fetchAshbyJobs(slug: string): Promise<AshbyJob[]>
// GET api.ashbyhq.com/posting-api/job-board/{slug}
// Response: { jobs: AshbyJob[] } — destructure .jobs
```

### `lib/ats/smartrecruiters.ts`

```typescript
interface SmartRecruitersResponse {
  offset: number
  limit: number
  totalFound: number
  content: SmartRecruitersJob[]
}

interface SmartRecruitersJob {
  id: string
  name: string  // title
  ref: string   // API self-link
  location: { city: string; region: string; country: string; remote: boolean }
  department: { id: string; label: string }
  // NOTE: applyUrl is NOT in listing response.
  // Construct as: https://jobs.smartrecruiters.com/{companySlug}/{id}
}

async function fetchSmartRecruitersJobs(slug: string): Promise<SmartRecruitersJob[]>
// GET api.smartrecruiters.com/v1/companies/{slug}/postings?limit=100&offset=0
// MUST paginate: default limit=100, use offset to get all pages
// Loop until offset >= totalFound
```

### `lib/ats/remoteok.ts`

```typescript
interface RemoteOKJob {
  id: string
  slug: string
  company: string
  position: string
  tags: string[]
  location: string
  salary_min: number
  salary_max: number
  apply_url: string
  description: string
  date: string
}

async function fetchRemoteOKJobs(): Promise<RemoteOKJob[]>
// GET remoteok.com/api (returns array, first element is metadata — skip it)
// IMPORTANT: Must set User-Agent header or request returns 403
```

### `lib/ats/classify.ts`

```typescript
function isSWERole(title: string): boolean
function classifyJobType(title: string): 'internship' | 'new_grad' | 'fulltime'
function normalizeKey(company: string, title: string, location: string | null): string
```

## Concurrency & Rate Limiting

ATS APIs rate-limit aggressive scrapers. The sync endpoint must:

- Process companies in batches of **5 concurrent** requests per ATS platform
- Add a **200ms delay** between batches
- Use `Promise.allSettled` so one company failure doesn't abort the run
- Log per-company success/failure for debugging

## Source Tracking

Jobs from different sources need identification:

- ATS-sourced jobs: `company_id` is set, `source_id` is null
- RemoteOK jobs: both `company_id` and `source_id` are null, identified by `source_platform = 'remoteok'`
- Legacy GitHub jobs: `source_id` is set, `company_id` is null

Add `source_platform TEXT` column to `jobs` table to track origin: `'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'remoteok' | 'github'`

## What Gets Removed

| File | Reason |
|------|--------|
| `lib/github/sync.ts` | Replaced by ATS clients |
| `app/api/jobs/sync/route.ts` | Replaced by `sync-ats` |
| `app/api/jobs/cleanup-arrow/route.ts` | No more ↳ rows |

## What Stays Unchanged

| File | Reason |
|------|--------|
| `app/api/jobs/enrich/route.ts` | Still fills salary/skills/logo gaps |
| `app/api/jobs/check-links/route.ts` | Secondary staleness check |
| `components/jobs/JobCard.tsx` | Reads same Job interface fields |
| `components/jobs/JobFilters.tsx` | Same three tabs |
| `app/(dashboard)/jobs/page.tsx` | Same query structure |
| `lib/types.ts` | Extended, not replaced |
| `lib/utils.ts` | Utilities still used |

## What Needs Minor Updates

| File | Change |
|------|--------|
| `app/api/jobs/route.ts` | Update query to join on `companies` table for ATS-sourced jobs (currently joins only `job_sources`) |
| `middleware.ts` | Add `/api/jobs/sync-ats` and `/api/companies/seed` to public whitelist; remove `/api/jobs/cleanup-arrow` |

## Type Changes

```typescript
// lib/types.ts additions
interface Company {
  id: string
  name: string
  slug: string
  ats_platform: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
  domain: string | null
  logo_url: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

// Job interface additions
interface Job {
  // ... existing fields ...
  company_id?: string | null
  ats_job_id?: string | null
  description?: string | null
  department?: string | null
  normalized_key?: string | null
  source_platform?: string | null  // 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'remoteok' | 'github'
  updated_at?: string | null
}
```

## Middleware

Add to public path whitelist in `middleware.ts`:
- `/api/jobs/sync-ats`
- `/api/companies/seed`

## Manual Steps Required

1. Run migration SQL in Supabase dashboard (provided in implementation)
2. Run the company seed endpoint once to populate the registry
3. Run sync-ats to do the first full sync
4. Run enrichment to fill gaps
5. Optionally add `RAPIDAPI_KEY` to Vercel env if not already set (it is)
