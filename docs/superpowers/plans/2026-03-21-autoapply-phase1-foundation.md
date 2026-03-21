# AutoApply OS — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the working foundation — monorepo scaffolding, Supabase schema with RLS, Google OAuth, structured profile form, GitHub diff-based job sync (no AI), jobs listing with type filtering, and manual application Kanban — deployable to Vercel + Supabase.

**Architecture:** Next.js 14 App Router monorepo with Supabase as complete backend (Auth + PostgreSQL + RLS + pg_cron). Job sync uses GitHub diff API with regex parsing — no Claude calls in Phase 1. AI features are entirely deferred to Phase 2.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase CLI, Vitest + React Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-03-21-autoapply-os-design.md`

---

## File Map

```
autoapply/
├── package.json                                    # root workspace
├── .gitignore
├── apps/
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── vitest.setup.ts
│       ├── playwright.config.ts
│       ├── .env.local.example
│       ├── middleware.ts                           # auth guard
│       ├── app/
│       │   ├── layout.tsx                         # root layout
│       │   ├── globals.css
│       │   ├── (auth)/
│       │   │   └── login/page.tsx                 # Google OAuth sign-in
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx                     # nav sidebar
│       │   │   ├── page.tsx                       # main dashboard
│       │   │   ├── jobs/page.tsx
│       │   │   ├── applications/page.tsx
│       │   │   └── profile/page.tsx
│       │   └── api/
│       │       ├── auth/callback/route.ts          # OAuth code exchange
│       │       ├── jobs/
│       │       │   ├── route.ts                   # GET jobs list
│       │       │   └── sync/route.ts              # POST trigger sync
│       │       ├── applications/route.ts           # GET/POST/PATCH
│       │       └── profile/route.ts               # GET/POST
│       ├── components/
│       │   ├── dashboard/
│       │   │   └── ApplicationFunnel.tsx           # pipeline counts
│       │   ├── jobs/
│       │   │   ├── JobCard.tsx                    # job listing card
│       │   │   └── JobFilters.tsx                 # type filter tabs
│       │   ├── applications/
│       │   │   └── ApplicationKanban.tsx           # kanban board
│       │   └── profile/
│       │       └── ProfileForm.tsx                # skills/prefs form
│       ├── lib/
│       │   ├── types.ts                           # all shared TS types
│       │   ├── supabase/
│       │   │   ├── client.ts                      # browser client
│       │   │   └── server.ts                      # server client
│       │   ├── gmail/
│       │   │   └── vault.ts                       # Vault token storage utilities
│       │   └── github/
│       │       └── sync.ts                        # diff parser + GitHub API
│       ├── __tests__/
│       │   ├── lib/
│       │   │   ├── types.test.ts
│       │   │   ├── gmail/vault.test.ts
│       │   │   └── github/sync.test.ts
│       │   ├── api/
│       │   │   ├── auth/callback.test.ts
│       │   │   ├── jobs/list.test.ts
│       │   │   └── applications.test.ts
│       │   └── components/
│       │       ├── dashboard/ApplicationFunnel.test.tsx
│       │       ├── jobs/JobCard.test.tsx
│       │       └── profile/ProfileForm.test.tsx
│       └── e2e/
│           └── auth.spec.ts
└── supabase/
    ├── config.toml
    ├── migrations/
    │   └── 20260321000000_initial_schema.sql
    └── seed.sql
```

---

## Task 1: Monorepo + Project Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `apps/web/` (Next.js app)
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/.env.local.example`

- [ ] **Step 1: Create directory structure and root workspace**

```bash
mkdir -p autoapply/apps/web autoapply/supabase/migrations
cd autoapply
```

Create `package.json`:
```json
{
  "name": "autoapply",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web",
    "test": "npm run test --workspace=apps/web"
  }
}
```

- [ ] **Step 2: Scaffold Next.js app**

```bash
cd apps/web
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js project created with `app/` directory, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 3: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npx shadcn@latest init
# Select: Default style, Slate base color, CSS variables: yes
npx shadcn@latest add button card badge tabs input label textarea
```

- [ ] **Step 4: Create `apps/web/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create `apps/web/vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `apps/web/.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_TOKEN=
```

Copy to `.env.local` and fill in values from `npx supabase start` output (Step 2 below).

- [ ] **Step 7: Create `.gitignore`**

```
node_modules/
.next/
.env.local
.env
dist/
.supabase/
```

- [ ] **Step 8: Initialize Supabase CLI**

```bash
# From repo root
npm install -D supabase
npx supabase init
```

Expected: `supabase/config.toml` created.

- [ ] **Step 9: Verify test runner works**

```bash
cd apps/web && npx vitest run
```

Expected: 0 tests, no errors (nothing written yet — just confirms vitest is wired up).

- [ ] **Step 10: Initial commit**

```bash
git init
git add .
git commit -m "chore: initialize autoapply monorepo with Next.js 14 + Supabase"
```

---

## Task 2: Database Schema + Migrations

**Files:**
- Create: `supabase/migrations/20260321000000_initial_schema.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Write `supabase/migrations/20260321000000_initial_schema.sql`**

```sql
-- Enable Vault for encrypted secret storage (Gmail OAuth tokens)
-- Pre-installed on Supabase hosted; explicit here for local dev reproducibility
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- ============================================================
-- Core user record
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  gmail_watch_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Structured profile (one row per user — UNIQUE enforced)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  skills TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',   -- [{school, degree, major, gpa, graduation_year}]
  experience JSONB DEFAULT '[]',  -- [{company, role, start, end, bullets[]}]
  preferences JSONB DEFAULT '{}'  -- {job_types[], locations[], remote_ok, min_salary}
);

-- ============================================================
-- Job sources — global, intentionally no RLS
-- ============================================================
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  job_type_tag TEXT,
  last_synced_sha TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- Jobs — global, intentionally no RLS
-- ============================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES job_sources(id),
  source_url TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_type TEXT,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  experience_level TEXT,
  remote_policy TEXT,
  apply_url TEXT,
  posted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(source_id, apply_url)
);

