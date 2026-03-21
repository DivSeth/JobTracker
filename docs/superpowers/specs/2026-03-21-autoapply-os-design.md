# AutoApply OS — System Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Author:** Solo builder (Divyaansh Seth)

---

## 1. Problem & Goal

Job seekers applying to many roles face three compounding problems:
1. **Discovery fragmentation** — job listings scattered across GitHub repos, company sites, and boards
2. **Tracking overhead** — manually noting application status, OA deadlines, and interview slots
3. **Signal loss** — important emails (rejections, OA invites, offers) get buried or missed

**Goal:** An AI-powered operating system for job applications that aggregates listings, auto-tracks application state via Gmail, surfaces relevant jobs via profile matching, and integrates with Google Calendar for deadlines — all in a single dashboard.

---

## 2. Scope (MVP)

### In scope
- Dashboard with application funnel, activity feed, upcoming deadlines, job matches, insights
- Job aggregation from GitHub repos (SimplifyJobs New-Grad and Internship repos)
- Job type filtering: New Grad / Internship / Fulltime
- Gmail integration: auto-detect OA invites, interview invites, rejections, offers
- Deadline extraction from emails → Google Calendar events
- Structured user profile (skills, education, experience, preferences)
- Two-tier job relevance scoring against profile
- Manual application Kanban (drag to advance status)
- AI confidence badges + user override on all AI decisions
- Ghost detector: auto-mark applications as ghosted after 30 days
- Weekly AI-generated insights

### Out of scope (deferred)
- Browser extension / autofill
- Outlook / other email providers
- Multi-resume or PDF upload support
- Team / referral features
- Job auto-submission

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | SSR, API routes, Vercel-native, fast UI |
| API | Next.js API Routes | CRUD, auth callbacks, Gmail webhook receiver |
| AI Worker | Supabase Edge Functions (Deno/TypeScript) | Free 500K inv/mo, no separate server |
| Database | PostgreSQL via Supabase | Auth + DB + Realtime + RLS + pg_cron in one |
| Scheduling | Supabase pg_cron | Built-in, free, replaces Inngest |
| Email | Gmail API + Google Cloud Pub/Sub | Push webhooks, no polling |
| Calendar | Google Calendar API | Native Google integration |
| Deploy | Vercel (frontend) + Supabase (backend) | $0/mo on free tiers for MVP |
| Auth | Supabase Auth + Google OAuth | Gmail + Calendar scopes |

**Estimated monthly cost:** ~$0.80/user (Claude API only; all infrastructure is free tier)
*Assumes ~100 emails/month, ~30% pass email classifier, ~500 new jobs/month synced.*

---

## 4. Project Structure

```
autoapply/
├── apps/
│   └── web/                              # Next.js 14
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── callback/route.ts
│       │   ├── (dashboard)/
│       │   │   ├── page.tsx              # main dashboard
│       │   │   ├── jobs/page.tsx
│       │   │   ├── applications/page.tsx
│       │   │   ├── calendar/page.tsx
│       │   │   └── profile/page.tsx
│       │   └── api/
│       │       ├── auth/callback/route.ts
│       │       ├── applications/route.ts
│       │       ├── jobs/route.ts
│       │       ├── gmail/webhook/route.ts
│       │       └── profile/route.ts
│       └── components/
│           ├── dashboard/
│           ├── jobs/
│           ├── applications/
│           ├── calendar/
│           └── ui/
├── supabase/
│   ├── functions/
│   │   ├── _shared/                      # shared skill modules
│   │   │   ├── claude.ts                 # Anthropic client wrapper
│   │   │   ├── gmail.ts                  # Gmail client + token refresh
│   │   │   ├── email-classifier.ts
│   │   │   ├── entity-extractor.ts
│   │   │   ├── deadline-extractor.ts
│   │   │   ├── application-matcher.ts
│   │   │   ├── job-description-parser.ts
│   │   │   ├── job-relevance-scorer.ts
│   │   │   ├── calendar-event-generator.ts
│   │   │   └── types.ts
│   │   ├── process-email/index.ts        # orchestrator
│   │   ├── score-jobs/index.ts
│   │   ├── sync-jobs/index.ts
│   │   └── generate-insights/index.ts
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
└── docs/
    └── superpowers/specs/
```

---

## 5. Database Schema

