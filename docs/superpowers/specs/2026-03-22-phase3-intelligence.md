# AutoApply OS — Phase 3: Intelligence Layer Specification

**Date:** 2026-03-22
**Status:** Draft
**Author:** Divyaansh Seth
**Depends on:** Phase 2C completion (data quality + UI/UX redesign)

---

## 1. Overview

Phase 3 adds the intelligence layer to AutoApply: Gmail integration for automatic application tracking, AI-powered email classification, Google Calendar sync for deadlines, job relevance scoring, ghost detection, and weekly insights.

**Goal:** Transform AutoApply from a manual tracking tool into an AI-powered application OS that automatically detects, classifies, and tracks job application state changes from email.

---

## 2. Gmail OAuth Setup

### 2.1 Google Cloud Console
- Create OAuth 2.0 credentials (Web Application type)
- Scopes: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/calendar.events`
- Authorized redirect URI: `https://<domain>/api/auth/gmail/callback`

### 2.2 OAuth Flow
1. User clicks "Connect Gmail" → `GET /api/auth/gmail` redirects to Google consent screen
2. Google redirects to `/api/auth/gmail/callback` with auth code
3. Exchange code for tokens (access_token + refresh_token)
4. Store refresh_token in Supabase Vault (`vault.create_secret`)
5. Store `gmail_connected_at` on user record

### 2.3 Token Refresh
- `lib/gmail/auth.ts` utility:
  - Retrieves refresh token from Vault
  - Exchanges for fresh access token via Google's token endpoint
  - Handles expiry (refresh if within 5 minutes of expiry)
  - Returns configured Gmail API client

### 2.4 UI
- "Connect Gmail" button on Dashboard (prominent CTA when not connected)
- Connection status indicator in Sidebar (green dot next to user email)
- "Disconnect Gmail" option in Profile page

---

## 3. Gmail Push Notifications via Cloud Pub/Sub

### 3.1 GCP Setup Checklist
1. Enable Gmail API + Cloud Pub/Sub API in GCP Console
2. Create Pub/Sub topic: `autoapply-gmail-push`
3. Create push subscription → `https://<domain>/api/gmail/webhook`
4. Grant `gmail-api-push@system.gserviceaccount.com` the Pub/Sub Publisher role
5. Store Pub/Sub auth token in env: `PUBSUB_VERIFICATION_TOKEN`

### 3.2 Watch Registration
- `POST /api/gmail/watch` — calls `gmail.users.watch()` with Pub/Sub topic
- Stores `gmail_watch_expiry` on user (7-day lifetime)
- Daily Vercel cron checks: if expiry within 2 days, auto-renew

### 3.3 Webhook Receiver
- `POST /api/gmail/webhook` — receives Pub/Sub push notification
- Verifies auth token
- Extracts `historyId` from notification
- Calls Gmail `history.list(startHistoryId)` to get new messages
- For each new message: fetch headers (Subject, From, Date) + body snippet
- Insert into `email_queue` table with `status: 'pending'`
- Trigger processing pipeline

### 3.4 DB Schema Addition
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gmail_message_id TEXT UNIQUE,
  subject TEXT,
  sender TEXT,
  body_preview TEXT,
  status TEXT DEFAULT 'pending', -- pending | processing | done | failed
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_history_id TEXT;
```

---

## 4. AI Email Classification Pipeline

### 4.1 Architecture

5-stage pipeline using Claude Haiku for cost efficiency (~$0.00025/call):

```
Email arrives via webhook
  → Step 1: Classifier (haiku) → 70% exit as "other"
  → Step 2: Entity Extractor (haiku)
  → Step 3a: Deadline Extractor (haiku) ┐ parallel
  → Step 3b: Application Matcher (haiku) ┘
  → Step 4: Calendar Event Creator (haiku, conditional)
  → Step 5: Atomic DB write