-- ============================================================
-- Per-user job scores
-- ============================================================
CREATE TABLE job_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,
  tier TEXT,         -- rule_skip | rule_match | claude_scored
  matching_skills TEXT[] DEFAULT '{}',
  skill_gaps TEXT[] DEFAULT '{}',
  verdict TEXT,      -- strong_match | stretch | skip
  reasoning TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- ============================================================
-- Application tracking
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'saved',
  applied_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  source TEXT DEFAULT 'manual'
);
-- Prevent duplicates: same user applying to same job twice
CREATE UNIQUE INDEX idx_applications_unique_job
  ON applications(user_id, job_id) WHERE job_id IS NOT NULL;

-- ============================================================
-- Email events + deadlines (populated in Phase 2)
-- ============================================================
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  gmail_message_id TEXT UNIQUE,
  category TEXT,
  raw_subject TEXT,
  entities JSONB,
  confidence FLOAT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  email_event_id UUID REFERENCES email_events(id),
  type TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,
  reminder_sent_at TIMESTAMPTZ
);

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB,
  response_rate FLOAT,
  avg_days_to_response FLOAT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes (critical for page-load queries)
-- ============================================================
CREATE INDEX idx_applications_user_id    ON applications(user_id);
CREATE INDEX idx_email_events_user_id    ON email_events(user_id);
CREATE INDEX idx_email_events_gmail_id   ON email_events(gmail_message_id);
CREATE INDEX idx_job_scores_user_score   ON job_scores(user_id, score DESC);
CREATE INDEX idx_deadlines_user_datetime ON deadlines(user_id, datetime);
CREATE INDEX idx_jobs_active_type        ON jobs(is_active, job_type);

-- ============================================================
-- RLS — enabled on all user-scoped tables
-- jobs and job_sources are intentionally PUBLIC (no RLS)
-- Edge Functions write using service role (bypasses RLS).
-- All Edge Function writes MUST include user_id explicitly.
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own"        ON users        FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_own"     ON profiles     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "job_scores_own"   ON job_scores   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "applications_own" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "email_events_own" ON email_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "deadlines_own"    ON deadlines    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "insights_own"     ON insights     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_own"      ON ai_logs      FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create users row when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Start local Supabase**

```bash
npx supabase start
```

Expected: Output shows:
```
API URL: http://localhost:54321
anon key: eyJ...
service_role key: eyJ...
Studio URL: http://localhost:54323
```

Copy keys to `apps/web/.env.local`.

- [ ] **Step 3: Apply migration**

```bash
npx supabase db push
```

Expected: `Applied 1 migration(s).`

- [ ] **Step 4: Verify in Supabase Studio**

Open http://localhost:54323 → Table Editor. Confirm tables: `users`, `profiles`, `jobs`, `job_sources`, `job_scores`, `applications`, `email_events`, `deadlines`, `insights`, `ai_logs`.

- [ ] **Step 5: Create `supabase/seed.sql`**

```sql
INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/New-Grad-Positions', 'SimplifyJobs/New-Grad-Positions', 'new_grad', true),
  ('https://github.com/SimplifyJobs/Summer2025-Internships', 'SimplifyJobs/Summer2025-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 6: Apply seed**

```bash
npx supabase db reset
```

Expected: Migration re-applied + 2 rows in `job_sources`.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add complete database schema with RLS, indexes, and job source seed"
```

---

## Task 3: Supabase Client + Shared Types

**Files:**
- Create: `apps/web/lib/types.ts`
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/__tests__/lib/types.test.ts`

- [ ] **Step 1: Write failing type test**

Create `apps/web/__tests__/lib/types.test.ts`:
```typescript
import type { Application, Job, Profile, ApplicationStatus } from '@/lib/types'

it('Application status union includes all 7 states', () => {
  const statuses: ApplicationStatus[] = [
    'saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected', 'ghosted'
  ]
  expect(statuses).toHaveLength(7)
})