```sql
-- Core user record (mirrors auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  gmail_watch_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structured profile (one row per user enforced by UNIQUE)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  skills TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',   -- [{school, degree, major, gpa, graduation_year}]
  experience JSONB DEFAULT '[]',  -- [{company, role, start, end, bullets[]}]
  preferences JSONB DEFAULT '{}'  -- {job_types[], locations[], remote_ok, min_salary}
);

-- GitHub repos to watch (global, no RLS — intentionally public)
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  job_type_tag TEXT,              -- "new_grad" | "internship" | "fulltime"
  last_synced_sha TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Job postings (global, no RLS — intentionally public)
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
  is_active BOOLEAN DEFAULT TRUE
);

-- Per-user job scores
CREATE TABLE job_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,                  -- 0-100
  tier TEXT,                      -- "rule_skip" | "rule_match" | "claude_scored"
  matching_skills TEXT[] DEFAULT '{}',
  skill_gaps TEXT[] DEFAULT '{}',
  verdict TEXT,                   -- "strong_match" | "stretch" | "skip"
  reasoning TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Application tracking
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  status TEXT DEFAULT 'saved',    -- saved|applied|oa|interviewing|offer|rejected|ghosted
  applied_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  source TEXT DEFAULT 'manual'    -- "manual" | "email_detected"
);
-- Prevent duplicate applications to the same job (allows null job_id for manual entries)
CREATE UNIQUE INDEX idx_applications_unique_job
  ON applications(user_id, job_id) WHERE job_id IS NOT NULL;

-- AI-processed email events
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

-- Extracted deadlines
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

-- Cached weekly insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB,
  response_rate FLOAT,
  avg_days_to_response FLOAT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI call log for cost monitoring
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
-- INDEXES (critical for page-load query performance)
-- ============================================================
CREATE INDEX idx_applications_user_id     ON applications(user_id);
CREATE INDEX idx_email_events_user_id     ON email_events(user_id);
CREATE INDEX idx_email_events_gmail_id    ON email_events(gmail_message_id); -- dedup
CREATE INDEX idx_job_scores_user_score    ON job_scores(user_id, score DESC);
CREATE INDEX idx_deadlines_user_datetime  ON deadlines(user_id, datetime);
CREATE INDEX idx_jobs_active_type         ON jobs(is_active, job_type);

-- ============================================================
-- RLS — explicitly defined per table
-- NOTE: jobs and job_sources have NO RLS (intentionally public)
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
-- Edge Functions write to user-scoped tables using service role (bypasses RLS).
-- All Edge Function writes MUST explicitly populate user_id.

-- ============================================================
-- pg_cron schedules
-- IMPORTANT: service_key must be stored in Supabase Vault, NOT hardcoded.
-- Reference via: SELECT vault.decrypted_secret('cron_service_key')
-- ============================================================
SELECT cron.schedule('sync-jobs',         '0 */6 * * *', $$SELECT net.http_post(url:='https://<project>.supabase.co/functions/v1/sync-jobs', headers:=format('{"Authorization":"Bearer %s"}', vault.decrypted_secret('cron_service_key'))::jsonb)$$);
SELECT cron.schedule('renew-gmail-watch', '0 0 */6 * *', $$SELECT net.http_post(url:='https://<project>.supabase.co/functions/v1/renew-gmail-watch', headers:=format('{"Authorization":"Bearer %s"}', vault.decrypted_secret('cron_service_key'))::jsonb)$$);
SELECT cron.schedule('weekly-insights',   '0 9 * * 1',   $$SELECT net.http_post(url:='https://<project>.supabase.co/functions/v1/generate-insights', headers:=format('{"Authorization":"Bearer %s"}', vault.decrypted_secret('cron_service_key'))::jsonb)$$);
SELECT cron.schedule('ghost-detector',    '0 8 * * *',   $$UPDATE applications SET status='ghosted', last_activity_at=NOW() WHERE status IN ('applied', 'oa', 'interviewing') AND last_activity_at < NOW() - INTERVAL '30 days'$$);
```

---

## 6. Gmail OAuth Token Storage

Tokens are stored in **Supabase Vault** (AES-256 encrypted), never in a plain DB column.

**Vault key:** `gmail_oauth_<user_id>`

**Stored value:**
```json
{
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "expires_at": "2026-03-21T15:00:00Z",
  "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar"]
}
```

**`getGmailClient(userId)` utility** (`supabase/functions/_shared/gmail.ts`):
```typescript
export async function getGmailClient(userId: string): Promise<GmailClient> {
  const tokenJson = await supabase.rpc('vault_decrypt', { key: `gmail_oauth_${userId}` });
  const token = JSON.parse(tokenJson);

  // Refresh if within 5 minutes of expiry
  if (new Date(token.expires_at).getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshGoogleToken(token.refresh_token);
    refreshed.expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase.rpc('vault_encrypt', {
      key: `gmail_oauth_${userId}`,
      value: JSON.stringify(refreshed)
    });
    return buildGmailClient(refreshed.access_token);
  }

  return buildGmailClient(token.access_token);
}
```