```

### 4.2 Step 1: Email Classifier

**File:** `lib/ai/email-classifier.ts`

```typescript
interface ClassifierInput {
  subject: string
  body: string           // max 500 chars
  sender_domain: string
  current_date: string
}
interface ClassifierOutput {
  category: 'oa' | 'interview_invite' | 'rejection' | 'offer' | 'application_confirm' | 'other'
  confidence: number     // 0.0-1.0
  reasoning: string
}
```

- Model: `claude-haiku-4-5-20251001`
- Exit early on `category === 'other'` (estimated 70% of emails)
- `confidence < 0.7` → flag for user review, don't auto-apply

### 4.3 Step 2: Entity Extractor

**File:** `lib/ai/entity-extractor.ts`

```typescript
interface EntityInput {
  subject: string
  body: string
  category: string
}
interface EntityOutput {
  company_name: string
  role_title: string
  job_type: 'internship' | 'new_grad' | 'fulltime' | 'unknown'
  location: string | null
  confidence: number
}
```

### 4.4 Step 3a: Deadline Extractor (parallel)

**File:** `lib/ai/deadline-extractor.ts`

```typescript
interface DeadlineInput {
  body: string
  category: string
  current_date: string
  user_timezone: string
}
interface DeadlineOutput {
  deadlines: Array<{
    type: 'oa_submission' | 'interview_slot' | 'offer_deadline' | 'other'
    datetime: string    // ISO8601
    is_exact: boolean
    confidence: number
    raw_text: string
  }>
}
```

### 4.5 Step 3b: Application Matcher (parallel)

**File:** `lib/ai/application-matcher.ts`

```typescript
interface MatcherInput {
  entities: EntityOutput
  user_applications: Array<{ id: string; company: string; title: string; status: string }>
}
interface MatcherOutput {
  matched_application_id: string | null
  confidence: number
  is_new: boolean       // true = create new application row
  suggested_status: string
}
```

- If match found: update application status based on classified category
- If no match: create new application with `source: 'email_detected'`

### 4.6 Step 4: Calendar Event Creator (conditional)

**File:** `lib/ai/calendar-event-generator.ts`

- Only runs if Step 3a found deadlines
- Creates Google Calendar event via Calendar API
- Event title: `{type}: {company} - {role}`
- 30-minute reminder
- Stores `calendar_event_id` on deadline row

### 4.7 Orchestrator

**File:** `app/api/gmail/process/route.ts`

```typescript
async function processEmail(queueItem: EmailQueueItem, userId: string) {
  // Step 1
  const classification = await classify(queueItem)
  if (classification.category === 'other') return markDone(queueItem.id)

  // Step 2
  const entities = await extractEntities(queueItem, classification)

  // Step 3 (parallel)
  const [deadlines, match] = await Promise.all([
    extractDeadlines(queueItem, classification),
    matchApplication(entities, userId)
  ])

  // Step 4 (conditional)
  if (deadlines.deadlines.length > 0) {
    await createCalendarEvents(deadlines, entities, userId)
  }

  // Step 5: Atomic write
  await persistAll(userId, queueItem, classification, entities, deadlines, match)
}
```

### 4.8 Cost Estimate

| Scenario | Emails/mo | Classifier calls | Pipeline calls | Monthly cost |
|----------|-----------|-----------------|----------------|-------------|
| Light user | 50 | 50 | 15 | ~$0.02 |
| Active user | 200 | 200 | 60 | ~$0.08 |
| Heavy user | 500 | 500 | 150 | ~$0.19 |

---

## 5. Two-Tier Job Relevance Scoring

### 5.1 Tier 1: Rule-Based (85% of jobs)

**File:** `lib/scoring/rule-scorer.ts`

```typescript
function ruleBasedScore(job: Job, profile: Profile): ScoringResult {
  const userSkills = new Set(profile.skills.map(s => s.toLowerCase()))
  const required = job.required_skills.map(s => s.toLowerCase())
  const skillOverlap = required.length > 0
    ? required.filter(s => userSkills.has(s)).length / required.length
    : 0

  const typeMatch = profile.preferences.job_types.includes(job.job_type) ? 1 : 0
  const locationMatch = profile.preferences.remote_ok ||
    profile.preferences.locations.some(l => job.location?.includes(l)) ? 1 : 0

  const score = Math.round(skillOverlap * 60 + typeMatch * 20 + locationMatch * 20)

  if (score >= 70) return { score, verdict: 'strong_match', tier: 'rule_match' }
  if (score < 30) return { score, verdict: 'skip', tier: 'rule_skip' }
  return { score, verdict: 'ambiguous', tier: 'needs_claude' }
}
```

### 5.2 Tier 2: Claude Haiku (15% of jobs)

**File:** `lib/scoring/claude-scorer.ts`

- Only called for `tier === 'needs_claude'` from rule-based scorer
- Considers: career trajectory, transferable skills, growth potential
- Returns: `{ score, matching_skills, skill_gaps, verdict, reasoning }`

### 5.3 Triggers
- Post-sync: batch score new jobs for all users with profiles
- Post-profile-update: re-score all active jobs for that user
- API: `POST /api/jobs/score` (admin/cron only)

---

## 6. Ghost Detector

**File:** `app/api/applications/ghost-detect/route.ts`

- Query: `status IN ('applied', 'oa', 'interviewing') AND last_activity_at < NOW() - 30 days`
- Additional check: no `email_events` linked in last 30 days
- Action: `UPDATE status = 'ghosted'`
- Trigger: Daily Vercel cron
- UI: "Ghosted" status appears in Kanban with gray accent bar

---

## 7. Weekly AI Insights

**File:** `app/api/insights/generate/route.ts`

- Model: Claude Haiku (cost-optimized, not Sonnet)
- Input: user's applications, status transitions, response rates, ghosted count
- Output: 3-5 actionable insights in JSON:
  ```json
  {
    "insights": [
      { "type": "stat", "message": "38% response rate — above average", "data_point": "38%" },
      { "type": "recommendation", "message": "Consider applying to more mid-size companies", "data_point": null },
      { "type": "warning", "message": "3 applications ghosted this week", "data_point": "3" }
    ],
    "response_rate": 0.38,
    "avg_days_to_response": 12.5
  }
  ```
- Trigger: Daily cron, but only runs on Sundays (`new Date().getDay() === 0`)
- Storage: `insights` table (already exists in schema)

---

## 8. Account Management

### 8.1 Data Export
- `GET /api/profile/export` — queries all user tables, returns JSON download
- Includes: profile, applications, email_events, deadlines, insights, job_scores
- GDPR-compliant: user can export all their data at any time

### 8.2 Account Deletion
- `DELETE /api/profile`
- Steps:
  1. Revoke Gmail OAuth token (call Google's revocation endpoint)
  2. Delete Supabase Storage files (resume)
  3. Delete Vault secrets (Gmail tokens)
  4. Delete user row (CASCADE handles all child tables)
- UI: "Delete Account" button in Profile page with typed confirmation ("delete my account")

---

## 9. Security Considerations

| Concern | Implementation |
|---------|---------------|
| Gmail tokens | Supabase Vault (AES-256), never in plain DB |
| Gmail access | Read-only scope only |
| Pub/Sub auth | Verification token on webhook |
| AI decisions | All logged to `ai_logs` table |
| User override | Dashboard shows confidence badges, user can override any AI decision |
| Rate limiting | Max 100 webhook calls/min/user |
| Data isolation | RLS on all user tables |

---

## 10. Implementation Prerequisites

Before starting Phase 3:
- [ ] GCP Project created with Gmail API + Pub/Sub + Calendar API enabled
- [ ] OAuth 2.0 credentials created (Web Application)
- [ ] Pub/Sub topic + subscription configured
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBSUB_VERIFICATION_TOKEN` in env
- [ ] `ANTHROPIC_API_KEY` for Claude Haiku calls
- [ ] Phase 2C data quality improvements complete (skills data needed for scoring)

---

## 11. Estimated Effort

| Task | Days |
|------|------|
| Gmail OAuth + token management | 2 |
| Pub/Sub webhook + watch | 2 |
| AI email pipeline (5 skills + orchestrator) | 3-4 |
| Google Calendar integration | 1-2 |
| Job relevance scoring (2-tier) | 2 |
| Ghost detector | 0.5 |
| Weekly insights | 1 |
| Account management (export + delete) | 1 |
| **Total** | **~13 days** |