it('Application type is structurally valid', () => {
  const app: Application = {
    id: '1', user_id: 'u1', job_id: null,
    status: 'applied', applied_at: null,
    last_activity_at: new Date().toISOString(),
    notes: null, source: 'manual',
  }
  expect(app.status).toBe('applied')
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd apps/web && npx vitest run __tests__/lib/types.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/types'`

- [ ] **Step 3: Create `apps/web/lib/types.ts`**

```typescript
export type JobType = 'internship' | 'new_grad' | 'fulltime'
export type ApplicationStatus =
  | 'saved' | 'applied' | 'oa' | 'interviewing'
  | 'offer' | 'rejected' | 'ghosted'

export interface User {
  id: string; email: string; timezone: string
  gmail_watch_expiry: string | null; created_at: string
}

export interface EducationEntry {
  school: string; degree: string; major: string
  gpa?: number; graduation_year: number
}

export interface ExperienceEntry {
  company: string; role: string; start: string
  end: string | null; bullets: string[]
}

export interface UserPreferences {
  job_types: JobType[]; locations: string[]
  remote_ok: boolean; min_salary: number | null
}

export interface Profile {
  id: string; user_id: string; skills: string[]
  education: EducationEntry[]; experience: ExperienceEntry[]
  preferences: UserPreferences
}

export interface JobSource {
  id: string; repo_url: string; repo_name: string
  job_type_tag: JobType | null; last_synced_sha: string | null
  last_synced_at: string | null; is_active: boolean
}

export interface Job {
  id: string; source_id: string; source_url: string | null
  title: string; company: string; location: string | null
  job_type: JobType | null; required_skills: string[]
  preferred_skills: string[]; experience_level: string | null
  remote_policy: string | null; apply_url: string | null
  posted_at: string | null; first_seen_at: string; is_active: boolean
}

export interface JobScore {
  id: string; job_id: string; user_id: string; score: number
  tier: 'rule_skip' | 'rule_match' | 'claude_scored'
  matching_skills: string[]; skill_gaps: string[]
  verdict: 'strong_match' | 'stretch' | 'skip'
  reasoning: string | null; scored_at: string
}

export interface Application {
  id: string; user_id: string; job_id: string | null
  status: ApplicationStatus; applied_at: string | null
  last_activity_at: string; notes: string | null
  source: 'manual' | 'email_detected'
}

// Joined types used in UI
export interface ApplicationWithJob extends Application {
  job?: Job | null
}

export interface JobWithScore extends Job {
  score?: JobScore | null
  source?: JobSource | null
  job_scores?: JobScore[]
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run __tests__/lib/types.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Create `apps/web/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 6: Create `apps/web/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/ apps/web/__tests__/lib/types.test.ts
git commit -m "feat: add Supabase client utilities and shared TypeScript types"
```

---

## Task 4: Google OAuth Auth Flow

**Files:**
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/globals.css` (already exists from scaffolding)
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/api/auth/callback/route.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/__tests__/api/auth/callback.test.ts`

- [ ] **Step 1: Write failing test for OAuth callback**

Create `apps/web/__tests__/api/auth/callback.test.ts`:
```typescript
import { GET } from '@/app/api/auth/callback/route'
import { NextRequest } from 'next/server'

it('redirects to / on successful code exchange', async () => {
  const req = new NextRequest('http://localhost/api/auth/callback?code=test_code')
  const response = await GET(req)
  expect(response.status).toBe(302)
})

it('redirects to /login on missing code', async () => {
  const req = new NextRequest('http://localhost/api/auth/callback')
  const response = await GET(req)
  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toContain('/login')
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run __tests__/api/auth/callback.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/auth/callback/route'`

- [ ] **Step 3: Create `apps/web/app/api/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run __tests__/api/auth/callback.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Create `apps/web/app/(auth)/login/page.tsx`**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar',
        ].join(' '),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">AutoApply</h1>
        <p className="text-muted-foreground">
          Your job application operating system
        </p>
        <Button onClick={signInWithGoogle} size="lg" className="w-full">
          Sign in with Google
        </Button>
        <p className="text-xs text-muted-foreground">
          This app reads your Gmail to automatically detect OA invites,
          interviews, and rejections. We never send emails on your behalf.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `apps/web/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 7: Create `apps/web/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoApply',
  description: 'Your job application operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Configure Google OAuth in Supabase local dashboard**

1. Open http://localhost:54323 → Authentication → Providers → Google
2. Enable Google provider
3. Add your Google OAuth Client ID + Secret (from Google Cloud Console)
4. Redirect URL to add in Google Console: `http://localhost:54321/auth/v1/callback`

- [ ] **Step 9: Manual smoke test**

```bash
cd apps/web && npm run dev
```

Open http://localhost:3000 → should redirect to `/login` → click button → Google OAuth screen → lands on `/`.

- [ ] **Step 10: Commit**

```bash
git add apps/web/app/ apps/web/middleware.ts apps/web/__tests__/api/auth/
git commit -m "feat: add Google OAuth auth flow with Gmail + Calendar scope consent"
```

---

## Task 4b: Gmail + Calendar OAuth Token Storage (Supabase Vault)

**Files:**
- Create: `apps/web/lib/gmail/vault.ts`
- Modify: `apps/web/app/api/auth/callback/route.ts`
- Create: `apps/web/__tests__/lib/gmail/vault.test.ts`

- [ ] **Step 1: Write failing tests for Vault utilities**

Create `apps/web/__tests__/lib/gmail/vault.test.ts`:
```typescript
import { buildVaultKey, extractTokensFromSession } from '@/lib/gmail/vault'

it('buildVaultKey returns correct key format', () => {
  expect(buildVaultKey('user-123')).toBe('gmail_oauth_user-123')
})

it('extractTokensFromSession returns provider token and refresh token', () => {
  const session = {
    provider_token: 'access_token_abc',
    provider_refresh_token: 'refresh_token_xyz',
  } as any
  const tokens = extractTokensFromSession(session)
  expect(tokens.access_token).toBe('access_token_abc')
  expect(tokens.refresh_token).toBe('refresh_token_xyz')
})

it('extractTokensFromSession throws when provider_token missing', () => {
  const session = { provider_refresh_token: 'refresh' } as any
  expect(() => extractTokensFromSession(session)).toThrow('No provider token in session')
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd apps/web && npx vitest run __tests__/lib/gmail/vault.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/gmail/vault'`

- [ ] **Step 3: Create `apps/web/lib/gmail/vault.ts`**

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Session } from '@supabase/supabase-js'

export interface GmailTokens {
  access_token: string
  refresh_token: string | null
  expires_at?: number // unix timestamp
}

export function buildVaultKey(userId: string): string {
  return `gmail_oauth_${userId}`
}

export function extractTokensFromSession(session: Session): GmailTokens {
  if (!session.provider_token) {
    throw new Error('No provider token in session')
  }
  return {
    access_token: session.provider_token,
    refresh_token: session.provider_refresh_token ?? null,
    expires_at: session.expires_at,
  }
}

/**
 * Store Gmail OAuth tokens in Supabase Vault (encrypted at rest).
 * Called once after OAuth code exchange completes.
 */
export async function storeGmailTokens(
  adminClient: SupabaseClient,
  userId: string,
  tokens: GmailTokens
): Promise<void> {
  const key = buildVaultKey(userId)
  const payload = JSON.stringify(tokens)

  // Check if secret exists; upsert via delete+create (Vault has no native upsert)
  const { data: existing } = await adminClient
    .schema('vault')
    .from('secrets')
    .select('id')
    .eq('name', key)
    .maybeSingle()

  if (existing?.id) {
    await adminClient.rpc('vault.update_secret', { secret_id: existing.id, new_secret: payload })
  } else {
    await adminClient.rpc('vault.create_secret', { secret: payload, name: key })
  }
}

/**
 * Retrieve and decode Gmail OAuth tokens from Vault.
 * Returns null if no tokens stored for this user.
 */
export async function getGmailTokens(
  adminClient: SupabaseClient,
  userId: string
): Promise<GmailTokens | null> {
  const key = buildVaultKey(userId)
  const { data } = await adminClient
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', key)
    .maybeSingle()

  if (!data?.decrypted_secret) return null
  return JSON.parse(data.decrypted_secret) as GmailTokens
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd apps/web && npx vitest run __tests__/lib/gmail/vault.test.ts
```

Expected: PASS (3 tests) — the pure utility functions pass without needing Supabase connection

- [ ] **Step 5: Update `apps/web/app/api/auth/callback/route.ts` to store tokens**

Replace the existing callback handler:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { extractTokensFromSession, storeGmailTokens } from '@/lib/gmail/vault'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Store Gmail + Calendar OAuth tokens in Vault (encrypted at rest)
  // Only store if provider_token present (user granted Gmail scope)
  if (data.session.provider_token) {
    try {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const tokens = extractTokensFromSession(data.session)
      await storeGmailTokens(adminClient, data.user.id, tokens)
    } catch (vaultErr) {
      // Non-fatal: log and continue — user can reconnect Gmail later
      console.error('Failed to store Gmail tokens in Vault:', vaultErr)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/gmail/ apps/web/app/api/auth/callback/route.ts apps/web/__tests__/lib/gmail/
git commit -m "feat: store Gmail OAuth tokens in Supabase Vault after OAuth callback"
```

---

## Task 5: User Profile Form + API

**Files:**
- Create: `apps/web/app/api/profile/route.ts`
- Create: `apps/web/components/profile/ProfileForm.tsx`
- Create: `apps/web/app/(dashboard)/profile/page.tsx`
- Create: `apps/web/__tests__/components/profile/ProfileForm.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `apps/web/__tests__/components/profile/ProfileForm.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/components/profile/ProfileForm'

it('renders skills input', () => {
  render(<ProfileForm onSubmit={async () => {}} />)
  expect(screen.getByLabelText(/skills/i)).toBeInTheDocument()
})

it('calls onSubmit with parsed skills array', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React, TypeScript, Python' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: ['React', 'TypeScript', 'Python'],
      })
    )
  })
})