**On account deletion:** Before CASCADE delete, call `google.oauth2.revoke(refresh_token)` to invalidate the token in Google's systems. This is handled in the Next.js `DELETE /api/profile` route.

---

## 7. Claude Skills

### Model Assignment (Cost-Optimized)

| Skill | Model | Estimated cost |
|---|---|---|
| `email-classifier` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `entity-extractor` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `deadline-extractor` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `application-matcher` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `job-description-parser` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `job-relevance-scorer` (tier 2 only) | `claude-haiku-4-5-20251001` | $0.00025/call |
| `calendar-event-generator` | `claude-haiku-4-5-20251001` | $0.00025/call |
| `dashboard-insights-generator` | `claude-sonnet-4-6` | $0.01/call |

Sonnet used **only** for weekly insights. All pipeline skills use haiku.

### Skill Interfaces (`supabase/functions/_shared/types.ts`)

```typescript
// --- Email Pipeline ---

interface EmailClassifierInput {
  subject: string;
  body: string;           // max 2000 chars
  sender_domain: string;
  current_date: string;
}
interface EmailClassifierOutput {
  category: "oa" | "interview_invite" | "rejection" | "offer" | "application_confirm" | "other";
  confidence: number;
  reasoning: string;
}

interface EntityExtractorInput {
  subject: string;
  body: string;
  category: string;
}
interface EntityExtractorOutput {
  company_name: string;
  role_title: string;
  job_type: "internship" | "new_grad" | "fulltime" | "unknown";
  location: string | null;
  round: string | null;
  confidence: number;
}

interface DeadlineExtractorInput {
  body: string;
  category: string;
  current_date: string;
  user_timezone: string;
}
interface DeadlineExtractorOutput {
  deadlines: Array<{
    type: "oa_submission" | "interview_slot" | "offer_deadline" | "other";
    datetime: string;     // ISO8601
    is_exact: boolean;
    confidence: number;
    raw_text: string;
  }>;
}

interface ApplicationMatcherInput {
  entities: EntityExtractorOutput;
  user_id: string;
}
interface ApplicationMatcherOutput {
  application_id: string | null;  // matched existing row, or null
  confidence: number;
  is_new: boolean;                // true = create a new application row
}

interface CalendarEventGeneratorInput {
  deadline: DeadlineExtractorOutput["deadlines"][0];
  company: string;
  role: string;
  user_timezone: string;
}
interface CalendarEventGeneratorOutput {
  title: string;
  description: string;
  start: string;          // ISO8601
  end: string;            // ISO8601
  reminders: Array<{ method: "email" | "popup"; minutes: number }>;
}

// --- Job Pipeline ---

interface JobDescriptionParserInput {
  raw_row: string;        // markdown table row from GitHub repo
  repo_name: string;
}
interface JobDescriptionParserOutput {
  title: string;
  company: string;
  location: string | null;
  apply_url: string | null;
  job_type: string | null;
  confidence: number;
}

interface JobRelevanceScorerInput {
  job: {
    title: string;
    company: string;
    required_skills: string[];
    preferred_skills: string[];
    experience_level: string;
    remote_policy: string;
  };
  profile: {
    skills: string[];
    education: object[];
    experience: object[];
    preferences: object;
  };
}
interface JobRelevanceScorerOutput {
  score: number;          // 0–100
  matching_skills: string[];
  skill_gaps: string[];
  verdict: "strong_match" | "stretch" | "skip";
  reasoning: string;
}

// --- Insights ---

interface InsightsOutput {
  insights: Array<{
    type: "stat" | "recommendation" | "warning" | "trend";
    message: string;
    data_point: string | null;
  }>;
  response_rate: number;
  avg_days_to_response: number;
}
```

### Two-Tier Job Scoring

```typescript
// Tier 1: Free, pure code — resolves ~85% of jobs
function ruleBasedScore(job: Job, profile: Profile): TierResult {
  const userSkills = new Set(profile.skills.map(s => s.toLowerCase()));
  const required = job.required_skills.map(s => s.toLowerCase());
  const ratio = required.length > 0
    ? required.filter(s => userSkills.has(s)).length / required.length
    : 0;

  if (ratio >= 0.70) return { verdict: "strong_match", score: 85, tier: "rule_match", callClaude: false };
  if (ratio < 0.15)  return { verdict: "skip",         score: 10, tier: "rule_skip",  callClaude: false };
  return { tier: "ambiguous", callClaude: true }; // ~15% proceed to Claude haiku
}
```

