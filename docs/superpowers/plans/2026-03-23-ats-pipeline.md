# ATS Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace GitHub markdown repo scraping with a multi-source ATS pipeline pulling structured JSON from Greenhouse, Lever, Ashby, SmartRecruiters, and RemoteOK public APIs.

**Architecture:** Company registry table stores ATS board slugs. Per-platform client modules fetch jobs, a classify module filters SWE titles and tags job type, a sync orchestrator deduplicates via normalized keys and auto-deactivates stale listings. JSearch remains for enrichment only.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgreSQL), Vitest

**Spec:** `docs/superpowers/specs/2026-03-23-ats-pipeline-design.md`

---

## File Structure

```
lib/ats/
  classify.ts        — isSWERole(), classifyJobType(), normalizeKey()
  greenhouse.ts      — fetchGreenhouseJobs() client
  lever.ts           — fetchLeverJobs() client (paginated, ?mode=json)
  ashby.ts           — fetchAshbyJobs() client (destructure .jobs)
  smartrecruiters.ts — fetchSmartRecruitersJobs() client (paginated)
  remoteok.ts        — fetchRemoteOKJobs() client (User-Agent required)
  types.ts           — shared StandardizedJob interface for all clients

app/api/companies/seed/route.ts   — one-time company registry population
app/api/jobs/sync-ats/route.ts    — main sync orchestrator

lib/types.ts         — MODIFY: add Company interface, extend Job
middleware.ts        — MODIFY: update public path whitelist
app/api/jobs/route.ts — MODIFY: join on companies table

__tests__/lib/ats/classify.test.ts      — tests for classify module
__tests__/lib/ats/greenhouse.test.ts    — tests for greenhouse client
__tests__/lib/ats/lever.test.ts         — tests for lever client
__tests__/lib/ats/ashby.test.ts         — tests for ashby client
__tests__/lib/ats/smartrecruiters.test.ts — tests for smartrecruiters client
__tests__/lib/ats/remoteok.test.ts      — tests for remoteok client

supabase/migrations/20260323_ats_pipeline.sql — migration (user runs manually)
```

**Files to delete after all tasks complete:**
- `lib/github/sync.ts`
- `app/api/jobs/sync/route.ts`
- `app/api/jobs/cleanup-arrow/route.ts`

---

### Task 1: Migration SQL + Types

**Files:**
- Create: `autoapply/apps/web/supabase/migrations/20260323_ats_pipeline.sql`
- Modify: `autoapply/apps/web/lib/types.ts`

- [ ] **Step 1: Write the migration SQL**

Create `autoapply/apps/web/supabase/migrations/20260323_ats_pipeline.sql`:

```sql
-- Companies registry
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ats_platform, slug)
);

CREATE INDEX idx_companies_active_platform ON companies(is_active, ats_platform);

-- Jobs table additions
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ats_job_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS normalized_key TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_platform TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing jobs
UPDATE jobs SET source_platform = 'github' WHERE source_id IS NOT NULL AND source_platform IS NULL;

-- Make source_id nullable
ALTER TABLE jobs ALTER COLUMN source_id DROP NOT NULL;

-- Dedup index
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_normalized_key ON jobs(normalized_key) WHERE normalized_key IS NOT NULL;

-- Staleness index
CREATE INDEX IF NOT EXISTS idx_jobs_company_active ON jobs(company_id, is_active) WHERE company_id IS NOT NULL;
```

- [ ] **Step 2: Update types**

In `autoapply/apps/web/lib/types.ts`, add `Company` interface and extend `Job`:

```typescript
export type ATSPlatform = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
export type SourcePlatform = ATSPlatform | 'remoteok' | 'github'

export interface Company {
  id: string
  name: string
  slug: string
  ats_platform: ATSPlatform
  domain: string | null
  logo_url: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}
```