it('strips empty strings from skills', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React,  , TypeScript' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ skills: ['React', 'TypeScript'] })
    )
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run __tests__/components/profile/ProfileForm.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/profile/ProfileForm'`

- [ ] **Step 3: Create `apps/web/components/profile/ProfileForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/types'

interface Props {
  initialData?: Partial<Profile>
  onSubmit: (data: Partial<Profile>) => Promise<void>
}

export function ProfileForm({ initialData, onSubmit }: Props) {
  const [skills, setSkills] = useState(
    initialData?.skills?.join(', ') ?? ''
  )
  const [remoteOk, setRemoteOk] = useState(
    initialData?.preferences?.remote_ok ?? true
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      preferences: {
        job_types: initialData?.preferences?.job_types ?? ['new_grad', 'internship'],
        locations: initialData?.preferences?.locations ?? [],
        remote_ok: remoteOk,
        min_salary: initialData?.preferences?.min_salary ?? null,
      },
      education: initialData?.education ?? [],
      experience: initialData?.experience ?? [],
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="React, TypeScript, Python, SQL..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="remote_ok"
          checked={remoteOk}
          onChange={e => setRemoteOk(e.target.checked)}
        />
        <Label htmlFor="remote_ok">Open to remote</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run __tests__/components/profile/ProfileForm.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Create `apps/web/app/api/profile/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error?.code === 'PGRST116') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...body }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 6: Create `apps/web/app/(dashboard)/profile/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  async function saveProfile(data: Partial<Profile>) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles')
      .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Skills listed here are used to score job relevance. Be specific — use
        technology names rather than categories (e.g. "React" not "frontend").
      </p>
      <ProfileForm initialData={profile ?? undefined} onSubmit={saveProfile} />
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/profile/ apps/web/components/profile/ \
        apps/web/app/\(dashboard\)/profile/ \
        apps/web/__tests__/components/profile/
git commit -m "feat: add profile form with skills input and Supabase upsert"
```

---

## Task 6: GitHub Diff-Based Job Parser

**Files:**
- Create: `apps/web/lib/github/sync.ts`
- Create: `apps/web/__tests__/lib/github/sync.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/__tests__/lib/github/sync.test.ts`:
```typescript
import {
  parseAddedMarkdownRows,
  regexParseJobRow,
  isJobActive,
} from '@/lib/github/sync'

const FIXTURE_DIFF = `
+| Google | Software Engineer, New Grad | Mountain View, CA | <a href="https://careers.google.com/jobs/123">Apply</a> | Mar 20 |
+| Stripe | Software Engineer Intern | San Francisco, CA | <a href="https://stripe.com/jobs/456">Apply</a> | Mar 20 |
+| ~~Meta~~ | ~~Software Engineer~~ | ~~Menlo Park, CA~~ | 🔒 | Mar 19 |
 | Existing | Unchanged Role | New York | <a href="...">Apply</a> | Mar 15 |