### Email Pipeline Orchestrator

```typescript
// supabase/functions/process-email/index.ts

async function processEmail(rawEmail: RawEmail, userId: string) {
  // Step 1: Classify (haiku) — ~70% exit here as "other"
  const classification = await emailClassifier(rawEmail);
  if (classification.category === "other") return { actions: ["skipped"] };

  // Step 2: Extract entities (haiku)
  const entities = await entityExtractor(rawEmail, classification.category);

  // Step 3: Parallel — deadline + application match (haiku x2)
  const [deadlines, matchedApp] = await Promise.all([
    deadlineExtractor(rawEmail, classification.category),
    applicationMatcher(entities, userId)
  ]);

  // Step 4: Calendar events (haiku, only if deadlines found)
  const calendarEvents: CalendarEventGeneratorOutput[] = [];
  for (const d of deadlines.deadlines) {
    const event = await calendarEventGenerator(d, entities);
    calendarEvents.push(event);
    await createGoogleCalendarEvent(userId, event);
  }

  // Step 5: Atomic DB write
  await persistResults(userId, classification, entities, deadlines, matchedApp, calendarEvents);

  return { actions: ["processed"] };
}
```

### Confidence & Fallback Logic

- Every skill returns `confidence: 0.0–1.0`
- `confidence < 0.7` → flag for user review in dashboard (not auto-applied)
- Claude returns malformed JSON → retry once with stricter prompt → mark `failed` in DB
- User can override any AI decision via dashboard
- All decisions auditable in `email_events` table

---

## 8. GitHub Job Sync (Diff-Based)

```typescript
async function syncJobSource(source: JobSource) {
  const currentSha = await getLatestCommitSha(source.repo_url);
  if (currentSha === source.last_synced_sha) return; // no changes

  const diff = await getRepoDiff(source.repo_url, source.last_synced_sha, currentSha);
  const newRows = parseAddedMarkdownRows(diff); // pure regex

  for (const row of newRows) {
    // Regex-first, Claude haiku fallback only for unparseable rows
    const parsed = regexParseJobRow(row) ?? await jobDescriptionParser(row);
    await upsertJob(parsed, source.id);
  }

  await updateLastSyncedSha(source.id, currentSha);
}

// Seeded job_sources:
// - SimplifyJobs/New-Grad-Positions      → job_type_tag: "new_grad"
// - SimplifyJobs/Summer2025-Internships  → job_type_tag: "internship"
```

---

## 9. Security

| Concern | Implementation |
|---|---|
| Auth | Supabase Auth + Google OAuth, httpOnly JWT cookies |
| Data isolation | Explicit RLS policies on all user tables — each table has its own `FOR ALL USING (auth.uid() = user_id)` policy |
| OAuth tokens | Supabase Vault (AES-256); never stored in plain DB columns |
| Gmail access | Read-only scope (`gmail.readonly`) only |
| Edge Functions | Internal Supabase invoke only — not public URLs |
| Gmail webhook auth | Cloud Pub/Sub sends a **Bearer token** in `Authorization` header — verified against stored secret (not HMAC) |
| pg_cron service key | Stored in Supabase Vault, referenced via `vault.decrypted_secret('cron_service_key')` — never hardcoded in SQL |
| Gmail watch renewal | pg_cron renews every 6 days (watch expires at 7) |
| User consent | Explicit "this app reads your emails for job tracking" screen before Gmail connect |
| Data deletion | CASCADE delete on `users`; revoke Google OAuth token via `oauth2.revoke(refresh_token)` first |
| Rate limiting | Max 100 Gmail webhook calls/min/user at Next.js route level |

### Cloud Pub/Sub Setup Checklist (Phase 2 prerequisite)
1. Create GCP project, enable Gmail API + Cloud Pub/Sub API
2. Create Pub/Sub topic: `gmail-push-<project>`
3. Create push subscription pointing to `https://<app>.vercel.app/api/gmail/webhook`
4. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on the topic
5. Store the Pub/Sub push auth token in Supabase Vault: `pubsub_webhook_token`
6. Call `gmail.users.watch` per user after Gmail OAuth connect, storing expiry in `users.gmail_watch_expiry`

---