Change `source_id` from required to optional (new ATS jobs won't have one):

```typescript
  source_id?: string | null  // was: source_id: string
```

Add to the existing `Job` interface (after `enriched_at`):

```typescript
  company_id?: string | null
  ats_job_id?: string | null
  description?: string | null
  department?: string | null
  normalized_key?: string | null
  source_platform?: SourcePlatform | null
  updated_at?: string | null
```

Update `JobWithScore` to optionally include `company`:

```typescript
export interface JobWithScore extends Job {
  score?: JobScore | null
  source?: JobSource | null
  job_scores?: JobScore[]
  company?: Company | null
}
```

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/supabase/migrations/20260323_ats_pipeline.sql autoapply/apps/web/lib/types.ts
git commit -m "feat: add companies table migration and extend Job/Company types"
```

---

### Task 2: Classify Module (SWE Filter + Job Type + Dedup Key)

**Files:**
- Create: `autoapply/apps/web/lib/ats/classify.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/classify.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/classify.test.ts`:

```typescript
import { isSWERole, classifyJobType, normalizeKey } from '@/lib/ats/classify'

describe('isSWERole', () => {
  it('matches standard software engineering titles', () => {
    expect(isSWERole('Software Engineer')).toBe(true)
    expect(isSWERole('Senior Software Developer')).toBe(true)
    expect(isSWERole('Frontend Engineer')).toBe(true)
    expect(isSWERole('Backend Developer')).toBe(true)
    expect(isSWERole('Full Stack Engineer')).toBe(true)
    expect(isSWERole('Full-Stack Developer')).toBe(true)
    expect(isSWERole('SWE Intern')).toBe(true)
    expect(isSWERole('DevOps Engineer')).toBe(true)
    expect(isSWERole('SRE')).toBe(true)
    expect(isSWERole('Platform Engineer')).toBe(true)
    expect(isSWERole('ML Engineer')).toBe(true)
    expect(isSWERole('Data Engineer')).toBe(true)
    expect(isSWERole('Mobile Developer')).toBe(true)
    expect(isSWERole('iOS Engineer')).toBe(true)
    expect(isSWERole('Android Developer')).toBe(true)
    expect(isSWERole('Infrastructure Engineer')).toBe(true)
    expect(isSWERole('Cloud Engineer')).toBe(true)
    expect(isSWERole('Systems Engineer')).toBe(true)
    expect(isSWERole('Embedded Software Engineer')).toBe(true)
    expect(isSWERole('Security Engineer')).toBe(true)
    expect(isSWERole('QA Engineer')).toBe(true)
    expect(isSWERole('SDET')).toBe(true)
    expect(isSWERole('Test Engineer')).toBe(true)
  })

  it('rejects non-SWE titles', () => {
    expect(isSWERole('Product Manager')).toBe(false)
    expect(isSWERole('Marketing Director')).toBe(false)
    expect(isSWERole('Sales Representative')).toBe(false)
    expect(isSWERole('HR Coordinator')).toBe(false)
    expect(isSWERole('Recruiter')).toBe(false)
    expect(isSWERole('Office Manager')).toBe(false)
    expect(isSWERole('Data Analyst')).toBe(false)
    expect(isSWERole('Business Analyst')).toBe(false)
  })
})

describe('classifyJobType', () => {
  it('classifies internship titles', () => {
    expect(classifyJobType('Software Engineer Intern')).toBe('internship')
    expect(classifyJobType('SWE Internship - Summer 2026')).toBe('internship')
    expect(classifyJobType('Co-Op Software Developer')).toBe('internship')
    expect(classifyJobType('Engineering Coop')).toBe('internship')
  })

  it('classifies new grad titles', () => {
    expect(classifyJobType('Software Engineer, New Grad')).toBe('new_grad')
    expect(classifyJobType('New-Grad Software Engineer')).toBe('new_grad')
    expect(classifyJobType('Entry Level Developer')).toBe('new_grad')
    expect(classifyJobType('Junior Software Engineer')).toBe('new_grad')
    expect(classifyJobType('Associate Software Engineer')).toBe('new_grad')
    expect(classifyJobType('University Graduate Engineer')).toBe('new_grad')
    expect(classifyJobType('Early Career Software Engineer')).toBe('new_grad')
  })

  it('classifies everything else as fulltime', () => {
    expect(classifyJobType('Senior Software Engineer')).toBe('fulltime')
    expect(classifyJobType('Staff Engineer')).toBe('fulltime')
    expect(classifyJobType('Principal Developer')).toBe('fulltime')
  })

  it('prioritizes internship over new grad keywords', () => {
    expect(classifyJobType('Junior Intern Developer')).toBe('internship')
  })
})

describe('normalizeKey', () => {
  it('lowercases and strips non-alphanumeric', () => {
    expect(normalizeKey('Google', 'Software Engineer', 'Mountain View, CA'))
      .toBe('google|softwareengineer|mountainviewca')
  })

  it('uses "unknown" for null location', () => {
    expect(normalizeKey('Stripe', 'SWE', null))
      .toBe('stripe|swe|unknown')
  })

  it('produces same key for punctuation variants', () => {
    const a = normalizeKey('Google', 'Software Engineer - Backend', 'NYC')
    const b = normalizeKey('Google', 'Software Engineer, Backend', 'NYC')
    expect(a).toBe(b)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/classify.test.ts`
Expected: FAIL — module `@/lib/ats/classify` not found

- [ ] **Step 3: Write the classify module**

Create `autoapply/apps/web/lib/ats/classify.ts`:

```typescript
const SWE_KEYWORDS = [
  'software', 'engineer', 'developer', 'swe',
  'frontend', 'backend', 'fullstack', 'full-stack', 'full stack',
  'devops', 'sre', 'infrastructure', 'platform',
  'data engineer', 'ml engineer', 'machine learning',
  'mobile', 'ios', 'android',
  'cloud', 'systems', 'embedded',
  'security engineer', 'qa', 'sdet', 'test engineer',
]

const INTERNSHIP_KEYWORDS = ['intern', 'co-op', 'coop', 'internship']

const NEW_GRAD_KEYWORDS = [
  'new grad', 'new-grad', 'entry level', 'entry-level',
  'junior', 'associate', 'university', 'early career',
  'recent graduate', 'early-career',
]

export function isSWERole(title: string): boolean {
  const lower = title.toLowerCase()
  return SWE_KEYWORDS.some(kw => lower.includes(kw))
}

export function classifyJobType(title: string): 'internship' | 'new_grad' | 'fulltime' {
  const lower = title.toLowerCase()
  if (INTERNSHIP_KEYWORDS.some(kw => lower.includes(kw))) return 'internship'
  if (NEW_GRAD_KEYWORDS.some(kw => lower.includes(kw))) return 'new_grad'
  return 'fulltime'
}

export function normalizeKey(company: string, title: string, location: string | null): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const loc = location ? norm(location) : 'unknown'
  return `${norm(company)}|${norm(title)}|${loc}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/classify.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/classify.ts autoapply/apps/web/__tests__/lib/ats/classify.test.ts
git commit -m "feat: add classify module — SWE filter, job type, dedup key"
```

---

### Task 3: Shared ATS Types

**Files:**
- Create: `autoapply/apps/web/lib/ats/types.ts`

- [ ] **Step 1: Write the standardized job interface**

Create `autoapply/apps/web/lib/ats/types.ts`:

```typescript
import type { SourcePlatform } from '@/lib/types'

/** Standardized job shape that all ATS clients convert to before passing to the sync orchestrator */
export interface StandardizedJob {
  ats_job_id: string
  title: string
  company: string
  location: string | null
  department: string | null
  apply_url: string
  remote_policy: string | null   // 'remote' | 'hybrid' | 'onsite' | null
  description: string | null
  posted_at: string | null       // ISO timestamp
  source_platform: SourcePlatform
  salary_min: number | null
  salary_max: number | null
  tags: string[]                 // skills/tags from RemoteOK
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/lib/ats/types.ts
git commit -m "feat: add StandardizedJob interface for ATS client output"
```

---

### Task 4: Greenhouse Client

**Files:**
- Create: `autoapply/apps/web/lib/ats/greenhouse.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/greenhouse.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/greenhouse.test.ts`:

```typescript
import { fetchGreenhouseJobs, toStandardized } from '@/lib/ats/greenhouse'
import type { StandardizedJob } from '@/lib/ats/types'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_RESPONSE = {
  jobs: [
    {
      id: 12345,
      title: 'Software Engineer',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/12345',
      location: { name: 'San Francisco, CA' },
      updated_at: '2026-03-20T00:00:00Z',
      departments: [{ name: 'Engineering' }],
    },
    {
      id: 12346,
      title: 'Product Manager',
      absolute_url: 'https://boards.greenhouse.io/stripe/jobs/12346',
      location: { name: 'Remote' },
      updated_at: '2026-03-20T00:00:00Z',
      departments: [{ name: 'Product' }],
    },
  ],
}

describe('fetchGreenhouseJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('fetches jobs from the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })
    await fetchGreenhouseJobs('stripe')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('returns all jobs from the response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })
    const jobs = await fetchGreenhouseJobs('stripe')
    expect(jobs).toHaveLength(2)
  })

  it('returns empty array on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    const jobs = await fetchGreenhouseJobs('stripe')
    expect(jobs).toEqual([])
  })
})

describe('toStandardized', () => {
  it('converts a Greenhouse job to StandardizedJob', () => {
    const result: StandardizedJob = toStandardized(MOCK_RESPONSE.jobs[0], 'Stripe')
    expect(result.ats_job_id).toBe('gh_12345')
    expect(result.title).toBe('Software Engineer')
    expect(result.company).toBe('Stripe')
    expect(result.location).toBe('San Francisco, CA')
    expect(result.department).toBe('Engineering')
    expect(result.apply_url).toBe('https://boards.greenhouse.io/stripe/jobs/12345')
    expect(result.source_platform).toBe('greenhouse')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/greenhouse.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the Greenhouse client**

Create `autoapply/apps/web/lib/ats/greenhouse.ts`:

```typescript
import type { StandardizedJob } from './types'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  updated_at: string
  departments: { name: string }[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

export function toStandardized(job: GreenhouseJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `gh_${job.id}`,
    title: job.title,
    company: companyName,
    location: job.location?.name || null,
    department: job.departments?.[0]?.name || null,
    apply_url: job.absolute_url,
    remote_policy: job.location?.name?.toLowerCase().includes('remote') ? 'remote' : null,
    description: null,   // Not fetched without ?content=true
    posted_at: job.updated_at,
    source_platform: 'greenhouse',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchGreenhouseJobs(slug: string): Promise<GreenhouseJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: GreenhouseResponse = await res.json()
    return data.jobs || []
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/greenhouse.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/greenhouse.ts autoapply/apps/web/__tests__/lib/ats/greenhouse.test.ts
git commit -m "feat: add Greenhouse public API client"
```

---

### Task 5: Lever Client

**Files:**
- Create: `autoapply/apps/web/lib/ats/lever.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/lever.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/lever.test.ts`:

```typescript
import { fetchLeverJobs, toStandardized } from '@/lib/ats/lever'
import type { StandardizedJob } from '@/lib/ats/types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'abc-123',
  text: 'Backend Engineer',
  categories: { team: 'Platform', location: 'New York, NY', commitment: 'Full-time' },
  applyUrl: 'https://jobs.lever.co/company/abc-123/apply',
  hostedUrl: 'https://jobs.lever.co/company/abc-123',
  additionalPlain: 'Salary: $120k-$180k',
}

describe('fetchLeverJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('uses ?mode=json query parameter', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_JOB] })
    await fetchLeverJobs('company')
    expect(mockFetch.mock.calls[0][0]).toContain('mode=json')
  })

  it('paginates when response has 100 items', async () => {
    const page1 = Array(100).fill(MOCK_JOB)
    const page2 = [MOCK_JOB]
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 })
    const jobs = await fetchLeverJobs('company')
    expect(jobs).toHaveLength(101)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('stops paginating when response has fewer than 100 items', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_JOB] })
    await fetchLeverJobs('company')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('toStandardized', () => {
  it('converts a Lever job to StandardizedJob', () => {
    const result: StandardizedJob = toStandardized(MOCK_JOB, 'Company')
    expect(result.ats_job_id).toBe('lv_abc-123')
    expect(result.title).toBe('Backend Engineer')
    expect(result.location).toBe('New York, NY')
    expect(result.apply_url).toBe('https://jobs.lever.co/company/abc-123/apply')
    expect(result.source_platform).toBe('lever')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/lever.test.ts`

- [ ] **Step 3: Write the Lever client**

Create `autoapply/apps/web/lib/ats/lever.ts`:

```typescript
import type { StandardizedJob } from './types'

interface LeverJob {
  id: string
  text: string
  categories: { team: string; location: string; commitment: string }
  applyUrl: string
  hostedUrl: string
  additionalPlain?: string
}

export function toStandardized(job: LeverJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `lv_${job.id}`,
    title: job.text,
    company: companyName,
    location: job.categories?.location || null,
    department: job.categories?.team || null,
    apply_url: job.applyUrl,
    remote_policy: job.categories?.location?.toLowerCase().includes('remote') ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'lever',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

const PAGE_SIZE = 100

export async function fetchLeverJobs(slug: string): Promise<LeverJob[]> {
  const all: LeverJob[] = []
  let skip = 0

  try {
    while (true) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(
        `https://api.lever.co/v0/postings/${slug}?mode=json&limit=${PAGE_SIZE}&skip=${skip}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (!res.ok) break
      const page: LeverJob[] = await res.json()
      all.push(...page)
      if (page.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }
  } catch {
    // Return whatever we collected
  }
  return all
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/lever.test.ts`

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/lever.ts autoapply/apps/web/__tests__/lib/ats/lever.test.ts
git commit -m "feat: add Lever public API client with pagination"
```

---

### Task 6: Ashby Client

**Files:**
- Create: `autoapply/apps/web/lib/ats/ashby.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/ashby.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/ashby.test.ts`:

```typescript
import { fetchAshbyJobs, toStandardized } from '@/lib/ats/ashby'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'ashby-1',
  title: 'Software Engineer',
  department: 'Engineering',
  team: 'Backend',
  location: 'San Francisco',
  secondaryLocations: ['New York'],
  employmentType: 'FullTime',
  isRemote: false,
  jobUrl: 'https://jobs.ashbyhq.com/ramp/ashby-1',
  applyUrl: 'https://jobs.ashbyhq.com/ramp/ashby-1/apply',
}

describe('fetchAshbyJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('destructures .jobs from response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [MOCK_JOB] }),
    })
    const jobs = await fetchAshbyJobs('ramp')
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Software Engineer')
  })
})

describe('toStandardized', () => {
  it('converts an Ashby job with remote flag', () => {
    const remote = { ...MOCK_JOB, isRemote: true }
    const result = toStandardized(remote, 'Ramp')
    expect(result.remote_policy).toBe('remote')
    expect(result.ats_job_id).toBe('ab_ashby-1')
    expect(result.source_platform).toBe('ashby')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/ashby.test.ts`

- [ ] **Step 3: Write the Ashby client**

Create `autoapply/apps/web/lib/ats/ashby.ts`:

```typescript
import type { StandardizedJob } from './types'

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

export function toStandardized(job: AshbyJob, companyName: string): StandardizedJob {
  return {
    ats_job_id: `ab_${job.id}`,
    title: job.title,
    company: companyName,
    location: job.location || null,
    department: job.department || job.team || null,
    apply_url: job.applyUrl || job.jobUrl,
    remote_policy: job.isRemote ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'ashby',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchAshbyJobs(slug: string): Promise<AshbyJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: { jobs: AshbyJob[] } = await res.json()
    return data.jobs || []
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/ashby.test.ts`

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/ashby.ts autoapply/apps/web/__tests__/lib/ats/ashby.test.ts
git commit -m "feat: add Ashby public API client"
```

---

### Task 7: SmartRecruiters Client

**Files:**
- Create: `autoapply/apps/web/lib/ats/smartrecruiters.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/smartrecruiters.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/smartrecruiters.test.ts`:

```typescript
import { fetchSmartRecruitersJobs, toStandardized } from '@/lib/ats/smartrecruiters'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_JOB = {
  id: 'sr-1',
  name: 'Frontend Engineer',
  ref: 'https://api.smartrecruiters.com/v1/companies/visa/postings/sr-1',
  location: { city: 'Austin', region: 'TX', country: 'US', remote: false },
  department: { id: 'dept-1', label: 'Engineering' },
}

describe('fetchSmartRecruitersJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('paginates through all pages', async () => {
    const page1 = {
      offset: 0, limit: 100, totalFound: 150,
      content: Array(100).fill(MOCK_JOB),
    }
    const page2 = {
      offset: 100, limit: 100, totalFound: 150,
      content: Array(50).fill(MOCK_JOB),
    }
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 })
    const jobs = await fetchSmartRecruitersJobs('visa')
    expect(jobs).toHaveLength(150)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

describe('toStandardized', () => {
  it('constructs apply URL from slug and id', () => {
    const result = toStandardized(MOCK_JOB, 'Visa', 'visa')
    expect(result.apply_url).toBe('https://jobs.smartrecruiters.com/visa/sr-1')
    expect(result.ats_job_id).toBe('sr_sr-1')
    expect(result.location).toBe('Austin, TX, US')
    expect(result.source_platform).toBe('smartrecruiters')
  })

  it('detects remote from location flag', () => {
    const remote = { ...MOCK_JOB, location: { ...MOCK_JOB.location, remote: true } }
    const result = toStandardized(remote, 'Visa', 'visa')
    expect(result.remote_policy).toBe('remote')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/smartrecruiters.test.ts`

- [ ] **Step 3: Write the SmartRecruiters client**

Create `autoapply/apps/web/lib/ats/smartrecruiters.ts`:

```typescript
import type { StandardizedJob } from './types'

interface SmartRecruitersJob {
  id: string
  name: string
  ref: string
  location: { city: string; region: string; country: string; remote: boolean }
  department: { id: string; label: string }
}

interface SmartRecruitersResponse {
  offset: number
  limit: number
  totalFound: number
  content: SmartRecruitersJob[]
}

export function toStandardized(
  job: SmartRecruitersJob,
  companyName: string,
  companySlug: string
): StandardizedJob {
  const parts = [job.location?.city, job.location?.region, job.location?.country].filter(Boolean)
  return {
    ats_job_id: `sr_${job.id}`,
    title: job.name,
    company: companyName,
    location: parts.length ? parts.join(', ') : null,
    department: job.department?.label || null,
    apply_url: `https://jobs.smartrecruiters.com/${companySlug}/${job.id}`,
    remote_policy: job.location?.remote ? 'remote' : null,
    description: null,
    posted_at: null,
    source_platform: 'smartrecruiters',
    salary_min: null,
    salary_max: null,
    tags: [],
  }
}

export async function fetchSmartRecruitersJobs(slug: string): Promise<SmartRecruitersJob[]> {
  const all: SmartRecruitersJob[] = []
  let offset = 0
  const limit = 100

  try {
    while (true) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(
        `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=${limit}&offset=${offset}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (!res.ok) break
      const data: SmartRecruitersResponse = await res.json()
      all.push(...data.content)
      offset += limit
      if (offset >= data.totalFound) break
    }
  } catch {
    // Return whatever we collected
  }
  return all
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/smartrecruiters.test.ts`

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/smartrecruiters.ts autoapply/apps/web/__tests__/lib/ats/smartrecruiters.test.ts
git commit -m "feat: add SmartRecruiters public API client with pagination"
```

---

### Task 8: RemoteOK Client

**Files:**
- Create: `autoapply/apps/web/lib/ats/remoteok.ts`
- Create: `autoapply/apps/web/__tests__/lib/ats/remoteok.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `autoapply/apps/web/__tests__/lib/ats/remoteok.test.ts`:

```typescript
import { fetchRemoteOKJobs, toStandardized } from '@/lib/ats/remoteok'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_META = { '0': 'legal notice', last_updated: '2026-03-23' }
const MOCK_JOB = {
  id: '1234',
  slug: 'swe-at-company',
  company: 'CoolStartup',
  position: 'Software Engineer',
  tags: ['javascript', 'react', 'node'],
  location: 'Worldwide',
  salary_min: 100000,
  salary_max: 150000,
  apply_url: 'https://remoteok.com/l/1234',
  description: '<p>Build stuff</p>',
  date: '2026-03-20T00:00:00Z',
}

describe('fetchRemoteOKJobs', () => {
  beforeEach(() => mockFetch.mockReset())

  it('sets User-Agent header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_META, MOCK_JOB] })
    await fetchRemoteOKJobs()
    const headers = mockFetch.mock.calls[0][1]?.headers
    expect(headers?.['User-Agent']).toBeDefined()
  })

  it('skips the first metadata element', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [MOCK_META, MOCK_JOB] })
    const jobs = await fetchRemoteOKJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].position).toBe('Software Engineer')
  })
})

describe('toStandardized', () => {
  it('converts a RemoteOK job', () => {
    const result = toStandardized(MOCK_JOB)
    expect(result.ats_job_id).toBe('rok_1234')
    expect(result.title).toBe('Software Engineer')
    expect(result.company).toBe('CoolStartup')
    expect(result.salary_min).toBe(100000)
    expect(result.salary_max).toBe(150000)
    expect(result.tags).toEqual(['javascript', 'react', 'node'])
    expect(result.remote_policy).toBe('remote')
    expect(result.source_platform).toBe('remoteok')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/remoteok.test.ts`

- [ ] **Step 3: Write the RemoteOK client**

Create `autoapply/apps/web/lib/ats/remoteok.ts`:

```typescript
import type { StandardizedJob } from './types'

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

export function toStandardized(job: RemoteOKJob): StandardizedJob {
  return {
    ats_job_id: `rok_${job.id}`,
    title: job.position,
    company: job.company,
    location: job.location || 'Remote',
    department: null,
    apply_url: job.apply_url || `https://remoteok.com/l/${job.id}`,
    remote_policy: 'remote',
    description: null,
    posted_at: job.date || null,
    source_platform: 'remoteok',
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    tags: job.tags || [],
  }
}

export async function fetchRemoteOKJobs(): Promise<RemoteOKJob[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'AutoApply/1.0 (job-tracker)' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data: unknown[] = await res.json()
    // First element is metadata, skip it
    return data.slice(1) as RemoteOKJob[]
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ats/remoteok.test.ts`

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/ats/remoteok.ts autoapply/apps/web/__tests__/lib/ats/remoteok.test.ts
git commit -m "feat: add RemoteOK API client with User-Agent header"
```

---

### Task 9: Company Seed Endpoint

**Files:**
- Create: `autoapply/apps/web/app/api/companies/seed/route.ts`

- [ ] **Step 1: Write the seed endpoint**

Create `autoapply/apps/web/app/api/companies/seed/route.ts`:

```typescript
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ATS_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: 'greenhouse', regex: /(?:boards|job-boards)\.greenhouse\.io\/([a-zA-Z0-9_-]+)/ },
  { platform: 'lever', regex: /jobs\.lever\.co\/([a-zA-Z0-9_-]+)/ },
  { platform: 'ashby', regex: /jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/ },
  { platform: 'smartrecruiters', regex: /jobs\.smartrecruiters\.com\/([a-zA-Z0-9_-]+)/ },
]

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all distinct apply_url + company pairs
  const { data: jobs } = await adminClient
    .from('jobs')
    .select('apply_url, company')
    .not('apply_url', 'is', null)

  if (!jobs?.length) return NextResponse.json({ seeded: 0, message: 'No jobs with apply URLs' })

  // Extract ATS slugs
  const seen = new Set<string>()
  const companies: { name: string; slug: string; ats_platform: string; domain: string | null }[] = []

  for (const job of jobs) {
    if (!job.apply_url) continue
    for (const { platform, regex } of ATS_PATTERNS) {
      const match = job.apply_url.match(regex)
      if (!match) continue
      const slug = match[1].toLowerCase()
      const key = `${platform}:${slug}`
      if (seen.has(key)) continue
      seen.add(key)

      // Guess domain from slug
      const domain = `${slug.replace(/-/g, '')}.com`

      companies.push({
        name: job.company?.replace(/^↳\s*/, '') || slug,
        slug,
        ats_platform: platform,
        domain,
      })
    }
  }

  if (!companies.length) return NextResponse.json({ seeded: 0, message: 'No ATS URLs found' })

  // Upsert companies (ignore conflicts on unique constraint)
  const { data: inserted, error } = await adminClient
    .from('companies')
    .upsert(
      companies.map(c => ({
        ...c,
        logo_url: c.domain
          ? `https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`
          : null,
      })),
      { onConflict: 'ats_platform,slug', ignoreDuplicates: true }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Backfill company_id on existing jobs
  const { data: allCompanies } = await adminClient
    .from('companies')
    .select('id, slug, ats_platform')

  if (allCompanies) {
    for (const company of allCompanies) {
      let pattern: string
      switch (company.ats_platform) {
        case 'greenhouse': pattern = `%greenhouse.io/${company.slug}/%`; break
        case 'lever': pattern = `%lever.co/${company.slug}/%`; break
        case 'ashby': pattern = `%ashbyhq.com/${company.slug}/%`; break
        case 'smartrecruiters': pattern = `%smartrecruiters.com/${company.slug}/%`; break
        default: continue
      }
      await adminClient
        .from('jobs')
        .update({ company_id: company.id })
        .like('apply_url', pattern)
        .is('company_id', null)
    }
  }

  return NextResponse.json({
    seeded: inserted?.length || 0,
    total_extracted: companies.length,
    by_platform: {
      greenhouse: companies.filter(c => c.ats_platform === 'greenhouse').length,
      lever: companies.filter(c => c.ats_platform === 'lever').length,
      ashby: companies.filter(c => c.ats_platform === 'ashby').length,
      smartrecruiters: companies.filter(c => c.ats_platform === 'smartrecruiters').length,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/api/companies/seed/route.ts
git commit -m "feat: add company registry seed endpoint"
```

---

### Task 10: Sync-ATS Orchestrator Endpoint

**Files:**
- Create: `autoapply/apps/web/app/api/jobs/sync-ats/route.ts`

- [ ] **Step 1: Write the sync-ats endpoint**

Create `autoapply/apps/web/app/api/jobs/sync-ats/route.ts`:

```typescript
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isSWERole, classifyJobType, normalizeKey } from '@/lib/ats/classify'
import { fetchGreenhouseJobs, toStandardized as ghStd } from '@/lib/ats/greenhouse'
import { fetchLeverJobs, toStandardized as lvStd } from '@/lib/ats/lever'
import { fetchAshbyJobs, toStandardized as abStd } from '@/lib/ats/ashby'
import { fetchSmartRecruitersJobs, toStandardized as srStd } from '@/lib/ats/smartrecruiters'
import { fetchRemoteOKJobs, toStandardized as rokStd } from '@/lib/ats/remoteok'
import type { StandardizedJob } from '@/lib/ats/types'
import type { ATSPlatform } from '@/lib/types'

// Vercel Pro: allow up to 5 minutes for full sync across all companies
export const maxDuration = 300

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 200

interface SyncStats {
  companies_synced: number
  companies_failed: number
  jobs_created: number
  jobs_updated: number
  jobs_deactivated: number
  remoteok_added: number
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Process a batch of companies concurrently */
async function processBatch(
  companies: { id: string; name: string; slug: string; ats_platform: ATSPlatform }[],
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  stats: SyncStats
) {
  const results = await Promise.allSettled(
    companies.map(company => syncCompany(company, adminClient, stats))
  )
  for (const r of results) {
    if (r.status === 'rejected') stats.companies_failed++
  }
}

async function syncCompany(
  company: { id: string; name: string; slug: string; ats_platform: ATSPlatform },
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  stats: SyncStats
) {
  // 1. Fetch jobs from ATS
  let standardized: StandardizedJob[] = []

  switch (company.ats_platform) {
    case 'greenhouse': {
      const raw = await fetchGreenhouseJobs(company.slug)
      standardized = raw.map(j => ghStd(j, company.name))
      break
    }
    case 'lever': {
      const raw = await fetchLeverJobs(company.slug)
      standardized = raw.map(j => lvStd(j, company.name))
      break
    }
    case 'ashby': {
      const raw = await fetchAshbyJobs(company.slug)
      standardized = raw.map(j => abStd(j, company.name))
      break
    }
    case 'smartrecruiters': {
      const raw = await fetchSmartRecruitersJobs(company.slug)
      standardized = raw.map(j => srStd(j, company.name, company.slug))
      break
    }
  }

  // 2. Filter SWE roles and classify
  const sweJobs = standardized.filter(j => isSWERole(j.title))

  // 3. Upsert each job
  const activeAtsJobIds: string[] = []

  for (const job of sweJobs) {
    const nkey = normalizeKey(job.company, job.title, job.location)
    const jobType = classifyJobType(job.title)

    const row = {
      company_id: company.id,
      ats_job_id: job.ats_job_id,
      source_platform: job.source_platform,
      title: job.title,
      company: job.company,
      location: job.location,
      department: job.department,
      job_type: jobType,
      apply_url: job.apply_url,
      remote_policy: job.remote_policy,
      description: job.description,
      posted_at: job.posted_at,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      required_skills: job.tags.length ? job.tags : [],
      preferred_skills: [],
      is_active: true,
      normalized_key: nkey,
      updated_at: new Date().toISOString(),
    }

    // Try upsert on normalized_key
    const { data: existing } = await adminClient
      .from('jobs')
      .select('id')
      .eq('normalized_key', nkey)
      .maybeSingle()

    if (existing) {
      await adminClient.from('jobs').update(row).eq('id', existing.id)
      stats.jobs_updated++
    } else {
      await adminClient.from('jobs').insert({
        ...row,
        first_seen_at: new Date().toISOString(),
      })
      stats.jobs_created++
    }

    activeAtsJobIds.push(job.ats_job_id)
  }

  // 4. Deactivate stale jobs for this company
  if (activeAtsJobIds.length > 0) {
    const { data: stale } = await adminClient
      .from('jobs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('company_id', company.id)
      .eq('is_active', true)
      .not('ats_job_id', 'in', `(${activeAtsJobIds.map(id => `"${id}"`).join(',')})`)
      .select('id')

    stats.jobs_deactivated += stale?.length || 0
  }

  // 5. Update company last_synced_at
  await adminClient
    .from('companies')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', company.id)

  stats.companies_synced++
}

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const stats: SyncStats = {
    companies_synced: 0,
    companies_failed: 0,
    jobs_created: 0,
    jobs_updated: 0,
    jobs_deactivated: 0,
    remoteok_added: 0,
  }

  // --- Phase 1: ATS company sync ---
  const { data: companies } = await adminClient
    .from('companies')
    .select('id, name, slug, ats_platform')
    .eq('is_active', true)

  if (companies?.length) {
    // Process in batches of BATCH_SIZE
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE)
      await processBatch(batch, adminClient, stats)
      if (i + BATCH_SIZE < companies.length) await delay(BATCH_DELAY_MS)
    }
  }

  // --- Phase 2: RemoteOK bulk sync ---
  const remoteJobs = await fetchRemoteOKJobs()
  const sweRemote = remoteJobs.filter(j => isSWERole(j.position))

  for (const job of sweRemote) {
    const std = rokStd(job)
    const nkey = normalizeKey(std.company, std.title, std.location)

    // Skip if normalized_key already exists (ATS source wins)
    const { data: existing } = await adminClient
      .from('jobs')
      .select('id')
      .eq('normalized_key', nkey)
      .maybeSingle()

    if (existing) continue

    const jobType = classifyJobType(std.title)
    await adminClient.from('jobs').insert({
      ats_job_id: std.ats_job_id,
      source_platform: 'remoteok',
      title: std.title,
      company: std.company,
      location: std.location,
      job_type: jobType,
      apply_url: std.apply_url,
      remote_policy: 'remote',
      salary_min: std.salary_min,
      salary_max: std.salary_max,
      required_skills: std.tags,
      preferred_skills: [],
      is_active: true,
      normalized_key: nkey,
      first_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    stats.remoteok_added++
  }

  return NextResponse.json(stats)
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/api/jobs/sync-ats/route.ts
git commit -m "feat: add sync-ats orchestrator with batched concurrency and dedup"
```

---

### Task 11: Update Middleware + Jobs API Route

**Files:**
- Modify: `autoapply/apps/web/middleware.ts`
- Modify: `autoapply/apps/web/app/api/jobs/route.ts`

- [ ] **Step 1: Update middleware**

In `autoapply/apps/web/middleware.ts`, update the public path whitelist.

Replace the `isPublicPath` block (lines 26-32) with:

```typescript
  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/jobs/sync') ||
    request.nextUrl.pathname.startsWith('/api/jobs/check-links') ||
    request.nextUrl.pathname.startsWith('/api/jobs/enrich') ||
    request.nextUrl.pathname.startsWith('/api/companies/seed')
```

This removes `/api/jobs/cleanup-arrow` (being deleted) and adds `/api/companies/seed`. The `/api/jobs/sync` prefix already covers both the old `/api/jobs/sync` and new `/api/jobs/sync-ats`.

- [ ] **Step 2: Update jobs API route**

In `autoapply/apps/web/app/api/jobs/route.ts`, update the select query to include the `companies` join (line 16-19).

Replace the query select string with:

```typescript
  let query = supabase
    .from('jobs')
    .select(`
      *,
      job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at),
      source:job_sources!left(repo_name, repo_url),
      company:companies!left(name, slug, ats_platform, domain, logo_url)
    `)
    .eq('is_active', true)
    .limit(100)
```

Note the `!left` on `job_sources` to make it a left join (was implicit before but now some jobs have null `source_id`).

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/middleware.ts autoapply/apps/web/app/api/jobs/route.ts
git commit -m "feat: update middleware whitelist and jobs API to join companies"
```

---

### Task 12: Delete Legacy Files

**Files:**
- Delete: `autoapply/apps/web/lib/github/sync.ts`
- Delete: `autoapply/apps/web/app/api/jobs/sync/route.ts`
- Delete: `autoapply/apps/web/app/api/jobs/cleanup-arrow/route.ts`

- [ ] **Step 1: Delete the files**

```bash
cd autoapply/apps/web
rm lib/github/sync.ts
rm app/api/jobs/sync/route.ts
rm app/api/jobs/cleanup-arrow/route.ts
```

- [ ] **Step 2: Check for remaining imports of deleted modules**

Run: `grep -r "github/sync" lib/ app/ components/ --include="*.ts" --include="*.tsx"`
Run: `grep -r "cleanup-arrow" lib/ app/ components/ --include="*.ts" --include="*.tsx"`

Fix any remaining imports. The old sync test at `__tests__/lib/github/sync.test.ts` and `__tests__/api/github/sync.test.ts` should also be deleted since they test deleted code.

```bash
rm __tests__/lib/github/sync.test.ts
rm __tests__/api/github/sync.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove legacy GitHub markdown parser and cleanup-arrow endpoint"
```

---

### Task 13: Run All Tests + Build Check

- [ ] **Step 1: Run the full test suite**

```bash
cd autoapply/apps/web && npx vitest run
```

Expected: All tests pass. If any old tests reference deleted GitHub sync code, delete those tests.

- [ ] **Step 2: Run the build**

```bash
cd autoapply/apps/web && npx next build
```

Expected: Build succeeds with no TypeScript or ESLint errors.

- [ ] **Step 3: Fix any issues and commit**

If there are build failures, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve build issues from ATS pipeline migration"
```

---

### Task 14: Manual Steps — Migration + Seed + First Sync

These steps are performed by the user (or via curl) after deploying to Vercel.

- [ ] **Step 1: Run migration SQL**

Go to Supabase Dashboard → SQL Editor. Paste and run the contents of:
`autoapply/apps/web/supabase/migrations/20260323_ats_pipeline.sql`

- [ ] **Step 2: Deploy to Vercel**

Push all commits:

```bash
git push origin main
```

Wait for Vercel deployment to complete.

- [ ] **Step 3: Seed the company registry**

```bash
curl -X POST https://autoapply-seven.vercel.app/api/companies/seed \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response: JSON with `seeded` count and `by_platform` breakdown.

- [ ] **Step 4: Run the first ATS sync**

```bash
curl -X POST https://autoapply-seven.vercel.app/api/jobs/sync-ats \
  -H "Authorization: Bearer $CRON_SECRET"
```

This will take a few minutes (100-200 companies × API calls). Expected response: JSON with `companies_synced`, `jobs_created`, `jobs_deactivated`, `remoteok_added`.

- [ ] **Step 5: Run enrichment to fill gaps**

```bash
curl -X POST https://autoapply-seven.vercel.app/api/jobs/enrich \
  -H "Authorization: Bearer $CRON_SECRET"
```

Run multiple times until it returns `"enriched": 0`.

- [ ] **Step 6: Verify in browser**

Visit `https://autoapply-seven.vercel.app/jobs` and confirm:
- Jobs appear with proper company names, locations, logos
- Three tabs (Internship / New Grad / Full Time) filter correctly
- No ↳ prefix companies
- Logos display via company registry or enrichment