-| Removed | Old Role | Chicago | <a href="...">Apply</a> | Mar 10 |
`

describe('parseAddedMarkdownRows', () => {
  it('returns only lines starting with +|', () => {
    const rows = parseAddedMarkdownRows(FIXTURE_DIFF)
    expect(rows).toHaveLength(3)
  })

  it('strips leading + from returned rows', () => {
    const rows = parseAddedMarkdownRows(FIXTURE_DIFF)
    expect(rows[0]).not.toStartWith('+')
    expect(rows[0]).toStartWith('|')
  })
})

describe('regexParseJobRow', () => {
  it('parses a standard SimplifyJobs row', () => {
    const row = '| Google | Software Engineer, New Grad | Mountain View, CA | <a href="https://careers.google.com/jobs/123">Apply</a> | Mar 20 |'
    const result = regexParseJobRow(row)
    expect(result).not.toBeNull()
    expect(result!.company).toBe('Google')
    expect(result!.title).toBe('Software Engineer, New Grad')
    expect(result!.location).toBe('Mountain View, CA')
    expect(result!.apply_url).toBe('https://careers.google.com/jobs/123')
  })

  it('returns null for separator rows', () => {
    expect(regexParseJobRow('| --- | --- | --- | --- | --- |')).toBeNull()
  })

  it('returns null for header rows', () => {
    expect(regexParseJobRow('| Company | Role | Location | Link | Date |')).toBeNull()
  })

  it('returns null for rows with fewer than 3 cells', () => {
    expect(regexParseJobRow('| Only | Two |')).toBeNull()
  })
})

describe('isJobActive', () => {
  it('returns false for strikethrough rows', () => {
    expect(isJobActive('| ~~Meta~~ | ~~Role~~ | ~~Location~~ | 🔒 |')).toBe(false)
  })

  it('returns false for locked rows', () => {
    expect(isJobActive('| Company | Role | Location | 🔒 |')).toBe(false)
  })

  it('returns true for normal rows', () => {
    expect(isJobActive('| Google | SWE | Mountain View | <a href="...">Apply</a> |')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run __tests__/lib/github/sync.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/github/sync'`

- [ ] **Step 3: Create `apps/web/lib/github/sync.ts`**

```typescript
export interface ParsedJobRow {
  company: string
  title: string
  location: string | null
  apply_url: string | null
  is_active: boolean
}

/**
 * Returns lines from a git diff that represent new additions (+| lines).
 * Strips the leading '+' character.
 */
export function parseAddedMarkdownRows(diff: string): string[] {
  return diff
    .split('\n')
    .filter(line => line.startsWith('+|'))
    .map(line => line.slice(1))
}

/**
 * Returns false for closed/expired roles (strikethrough ~~ or lock 🔒).
 */
export function isJobActive(row: string): boolean {
  return !row.includes('~~') && !row.includes('🔒')
}

/**
 * Parses a SimplifyJobs markdown table row into structured data.
 * Returns null for header, separator, or malformed rows.
 */
export function regexParseJobRow(row: string): ParsedJobRow | null {
  // Skip separator and header rows
  if (row.includes('---')) return null
  if (/\|\s*Company\s*\|/i.test(row)) return null

  const cells = row.split('|').map(c => c.trim()).filter(Boolean)
  if (cells.length < 3) return null

  const company = cells[0].replace(/~~/g, '').trim()
  const title   = cells[1].replace(/~~/g, '').trim()
  const location = cells[2].replace(/~~/g, '').trim() || null

  // Extract href from <a href="...">
  const urlMatch = cells[3]?.match(/href="([^"]+)"/)
  const apply_url = urlMatch ? urlMatch[1] : null

  if (!company || company === '---') return null

  return { company, title, location, apply_url, is_active: isJobActive(row) }
}

/**
 * Fetches the latest commit SHA for a GitHub repo's default branch.
 */
export async function getLatestCommitSha(
  repoName: string,
  token: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repoName}/commits?per_page=1`,
    { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } }
  )
  const data = await res.json()
  return data[0].sha
}

/**
 * Fetches diff between two SHAs. On first sync (baseSha null), returns
 * full file content with all rows prefixed as additions.
 */
export async function getRepoDiff(
  repoName: string,
  baseSha: string | null,
  headSha: string,
  token: string
): Promise<string> {
  if (!baseSha) {
    // First sync — treat all rows as new
    const res = await fetch(
      `https://api.github.com/repos/${repoName}/contents/README.md?ref=${headSha}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw' } }
    )
    const content = await res.text()
    return content.split('\n').map(l => l.startsWith('|') ? `+${l}` : l).join('\n')
  }

  const res = await fetch(
    `https://api.github.com/repos/${repoName}/compare/${baseSha}...${headSha}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.diff' } }
  )
  return res.text()
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run __tests__/lib/github/sync.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/github/ apps/web/__tests__/lib/github/
git commit -m "feat: add GitHub diff-based job parser with regex extraction"
```

---

## Task 7: Job Sync API + List Endpoint

**Files:**
- Create: `apps/web/app/api/jobs/route.ts`
- Create: `apps/web/app/api/jobs/sync/route.ts`
- Create: `apps/web/__tests__/api/jobs/list.test.ts`

- [ ] **Step 1: Write failing test for filter logic**

Create `apps/web/__tests__/api/jobs/list.test.ts`:
```typescript
import { parseJobFilters } from '@/app/api/jobs/route'

it('returns null job_type for "all"', () => {
  const params = new URLSearchParams('type=all')
  expect(parseJobFilters(params).job_type).toBeNull()
})

it('returns specific job_type when given', () => {
  const params = new URLSearchParams('type=internship')
  expect(parseJobFilters(params).job_type).toBe('internship')
})

it('returns null job_type when type param absent', () => {
  const params = new URLSearchParams('')
  expect(parseJobFilters(params).job_type).toBeNull()
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run __tests__/api/jobs/list.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create `apps/web/app/api/jobs/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export function parseJobFilters(params: URLSearchParams) {
  const type = params.get('type')
  return { job_type: (type && type !== 'all') ? type : null }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { job_type } = parseJobFilters(searchParams)

  let query = supabase
    .from('jobs')
    .select(`
      *,
      job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at),
      source:job_sources(repo_name, repo_url)
    `)
    .eq('is_active', true)
    .order('first_seen_at', { ascending: false })
    .limit(100)

  if (job_type) query = query.eq('job_type', job_type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run __tests__/api/jobs/list.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Create `apps/web/app/api/jobs/sync/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getLatestCommitSha, getRepoDiff,
  parseAddedMarkdownRows, regexParseJobRow,
} from '@/lib/github/sync'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const token = process.env.GITHUB_TOKEN!

  const { data: sources } = await supabase
    .from('job_sources')
    .select('*')
    .eq('is_active', true)

  let totalNew = 0
  for (const source of sources ?? []) {
    const currentSha = await getLatestCommitSha(source.repo_name, token)
    if (currentSha === source.last_synced_sha) continue

    const diff = await getRepoDiff(source.repo_name, source.last_synced_sha, currentSha, token)
    const newRows = parseAddedMarkdownRows(diff)

    for (const row of newRows) {
      const parsed = regexParseJobRow(row)
      if (!parsed || !parsed.is_active) continue

      const { error } = await supabase.from('jobs').upsert({
        source_id: source.id,
        source_url: `https://github.com/${source.repo_name}`,
        title: parsed.title,
        company: parsed.company,
        location: parsed.location,
        job_type: source.job_type_tag,
        apply_url: parsed.apply_url,
        required_skills: [],
        preferred_skills: [],
        is_active: true,
        first_seen_at: new Date().toISOString(),
      }, { onConflict: 'source_id,apply_url', ignoreDuplicates: true })

      if (!error) totalNew++
    }

    await supabase
      .from('job_sources')
      .update({ last_synced_sha: currentSha, last_synced_at: new Date().toISOString() })
      .eq('id', source.id)
  }

  return NextResponse.json({ synced: totalNew })
}
```

- [ ] **Step 6: Manual smoke test — trigger job sync**

```bash
# With local dev server running
curl -X POST http://localhost:3000/api/jobs/sync \
  -H "Authorization: Bearer $(grep SERVICE_ROLE apps/web/.env.local | cut -d= -f2)"
```

Expected: `{"synced": N}` where N > 0. Verify jobs in Supabase Studio → jobs table.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/jobs/ apps/web/__tests__/api/jobs/
git commit -m "feat: add job sync endpoint (diff-based GitHub parser) and list API"
```

---

## Task 8: Jobs Listing UI

**Files:**
- Create: `apps/web/components/jobs/JobCard.tsx`
- Create: `apps/web/components/jobs/JobFilters.tsx`
- Create: `apps/web/app/(dashboard)/jobs/page.tsx`
- Create: `apps/web/__tests__/components/jobs/JobCard.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `apps/web/__tests__/components/jobs/JobCard.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'
import type { JobWithScore } from '@/lib/types'

const baseJob: JobWithScore = {
  id: '1', source_id: 's1', source_url: 'https://github.com/SimplifyJobs/New-Grad-Positions',
  title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA',
  job_type: 'new_grad', required_skills: ['Python', 'Go'], preferred_skills: [],
  experience_level: 'entry', remote_policy: 'hybrid', apply_url: 'https://careers.google.com',
  posted_at: null, first_seen_at: new Date().toISOString(), is_active: true,
}

it('renders company name and job title', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText('Google')).toBeInTheDocument()
  expect(screen.getByText('Software Engineer')).toBeInTheDocument()
})