## 10. Dashboard UX

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│  AutoApply  [Jobs] [Applications] [Calendar] [Profile]     [🔔 3]  │
├──────────────────┬───────────────────┬──────────────────────────────┤
│  APPLICATION     │  UPCOMING          │  TOP MATCHES                │
│  FUNNEL          │                   │                              │
│  Applied   42    │  Tomorrow          │  ██████████ 94%             │
│  OA         8 🔴 │  · OA – Meta ⚠️    │  New Grad · Google SWE      │
│  Interview  3    │  · OA – Apple      │  Gaps: Go                   │
│  Offer      1 🟢 │                   │                   [Apply]    │
│  Rejected  11    │  This Week         │                              │
│                  │  · Interview       │  ████████░░ 87%             │
│                  │    – Amazon        │  Internship · Stripe        │
│                  │  [Calendar →]      │  [Apply] [Save]             │
├──────────────────┴───────────────────┴──────────────────────────────┤
│  RECENT ACTIVITY                                                     │
│  ● 2h ago   Rejection detected · Palantir SWE  (87% conf) [Override]│
│  ● 5h ago   OA invite · Deadline Jan 15 · Stripe  [Add Calendar]   │
├─────────────────────────────────────────────────────────────────────┤
│  WEEKLY INSIGHTS                                                     │
│  📈 38% response rate — above average for new grad roles             │
│  💡 0 OAs from 8 fintech apps — consider different roles             │
└─────────────────────────────────────────────────────────────────────┘
```

### Key UX Decisions
- **AI confidence badge** on every auto-detected change: `87% confident · Override`
- **Ghost Detector**: pg_cron marks `ghosted` after 30 days of silence on `applied`, `oa`, or `interviewing` status
- **Deadline urgency**: <48h deadline turns card red, <7d turns amber
- **Source attribution**: every job card shows its GitHub repo source
- **Batch apply**: checkbox-select saved jobs → mark all as applied
- **Type tabs**: `[All] [New Grad] [Internship] [Fulltime]` on jobs page

---

## 11. MVP Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- Supabase: schema with all indexes + explicit RLS policies, Google OAuth
- Gmail OAuth consent UI + token storage in Vault (including token refresh utility)
- Structured profile form (skills, education, experience, preferences)
- Seed `job_sources` with SimplifyJobs repos
- GitHub diff parser (regex-based, no Claude)
- Jobs listing with type filter + basic relevance sort
- Manual application Kanban
- Vercel + Supabase deploy

### Phase 2 — Intelligence (Weeks 4–6)
- Gmail push notifications via Cloud Pub/Sub (follow checklist in Section 9)
- Supabase Edge Function: `process-email` orchestrator
- pg_cron: `sync-jobs` every 6h, `ghost-detector` daily
- Two-tier job scoring (rule-based + haiku)
- Dashboard: funnel stats + activity feed with confidence UI
- Override button on all AI decisions

### Phase 3 — Full Automation (Weeks 7–9)
- Google Calendar sync from extracted deadlines
- Deadline urgency UI (color coding, countdown)
- Weekly insights generator (sonnet, pg_cron Monday 9am)
- Mobile-responsive polish
- Account deletion: revoke Google OAuth token → CASCADE delete all data
- Full data export (GDPR-ready)

---

## 12. Testing Strategy

| Layer | Approach |
|---|---|
| Skill unit tests | Vitest, mock Claude responses, validate output schemas |
| Edge Function integration | VCR-pattern recorded Claude responses, full pipeline test |
| GitHub parser regression | Archived SimplifyJobs markdown as fixtures |
| E2E critical flows | Playwright: sign in → job appears → email updates state |
| RLS isolation tests | Verify cross-user data leak via Supabase test client |
| Cost monitoring | Every Claude call logged to `ai_logs` table (skill, model, tokens, latency) |

---

## 13. Cost Summary

| Scenario | Claude API | Infrastructure | Total |
|---|---|---|---|
| 1 active user | ~$0.80/mo | $0/mo | ~$0.80/mo |
| 10 active users | ~$8/mo | $0/mo | ~$8/mo |
| 100 active users | ~$80/mo | ~$25/mo (Supabase Pro) | ~$105/mo |

*Baseline: ~100 emails/month/user, ~30% pass classifier, ~500 new jobs/month synced, 1 insights call/week.*

Cost gates:
1. Email classifier runs first — ~70% of emails exit as `other`, zero further cost
2. Two-tier scoring — ~85% of jobs resolved by rule-based logic, no Claude call
3. Regex-first job parsing — Claude haiku only for rows that fail regex
4. Insights run weekly, not per-request
5. Per-user monthly budget cap (configurable env var) as circuit breaker