it('renders Apply link with correct href', () => {
  render(<JobCard job={baseJob} />)
  const link = screen.getByRole('link', { name: /apply/i })
  expect(link).toHaveAttribute('href', 'https://careers.google.com')
})

it('shows match score badge when score present', () => {
  const job: JobWithScore = {
    ...baseJob,
    job_scores: [{
      id: '1', job_id: '1', user_id: 'u', score: 87,
      tier: 'claude_scored', matching_skills: ['Python'],
      skill_gaps: ['Go'], verdict: 'stretch', reasoning: null,
      scored_at: '',
    }],
  }
  render(<JobCard job={job} />)
  expect(screen.getByText('87%')).toBeInTheDocument()
})

it('shows source repo attribution', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText(/SimplifyJobs/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run __tests__/components/jobs/JobCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Create `apps/web/components/jobs/JobCard.tsx`**

```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { JobWithScore } from '@/lib/types'

interface Props {
  job: JobWithScore
  onSave?: (jobId: string) => void
}

export function JobCard({ job, onSave }: Props) {
  const topScore = job.job_scores?.[0]
  const score = topScore?.score
  const matchingSkills = topScore?.matching_skills ?? []
  const skillGaps = topScore?.skill_gaps ?? []

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {score != null && (
              <span className="text-sm font-semibold text-primary tabular-nums">{score}%</span>
            )}
            <h3 className="font-semibold truncate">{job.title}</h3>
          </div>
          <p className="text-muted-foreground text-sm">{job.company}</p>
          {job.location && (
            <p className="text-xs text-muted-foreground">{job.location}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {job.apply_url && (
            <Button asChild size="sm">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply ↗
              </a>
            </Button>
          )}
          {onSave && (
            <Button size="sm" variant="outline" onClick={() => onSave(job.id)}>
              Save
            </Button>
          )}
        </div>
      </div>

      {(matchingSkills.length > 0 || skillGaps.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {matchingSkills.map(s => (
            <Badge key={s} variant="secondary" className="text-xs">✓ {s}</Badge>
          ))}
          {skillGaps.map(s => (
            <Badge key={s} variant="outline" className="text-xs text-amber-600">⚠ {s}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {job.job_type && (
          <Badge variant="outline">{job.job_type.replace('_', ' ')}</Badge>
        )}
        {job.source_url && (
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {job.source_url.split('/').slice(-2).join('/')}
          </a>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run __tests__/components/jobs/JobCard.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Create `apps/web/components/jobs/JobFilters.tsx`**

```tsx
'use client'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type FilterTab = 'all' | 'new_grad' | 'internship' | 'fulltime'

interface Props {
  active: FilterTab
  onChange: (tab: FilterTab) => void
}

export function JobFilters({ active, onChange }: Props) {
  return (
    <Tabs value={active} onValueChange={v => onChange(v as FilterTab)}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="new_grad">New Grad</TabsTrigger>
        <TabsTrigger value="internship">Internship</TabsTrigger>
        <TabsTrigger value="fulltime">Fulltime</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

- [ ] **Step 6: Create `apps/web/app/(dashboard)/jobs/page.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, type FilterTab } from '@/components/jobs/JobFilters'
import type { JobWithScore } from '@/lib/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithScore[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/jobs?type=${filter}`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
  }, [filter])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <span className="text-muted-foreground text-sm">{jobs.length} listings</span>
      </div>
      <JobFilters active={filter} onChange={setFilter} />
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No jobs found. Try triggering a sync or changing filters.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/jobs/ apps/web/app/\(dashboard\)/jobs/ \
        apps/web/__tests__/components/jobs/
git commit -m "feat: add jobs listing UI with type filter tabs and skill match display"
```

---

## Task 9: Manual Application Kanban

**Files:**
- Create: `apps/web/app/api/applications/route.ts`
- Create: `apps/web/components/applications/ApplicationKanban.tsx`
- Create: `apps/web/app/(dashboard)/applications/page.tsx`
- Create: `apps/web/__tests__/api/applications.test.ts`

- [ ] **Step 1: Write failing tests for Kanban logic**

Create `apps/web/__tests__/api/applications.test.ts`:
```typescript
import { getStatusColumns, STATUS_TRANSITIONS } from '@/components/applications/ApplicationKanban'

it('getStatusColumns returns 5 primary columns', () => {
  const cols = getStatusColumns()
  expect(cols.map(c => c.id)).toEqual(['saved', 'applied', 'oa', 'interviewing', 'offer'])
})

it('rejected and ghosted are not primary Kanban columns', () => {
  const ids = getStatusColumns().map(c => c.id)
  expect(ids).not.toContain('rejected')
  expect(ids).not.toContain('ghosted')
})

it('STATUS_TRANSITIONS advances linearly', () => {
  expect(STATUS_TRANSITIONS['saved']).toBe('applied')
  expect(STATUS_TRANSITIONS['applied']).toBe('oa')
  expect(STATUS_TRANSITIONS['offer']).toBeNull()
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run __tests__/api/applications.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create `apps/web/app/api/applications/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('applications')
    .insert({ user_id: user.id, ...body })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...body } = await request.json()
  const { data, error } = await supabase
    .from('applications')
    .update({ ...body, last_activity_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)   // RLS belt-and-suspenders
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4: Create `apps/web/components/applications/ApplicationKanban.tsx`**

```tsx
'use client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export function getStatusColumns() {
  return [
    { id: 'saved'        as ApplicationStatus, label: 'Saved' },
    { id: 'applied'      as ApplicationStatus, label: 'Applied' },
    { id: 'oa'           as ApplicationStatus, label: 'OA' },
    { id: 'interviewing' as ApplicationStatus, label: 'Interviewing' },
    { id: 'offer'        as ApplicationStatus, label: 'Offer' },
  ]
}

export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus | null> = {
  saved:        'applied',
  applied:      'oa',
  oa:           'interviewing',
  interviewing: 'offer',
  offer:        null,
  rejected:     null,
  ghosted:      null,
}

interface Props {
  applications: ApplicationWithJob[]
  onStatusChange: (id: string, newStatus: ApplicationStatus) => Promise<void>
}

export function ApplicationKanban({ applications, onStatusChange }: Props) {
  const columns = getStatusColumns()

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const cards = applications.filter(a => a.status === col.id)
        return (
          <div key={col.id} className="min-w-[180px] space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
            </div>
            {cards.map(app => {
              const next = STATUS_TRANSITIONS[app.status]
              return (
                <Card key={app.id} className="p-3 space-y-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {app.job?.company ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {app.job?.title ?? 'Manual Entry'}
                  </p>
                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={() => onStatusChange(app.id, next)}
                    >
                      → {next.replace('_', ' ')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npx vitest run __tests__/api/applications.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Create `apps/web/app/(dashboard)/applications/page.tsx`**

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { ApplicationKanban } from '@/components/applications/ApplicationKanban'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])

  const fetchApplications = useCallback(async () => {
    const r = await fetch('/api/applications')
    const data = await r.json()
    setApplications(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  async function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    await fetchApplications()
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Applications</h1>
      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No applications yet. Save jobs from the Jobs page to start tracking.
        </p>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/applications/ apps/web/components/applications/ \
        apps/web/app/\(dashboard\)/applications/ \
        apps/web/__tests__/api/applications.test.ts
git commit -m "feat: add application Kanban with status transitions and CRUD API"
```

---

## Task 10: Dashboard + Navigation

**Files:**
- Create: `apps/web/components/dashboard/ApplicationFunnel.tsx`
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Create: `apps/web/app/(dashboard)/page.tsx`
- Create: `apps/web/__tests__/components/dashboard/ApplicationFunnel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/__tests__/components/dashboard/ApplicationFunnel.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { ApplicationFunnel } from '@/components/dashboard/ApplicationFunnel'
import type { Application } from '@/lib/types'

const makeApp = (status: string): Application => ({
  id: Math.random().toString(), user_id: 'u', job_id: null,
  status: status as any, applied_at: null,
  last_activity_at: '', notes: null, source: 'manual',
})

it('shows correct count for each status', () => {
  const apps = [makeApp('applied'), makeApp('applied'), makeApp('oa')]
  render(<ApplicationFunnel applications={apps} />)
  expect(screen.getAllByText('2')[0]).toBeInTheDocument() // applied count
  expect(screen.getAllByText('1')[0]).toBeInTheDocument() // oa count
})

it('renders all pipeline stage labels', () => {
  render(<ApplicationFunnel applications={[]} />)
  expect(screen.getByText('Applied')).toBeInTheDocument()
  expect(screen.getByText('Interviewing')).toBeInTheDocument()
  expect(screen.getByText('Offer')).toBeInTheDocument()
})

it('shows zero for stages with no applications', () => {
  render(<ApplicationFunnel applications={[]} />)
  // All counts should be 0 — just verifies no crash
  const zeros = screen.getAllByText('0')
  expect(zeros.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run __tests__/components/dashboard/ApplicationFunnel.test.tsx
```

- [ ] **Step 3: Create `apps/web/components/dashboard/ApplicationFunnel.tsx`**

```tsx
import type { Application, ApplicationStatus } from '@/lib/types'

const STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'applied',      label: 'Applied' },
  { status: 'oa',           label: 'OA' },
  { status: 'interviewing', label: 'Interviewing' },
  { status: 'offer',        label: 'Offer' },
  { status: 'rejected',     label: 'Rejected' },
]

interface Props { applications: Application[] }

export function ApplicationFunnel({ applications }: Props) {
  const counts = STAGES.reduce((acc, { status }) => {
    acc[status] = applications.filter(a => a.status === status).length
    return acc
  }, {} as Record<ApplicationStatus, number>)

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Pipeline
      </h2>
      {STAGES.map(({ status, label }) => (
        <div key={status} className="flex items-center justify-between py-1">
          <span className="text-sm">{label}</span>
          <span className="text-sm font-medium tabular-nums">{counts[status] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run __tests__/components/dashboard/ApplicationFunnel.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Create `apps/web/app/(dashboard)/layout.tsx`**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <nav className="w-48 border-r p-4 space-y-1 shrink-0">
        <p className="font-bold text-sm mb-4">AutoApply</p>
        <Link href="/"            className="block p-2 rounded text-sm hover:bg-accent">Dashboard</Link>
        <Link href="/jobs"        className="block p-2 rounded text-sm hover:bg-accent">Jobs</Link>
        <Link href="/applications" className="block p-2 rounded text-sm hover:bg-accent">Applications</Link>
        <Link href="/profile"     className="block p-2 rounded text-sm hover:bg-accent">Profile</Link>
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 6: Create `apps/web/app/(dashboard)/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { ApplicationFunnel } from '@/components/dashboard/ApplicationFunnel'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user!.id)

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {jobCount ?? 0} active job listings
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 border rounded-lg p-4">
          <ApplicationFunnel applications={applications ?? []} />
        </div>
        <div className="col-span-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>Phase 1 complete.</strong> Browse jobs and track applications manually.
          </p>
          <p className="text-sm text-muted-foreground">
            Email intelligence (OA detection, interview tracking) arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/dashboard/ apps/web/app/\(dashboard\)/ \
        apps/web/__tests__/components/dashboard/
git commit -m "feat: add main dashboard with funnel widget and navigation layout"
```

---

## Task 11: Run Full Test Suite + E2E Smoke Tests

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Run all unit tests**

```bash
cd apps/web && npx vitest run
```

Expected: All tests pass. Count should be ~25+ tests across:
- `__tests__/lib/types.test.ts`
- `__tests__/lib/github/sync.test.ts`
- `__tests__/api/auth/callback.test.ts`
- `__tests__/api/jobs/list.test.ts`
- `__tests__/api/applications.test.ts`
- `__tests__/components/profile/ProfileForm.test.tsx`
- `__tests__/components/jobs/JobCard.test.tsx`
- `__tests__/components/dashboard/ApplicationFunnel.test.tsx`

If any fail, fix before proceeding.

- [ ] **Step 2: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Create `apps/web/playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 4: Create `apps/web/e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('unauthenticated visitor is redirected to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('login page renders Google sign-in button', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
})

test('login page shows Gmail consent notice', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText(/reads your Gmail/i)).toBeVisible()
})
```

- [ ] **Step 5: Run E2E tests**

```bash
npx playwright test
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/
git commit -m "test: add Playwright E2E smoke tests for auth flow"
```

---

## Task 12: Deploy to Vercel + Supabase Production

- [ ] **Step 1: Create production Supabase project**

1. Go to https://supabase.com → New project
2. Note: Project URL, anon key, service role key

- [ ] **Step 2: Link local CLI to production project**

```bash
npx supabase link --project-ref <your-project-ref>
```

- [ ] **Step 3: Push migrations to production**

```bash
npx supabase db push
npx supabase db seed --file supabase/seed.sql
```

Expected: All migrations applied, job_sources seeded.

- [ ] **Step 4: Configure production Google OAuth**

In Supabase Dashboard (production) → Authentication → Providers → Google:
- Enable Google
- Add Client ID + Secret
- Set Redirect URL: `https://<project>.supabase.co/auth/v1/callback`

In Google Cloud Console:
- Add `https://<project>.supabase.co/auth/v1/callback` to Authorized redirect URIs

- [ ] **Step 5: Deploy to Vercel**

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL      = https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon key>
SUPABASE_SERVICE_ROLE_KEY     = <service role key>
GITHUB_TOKEN                  = <github personal access token>
```

- [ ] **Step 6: Add Vercel domain to Supabase allowed URLs**

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://<your-vercel-domain>.vercel.app`
- Redirect URLs: `https://<your-vercel-domain>.vercel.app/api/auth/callback`

- [ ] **Step 7: Trigger first production job sync**

```bash
curl -X POST https://<your-vercel-domain>.vercel.app/api/jobs/sync \
  -H "Authorization: Bearer <service_role_key>"
```

Expected: Jobs appear in production DB.

- [ ] **Step 8: End-to-end production verification**

1. Open `https://<your-vercel-domain>.vercel.app`
2. Unauthenticated → redirects to `/login` ✓
3. Sign in with Google → consent screen → lands on dashboard ✓
4. Go to Profile → save some skills ✓
5. Go to Jobs → listings appear, type filter works ✓
6. Click Save on a job → go to Applications → card appears ✓
7. Advance card through Kanban ✓

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "chore: Phase 1 complete — foundation deployed to Vercel + Supabase"
```

---

## Running Tests

```bash
# Unit + component tests
cd apps/web && npx vitest run

# Watch mode during development
cd apps/web && npx vitest

# E2E tests (requires dev server)
cd apps/web && npx playwright test

# Start local Supabase stack
npx supabase start

# Reset DB to clean state (re-runs migrations + seed)
npx supabase db reset
```

---

## What Phase 2 Adds

Phase 2 plan (separate document) covers:
- Gmail push notifications via Cloud Pub/Sub
- Supabase Edge Functions: `process-email` orchestrator (email classifier → entity extractor → deadline extractor → application matcher)
- Two-tier job relevance scoring (rule-based + Claude haiku)
- AI confidence UI with override on every auto-detected change
- Dashboard activity feed

Phase 3 covers: Google Calendar sync, weekly insights (Claude sonnet), ghost detector, mobile polish, account deletion.
