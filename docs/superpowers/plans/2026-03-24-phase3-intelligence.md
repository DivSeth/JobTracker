# Phase 3: Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gmail integration, AI email classification, job scoring, ghost detection, and weekly insights to transform AutoApply from manual tracking to an AI-powered application OS.

**Architecture:** Gmail push notifications via Pub/Sub trigger a 5-stage Gemini Flash classification pipeline that auto-detects OA invites, interviews, rejections, and offers. Job scoring uses a two-tier system (rule-based for 85%, Gemini for ambiguous 15%). Ghost detection and weekly insights run as cron jobs.

**Tech Stack:** Next.js 14, Supabase (PostgreSQL + Vault + RLS), Google Gemini Flash (free tier), Gmail API, Google Calendar API, Cloud Pub/Sub, Vitest

**Key Adaptation:** All AI calls use Gemini 2.0 Flash (free) instead of Claude Haiku from original spec.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `lib/ai/gemini.ts` | Gemini Flash client wrapper (shared by all AI modules) |
| `lib/ai/email-classifier.ts` | Step 1: Classify email as oa/interview/rejection/offer/confirm/other |
| `lib/ai/entity-extractor.ts` | Step 2: Extract company, role, job type from email |
| `lib/ai/deadline-extractor.ts` | Step 3a: Extract deadlines/dates from email body |
| `lib/ai/application-matcher.ts` | Step 3b: Match email to existing application |
| `lib/ai/calendar-event.ts` | Step 4: Create Google Calendar event for deadlines |
| `lib/scoring/rule-scorer.ts` | Tier 1: Rule-based job relevance scoring |
| `lib/scoring/gemini-scorer.ts` | Tier 2: Gemini-based scoring for ambiguous jobs |
| `lib/gmail/client.ts` | Gmail API client (fetch messages, history) |
| `lib/gmail/refresh.ts` | OAuth token refresh logic |
| `app/api/auth/gmail/route.ts` | Gmail OAuth initiation (redirect to Google) |
| `app/api/auth/gmail/callback/route.ts` | Gmail OAuth callback (exchange code, store tokens) |
| `app/api/gmail/webhook/route.ts` | Pub/Sub push receiver |
| `app/api/gmail/watch/route.ts` | Register Gmail push watch |
| `app/api/gmail/process/route.ts` | Email processing orchestrator |
| `app/api/jobs/score/route.ts` | Batch job scoring endpoint |
| `app/api/applications/ghost-detect/route.ts` | Ghost detection cron |
| `app/api/insights/generate/route.ts` | Weekly AI insights generator |
| `app/api/profile/export/route.ts` | GDPR data export |
| `supabase/migrations/20260324_phase3_intelligence.sql` | Schema for email_queue, deadlines, insights, ai_logs |
| `__tests__/lib/ai/email-classifier.test.ts` | Classifier unit tests |
| `__tests__/lib/ai/entity-extractor.test.ts` | Entity extractor tests |
| `__tests__/lib/scoring/rule-scorer.test.ts` | Rule scorer tests |
| `__tests__/lib/gmail/refresh.test.ts` | Token refresh tests |

### Modified Files
| File | Changes |
|------|---------|
| `lib/types.ts` | Add EmailQueueItem, Deadline, Insight, AiLog types |
| `middleware.ts` | Whitelist gmail webhook + cron routes |
| `components/layout/Sidebar.tsx` | Gmail connection status indicator |
| `app/(dashboard)/profile/page.tsx` | Connect/Disconnect Gmail button, Delete Account |
| `app/(dashboard)/insights/page.tsx` | Display AI-generated insights |

---

## Task Breakdown

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260324_phase3_intelligence.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Email processing queue
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gmail_message_id TEXT UNIQUE,
  subject TEXT,
  sender TEXT,
  body_preview TEXT,
  classification JSONB,
  entities JSONB,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_email_queue_user_status ON email_queue(user_id, status);

-- Deadlines extracted from emails
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  is_exact BOOLEAN DEFAULT TRUE,
  raw_text TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deadlines_user ON deadlines(user_id, datetime);

-- AI-generated weekly insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  response_rate NUMERIC,
  avg_days_to_response NUMERIC,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- AI call audit log
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  model TEXT NOT NULL,
  step TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON ai_logs(user_id, created_at DESC);

-- User additions for Gmail
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_history_id TEXT;

-- RLS policies
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_queue_user_policy ON email_queue
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY deadlines_user_policy ON deadlines
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY insights_user_policy ON insights
  FOR ALL USING (user_id = auth.uid());
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Copy the SQL above and execute in Supabase Dashboard > SQL Editor.
Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324_phase3_intelligence.sql
git commit -m "feat: add Phase 3 schema — email_queue, deadlines, insights, ai_logs"
```

---

### Task 2: Types + Gemini Client

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/ai/gemini.ts`

- [ ] **Step 1: Add new types to lib/types.ts**

Append after the existing `JobWithScore` interface:

```typescript
export interface EmailQueueItem {
  id: string
  user_id: string
  gmail_message_id: string
  subject: string | null
  sender: string | null
  body_preview: string | null
  classification: EmailClassification | null
  entities: EmailEntities | null
  status: 'pending' | 'processing' | 'done' | 'failed'
  error: string | null
  created_at: string
  processed_at: string | null
}

export interface EmailClassification {
  category: 'oa' | 'interview_invite' | 'rejection' | 'offer' | 'application_confirm' | 'other'
  confidence: number
  reasoning: string
}

export interface EmailEntities {
  company_name: string
  role_title: string
  job_type: 'internship' | 'new_grad' | 'fulltime' | 'unknown'
  location: string | null
  confidence: number
}

export interface ExtractedDeadline {
  type: 'oa_submission' | 'interview_slot' | 'offer_deadline' | 'other'
  datetime: string
  is_exact: boolean
  confidence: number
  raw_text: string
}

export interface Insight {
  id: string
  user_id: string
  insights: InsightItem[]
  response_rate: number | null
  avg_days_to_response: number | null
  week_start: string
  created_at: string
}

export interface InsightItem {
  type: 'stat' | 'recommendation' | 'warning'
  message: string
  data_point: string | null
}
```

- [ ] **Step 2: Create Gemini client wrapper**

```typescript
// lib/ai/gemini.ts

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
  }
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<{
  text: string
  inputTokens: number
  outputTokens: number
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data: GeminiResponse = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

/** Parse JSON from Gemini response, handling markdown code fences */
export function parseGeminiJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as T
}
```

- [ ] **Step 3: Run build to verify types**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/ai/gemini.ts
git commit -m "feat: add Phase 3 types and Gemini Flash client wrapper"
```

---

### Task 3: Gmail OAuth Flow

**Files:**
- Create: `lib/gmail/refresh.ts`
- Create: `app/api/auth/gmail/route.ts`
- Create: `app/api/auth/gmail/callback/route.ts`
- Modify: `middleware.ts`
- Test: `__tests__/lib/gmail/refresh.test.ts`

- [ ] **Step 1: Write token refresh tests**

```typescript
// __tests__/lib/gmail/refresh.test.ts
import { describe, it, expect, vi } from 'vitest'
import { shouldRefreshToken, buildAuthUrl } from '@/lib/gmail/refresh'

describe('shouldRefreshToken', () => {
  it('returns true when expires_at is within 5 minutes', () => {
    const soon = Math.floor(Date.now() / 1000) + 200 // 200s from now
    expect(shouldRefreshToken(soon)).toBe(true)
  })

  it('returns false when expires_at is far in the future', () => {
    const later = Math.floor(Date.now() / 1000) + 3600
    expect(shouldRefreshToken(later)).toBe(false)
  })

  it('returns true when expires_at is in the past', () => {
    const past = Math.floor(Date.now() / 1000) - 100
    expect(shouldRefreshToken(past)).toBe(true)
  })

  it('returns true when expires_at is undefined', () => {
    expect(shouldRefreshToken(undefined)).toBe(true)
  })
})

describe('buildAuthUrl', () => {
  it('includes required scopes and redirect URI', () => {
    const url = buildAuthUrl('https://example.com/api/auth/gmail/callback')
    expect(url).toContain('scope=')
    expect(url).toContain('gmail.readonly')
    expect(url).toContain('calendar.events')
    expect(url).toContain('redirect_uri=')
    expect(url).toContain('access_type=offline')
    expect(url).toContain('prompt=consent')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/gmail/refresh.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement Gmail refresh/auth utilities**

```typescript
// lib/gmail/refresh.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { getGmailTokens, storeGmailTokens, type GmailTokens } from './vault'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

/** Check if token needs refresh (within 5 min of expiry or already expired) */
export function shouldRefreshToken(expiresAt: number | undefined): boolean {
  if (!expiresAt) return true
  const now = Math.floor(Date.now() / 1000)
  return expiresAt - now < 300 // 5 minutes
}

/** Build Google OAuth consent URL */
export function buildAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GmailTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  }
}

/** Refresh access token using refresh_token */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_at: number
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  }
}

/** Get a valid access token, refreshing if needed */
export async function getValidAccessToken(
  adminClient: SupabaseClient,
  userId: string
): Promise<string> {
  const tokens = await getGmailTokens(adminClient, userId)
  if (!tokens) throw new Error('No Gmail tokens found for user')

  if (!shouldRefreshToken(tokens.expires_at)) {
    return tokens.access_token
  }

  if (!tokens.refresh_token) throw new Error('No refresh token available')

  const refreshed = await refreshAccessToken(tokens.refresh_token)
  const updated: GmailTokens = {
    ...tokens,
    access_token: refreshed.access_token,
    expires_at: refreshed.expires_at,
  }
  await storeGmailTokens(adminClient, userId, updated)
  return updated.access_token
}
```

- [ ] **Step 4: Create Gmail OAuth initiation route**

```typescript
// app/api/auth/gmail/route.ts
import { createClient } from '@/lib/supabase/server'
import { buildAuthUrl } from '@/lib/gmail/refresh'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/auth/gmail/callback`
  const authUrl = buildAuthUrl(redirectUri)

  return NextResponse.redirect(authUrl)
}
```

- [ ] **Step 5: Create Gmail OAuth callback route**

```typescript
// app/api/auth/gmail/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/gmail/refresh'
import { storeGmailTokens } from '@/lib/gmail/vault'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/profile?gmail_error=denied`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const redirectUri = `${origin}/api/auth/gmail/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await storeGmailTokens(adminClient, user.id, tokens)

    // Mark user as Gmail-connected
    await adminClient
      .from('users')
      .update({ gmail_connected_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.redirect(`${origin}/profile?gmail=connected`)
  } catch (err) {
    console.error('Gmail OAuth failed:', err)
    return NextResponse.redirect(`${origin}/profile?gmail_error=token_failed`)
  }
}
```

- [ ] **Step 6: Update middleware to whitelist Gmail routes**

Add to the `isPublicPath` check in `middleware.ts`:
```typescript
    request.nextUrl.pathname.startsWith('/api/gmail/webhook') ||
    request.nextUrl.pathname.startsWith('/api/jobs/score') ||
    request.nextUrl.pathname.startsWith('/api/applications/ghost-detect') ||
    request.nextUrl.pathname.startsWith('/api/insights/generate')
```

- [ ] **Step 7: Run tests**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/gmail/refresh.test.ts`
Expected: PASS

- [ ] **Step 8: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add lib/gmail/refresh.ts app/api/auth/gmail/ middleware.ts __tests__/lib/gmail/
git commit -m "feat: add Gmail OAuth flow with token refresh"
```

---

### Task 4: Gmail Pub/Sub Webhook + Watch

**Files:**
- Create: `lib/gmail/client.ts`
- Create: `app/api/gmail/webhook/route.ts`
- Create: `app/api/gmail/watch/route.ts`

- [ ] **Step 1: Create Gmail API client**

```typescript
// lib/gmail/client.ts

export interface GmailMessage {
  id: string
  subject: string | null
  sender: string | null
  bodyPreview: string | null
  date: string | null
}

/** Fetch message headers + snippet from Gmail API */
export async function fetchMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) throw new Error(`Gmail fetch failed: ${res.status}`)
  const data = await res.json()

  const headers: Record<string, string> = {}
  for (const h of data.payload?.headers ?? []) {
    headers[h.name.toLowerCase()] = h.value
  }

  return {
    id: data.id,
    subject: headers['subject'] ?? null,
    sender: headers['from'] ?? null,
    bodyPreview: data.snippet ?? null,
    date: headers['date'] ?? null,
  }
}

/** Get new messages since a historyId */
export async function getHistoryMessages(
  accessToken: string,
  startHistoryId: string
): Promise<string[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    if (res.status === 404) return [] // historyId expired, full sync needed
    throw new Error(`Gmail history failed: ${res.status}`)
  }

  const data = await res.json()
  const messageIds = new Set<string>()
  for (const h of data.history ?? []) {
    for (const m of h.messagesAdded ?? []) {
      messageIds.add(m.message.id)
    }
  }
  return [...messageIds]
}

/** Register Gmail push notifications */
export async function registerWatch(
  accessToken: string,
  topicName: string
): Promise<{ historyId: string; expiration: string }> {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/watch',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName,
        labelIds: ['INBOX'],
      }),
    }
  )

  if (!res.ok) throw new Error(`Watch registration failed: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 2: Create Pub/Sub webhook receiver**

```typescript
// app/api/gmail/webhook/route.ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/gmail/refresh'
import { getHistoryMessages, fetchMessage } from '@/lib/gmail/client'

export async function POST(request: Request) {
  // Verify Pub/Sub token
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const body = await request.json()
  const data = body.message?.data
  if (!data) return NextResponse.json({ ok: true }) // ACK empty

  // Decode Pub/Sub message
  const decoded = JSON.parse(Buffer.from(data, 'base64').toString())
  const emailAddress = decoded.emailAddress
  const historyId = decoded.historyId?.toString()

  if (!emailAddress || !historyId) return NextResponse.json({ ok: true })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user by email
  const { data: user } = await adminClient
    .from('users')
    .select('id, last_history_id')
    .eq('email', emailAddress)
    .single()

  if (!user) return NextResponse.json({ ok: true }) // Unknown user, ACK anyway

  try {
    const accessToken = await getValidAccessToken(adminClient, user.id)
    const startId = user.last_history_id ?? historyId

    const messageIds = await getHistoryMessages(accessToken, startId)

    // Queue new messages
    for (const msgId of messageIds) {
      // Skip if already queued
      const { data: existing } = await adminClient
        .from('email_queue')
        .select('id')
        .eq('gmail_message_id', msgId)
        .maybeSingle()

      if (existing) continue

      const msg = await fetchMessage(accessToken, msgId)
      await adminClient.from('email_queue').insert({
        user_id: user.id,
        gmail_message_id: msgId,
        subject: msg.subject,
        sender: msg.sender,
        body_preview: msg.bodyPreview,
        status: 'pending',
      })
    }

    // Update last_history_id
    await adminClient
      .from('users')
      .update({ last_history_id: historyId })
      .eq('id', user.id)

    // Trigger processing (fire and forget)
    fetch(new URL('/api/gmail/process', request.url).toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: user.id }),
    }).catch(() => {}) // Don't wait
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return NextResponse.json({ ok: true }) // Always ACK to Pub/Sub
}
```

- [ ] **Step 3: Create watch registration endpoint**

```typescript
// app/api/gmail/watch/route.ts
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/gmail/refresh'
import { registerWatch } from '@/lib/gmail/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const accessToken = await getValidAccessToken(adminClient, user.id)
    const topicName = `projects/${process.env.GCP_PROJECT_ID || 'project-3e415de7-4d81-4157-950'}/topics/autoapply-gmail-push`

    const result = await registerWatch(accessToken, topicName)

    await adminClient
      .from('users')
      .update({
        gmail_watch_expiry: new Date(parseInt(result.expiration)).toISOString(),
        last_history_id: result.historyId,
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true, expiration: result.expiration })
  } catch (err) {
    console.error('Watch registration failed:', err)
    return NextResponse.json({ error: 'Watch registration failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add lib/gmail/client.ts app/api/gmail/
git commit -m "feat: add Gmail Pub/Sub webhook receiver and watch registration"
```

---

### Task 5: AI Email Classification Pipeline

**Files:**
- Create: `lib/ai/email-classifier.ts`
- Create: `lib/ai/entity-extractor.ts`
- Create: `lib/ai/deadline-extractor.ts`
- Create: `lib/ai/application-matcher.ts`
- Test: `__tests__/lib/ai/email-classifier.test.ts`
- Test: `__tests__/lib/ai/entity-extractor.test.ts`

- [ ] **Step 1: Write classifier tests**

```typescript
// __tests__/lib/ai/email-classifier.test.ts
import { describe, it, expect } from 'vitest'
import { buildClassifierPrompt, parseClassification } from '@/lib/ai/email-classifier'

describe('buildClassifierPrompt', () => {
  it('includes subject, body, and sender domain', () => {
    const prompt = buildClassifierPrompt({
      subject: 'Online Assessment Invitation',
      body: 'Complete this HackerRank assessment',
      sender_domain: 'hackerrank.com',
      current_date: '2026-03-24',
    })
    expect(prompt).toContain('Online Assessment Invitation')
    expect(prompt).toContain('hackerrank.com')
  })
})

describe('parseClassification', () => {
  it('parses valid JSON response', () => {
    const result = parseClassification('{"category":"oa","confidence":0.95,"reasoning":"HackerRank assessment link"}')
    expect(result.category).toBe('oa')
    expect(result.confidence).toBe(0.95)
  })

  it('defaults to other on invalid JSON', () => {
    const result = parseClassification('not json')
    expect(result.category).toBe('other')
    expect(result.confidence).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ai/email-classifier.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement email classifier**

```typescript
// lib/ai/email-classifier.ts
import { callGemini, parseGeminiJSON } from './gemini'
import type { EmailClassification } from '@/lib/types'

interface ClassifierInput {
  subject: string
  body: string
  sender_domain: string
  current_date: string
}

const SYSTEM_PROMPT = `You are an email classifier for a job application tracker. Classify emails into exactly one category.

Categories:
- oa: Online assessment invitation (HackerRank, CodeSignal, Karat, take-home)
- interview_invite: Interview scheduling (phone screen, onsite, virtual)
- rejection: Application rejected or position filled
- offer: Job offer or offer letter
- application_confirm: Confirmation that application was received
- other: Not job-application related

Respond in JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`

export function buildClassifierPrompt(input: ClassifierInput): string {
  return `Subject: ${input.subject}
Sender domain: ${input.sender_domain}
Date: ${input.current_date}
Body (first 500 chars): ${input.body.slice(0, 500)}`
}

export function parseClassification(text: string): EmailClassification {
  try {
    const parsed = parseGeminiJSON<EmailClassification>(text)
    if (!parsed.category || typeof parsed.confidence !== 'number') {
      return { category: 'other', confidence: 0, reasoning: 'Parse error' }
    }
    return parsed
  } catch {
    return { category: 'other', confidence: 0, reasoning: 'Parse error' }
  }
}

export async function classifyEmail(input: ClassifierInput): Promise<{
  result: EmailClassification
  inputTokens: number
  outputTokens: number
}> {
  const prompt = buildClassifierPrompt(input)
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)
  return { result: parseClassification(text), inputTokens, outputTokens }
}
```

- [ ] **Step 4: Implement entity extractor**

```typescript
// lib/ai/entity-extractor.ts
import { callGemini, parseGeminiJSON } from './gemini'
import type { EmailEntities } from '@/lib/types'

const SYSTEM_PROMPT = `Extract job application entities from this email. Respond in JSON:
{"company_name": "...", "role_title": "...", "job_type": "internship|new_grad|fulltime|unknown", "location": "..." or null, "confidence": 0.0-1.0}`

export async function extractEntities(
  subject: string,
  body: string,
  category: string
): Promise<{ result: EmailEntities; inputTokens: number; outputTokens: number }> {
  const prompt = `Category: ${category}\nSubject: ${subject}\nBody: ${body.slice(0, 500)}`
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const result = parseGeminiJSON<EmailEntities>(text)
    return { result, inputTokens, outputTokens }
  } catch {
    return {
      result: { company_name: 'Unknown', role_title: 'Unknown', job_type: 'unknown', location: null, confidence: 0 },
      inputTokens, outputTokens,
    }
  }
}
```

- [ ] **Step 5: Implement deadline extractor**

```typescript
// lib/ai/deadline-extractor.ts
import { callGemini, parseGeminiJSON } from './gemini'
import type { ExtractedDeadline } from '@/lib/types'

const SYSTEM_PROMPT = `Extract deadlines and time-sensitive dates from this job-related email.
Respond in JSON: {"deadlines": [{"type": "oa_submission|interview_slot|offer_deadline|other", "datetime": "ISO8601", "is_exact": true/false, "confidence": 0.0-1.0, "raw_text": "..."}]}
If no deadlines found, return {"deadlines": []}`

export async function extractDeadlines(
  body: string,
  category: string,
  currentDate: string,
  userTimezone: string
): Promise<{ result: ExtractedDeadline[]; inputTokens: number; outputTokens: number }> {
  const prompt = `Category: ${category}\nCurrent date: ${currentDate}\nTimezone: ${userTimezone}\nBody: ${body.slice(0, 800)}`
  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const parsed = parseGeminiJSON<{ deadlines: ExtractedDeadline[] }>(text)
    return { result: parsed.deadlines ?? [], inputTokens, outputTokens }
  } catch {
    return { result: [], inputTokens, outputTokens }
  }
}
```

- [ ] **Step 6: Implement application matcher**

```typescript
// lib/ai/application-matcher.ts
import type { EmailEntities, ApplicationStatus } from '@/lib/types'

interface MatcherInput {
  entities: EmailEntities
  applications: Array<{ id: string; company: string; title: string; status: string }>
}

interface MatcherResult {
  matched_application_id: string | null
  is_new: boolean
  suggested_status: ApplicationStatus
}

const CATEGORY_TO_STATUS: Record<string, ApplicationStatus> = {
  oa: 'oa',
  interview_invite: 'interviewing',
  rejection: 'rejected',
  offer: 'offer',
  application_confirm: 'applied',
}

/** Match extracted entities to existing applications using fuzzy company+title matching */
export function matchApplication(input: MatcherInput, emailCategory: string): MatcherResult {
  const suggested = CATEGORY_TO_STATUS[emailCategory] ?? 'applied'

  const companyNorm = input.entities.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Find best match by company name similarity
  let bestMatch: { id: string; score: number } | null = null

  for (const app of input.applications) {
    const appCompany = app.company.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Exact company match
    if (appCompany === companyNorm || appCompany.includes(companyNorm) || companyNorm.includes(appCompany)) {
      const titleSimilarity = titleOverlap(input.entities.role_title, app.title)
      const score = titleSimilarity

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: app.id, score }
      }
    }
  }

  // Require minimum score of 0.3 for a match
  if (bestMatch && bestMatch.score >= 0.3) {
    return { matched_application_id: bestMatch.id, is_new: false, suggested_status: suggested }
  }

  return { matched_application_id: null, is_new: true, suggested_status: suggested }
}

/** Simple word overlap ratio between two titles */
function titleOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  if (wordsA.size === 0 || wordsB.size === 0) return 0.5 // Unknown, give benefit of doubt
  let overlap = 0
  for (const w of wordsA) { if (wordsB.has(w)) overlap++ }
  return overlap / Math.max(wordsA.size, wordsB.size)
}
```

- [ ] **Step 7: Run tests**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/ai/`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/ai/ __tests__/lib/ai/
git commit -m "feat: add AI email classification pipeline (classifier, entities, deadlines, matcher)"
```

---

### Task 6: Email Processing Orchestrator

**Files:**
- Create: `app/api/gmail/process/route.ts`

- [ ] **Step 1: Implement the orchestrator**

```typescript
// app/api/gmail/process/route.ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { classifyEmail } from '@/lib/ai/email-classifier'
import { extractEntities } from '@/lib/ai/entity-extractor'
import { extractDeadlines } from '@/lib/ai/deadline-extractor'
import { matchApplication } from '@/lib/ai/application-matcher'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const userId = body.user_id as string | undefined

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch pending emails
  let query = adminClient.from('email_queue').select('*').eq('status', 'pending').limit(10)
  if (userId) query = query.eq('user_id', userId)
  const { data: pending } = await query

  if (!pending?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const item of pending) {
    try {
      // Mark processing
      await adminClient.from('email_queue').update({ status: 'processing' }).eq('id', item.id)

      const senderDomain = item.sender?.match(/@([\w.-]+)/)?.[1] ?? 'unknown'

      // Step 1: Classify
      const { result: classification, inputTokens: ct1, outputTokens: ct2 } = await classifyEmail({
        subject: item.subject ?? '',
        body: item.body_preview ?? '',
        sender_domain: senderDomain,
        current_date: new Date().toISOString().split('T')[0],
      })

      // Log AI call
      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'classify',
        input_tokens: ct1, output_tokens: ct2, latency_ms: 0,
      })

      // Early exit for non-job emails (~70%)
      if (classification.category === 'other') {
        await adminClient.from('email_queue').update({
          status: 'done', classification, processed_at: new Date().toISOString(),
        }).eq('id', item.id)
        processed++
        continue
      }

      // Step 2: Extract entities
      const { result: entities, inputTokens: et1, outputTokens: et2 } = await extractEntities(
        item.subject ?? '', item.body_preview ?? '', classification.category
      )

      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'entities',
        input_tokens: et1, output_tokens: et2, latency_ms: 0,
      })

      // Step 3 (parallel): Deadlines + Application match
      const [deadlineResult, matchResult] = await Promise.all([
        extractDeadlines(item.body_preview ?? '', classification.category, new Date().toISOString().split('T')[0], 'America/New_York'),
        (async () => {
          const { data: apps } = await adminClient
            .from('applications')
            .select('id, job:jobs(company, title)')
            .eq('user_id', item.user_id)
          const flat = (apps ?? []).map((a: { id: string; job: { company: string; title: string } | null }) => ({
            id: a.id, company: a.job?.company ?? '', title: a.job?.title ?? '', status: '',
          }))
          return matchApplication({ entities, applications: flat }, classification.category)
        })(),
      ])

      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'deadlines',
        input_tokens: deadlineResult.inputTokens, output_tokens: deadlineResult.outputTokens, latency_ms: 0,
      })

      // Step 5: Persist results
      if (matchResult.matched_application_id) {
        // Update existing application status
        await adminClient.from('applications').update({
          status: matchResult.suggested_status,
          last_activity_at: new Date().toISOString(),
        }).eq('id', matchResult.matched_application_id)
      } else if (matchResult.is_new && classification.confidence >= 0.7) {
        // Create new application from email
        const { data: newApp } = await adminClient.from('applications').insert({
          user_id: item.user_id,
          status: matchResult.suggested_status,
          applied_at: new Date().toISOString(),
          source: 'email_detected',
          last_activity_at: new Date().toISOString(),
        }).select('id').single()

        // Store deadlines if any
        if (newApp && deadlineResult.result.length > 0) {
          for (const d of deadlineResult.result) {
            await adminClient.from('deadlines').insert({
              user_id: item.user_id,
              application_id: newApp.id,
              email_queue_id: item.id,
              type: d.type,
              datetime: d.datetime,
              is_exact: d.is_exact,
              raw_text: d.raw_text,
            })
          }
        }
      }

      // Mark done
      await adminClient.from('email_queue').update({
        status: 'done',
        classification,
        entities,
        processed_at: new Date().toISOString(),
      }).eq('id', item.id)

      processed++
    } catch (err) {
      console.error('Email processing error:', err)
      await adminClient.from('email_queue').update({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      }).eq('id', item.id)
    }
  }

  return NextResponse.json({ processed })
}
```

- [ ] **Step 2: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/api/gmail/process/route.ts
git commit -m "feat: add email processing orchestrator with 5-stage pipeline"
```

---

### Task 7: Two-Tier Job Relevance Scoring

**Files:**
- Create: `lib/scoring/rule-scorer.ts`
- Create: `lib/scoring/gemini-scorer.ts`
- Create: `app/api/jobs/score/route.ts`
- Test: `__tests__/lib/scoring/rule-scorer.test.ts`

- [ ] **Step 1: Write rule scorer tests**

```typescript
// __tests__/lib/scoring/rule-scorer.test.ts
import { describe, it, expect } from 'vitest'
import { ruleBasedScore } from '@/lib/scoring/rule-scorer'
import type { Job, Profile } from '@/lib/types'

const baseJob = {
  required_skills: ['python', 'react', 'typescript'],
  job_type: 'internship',
  location: 'San Francisco, CA',
  remote_policy: null,
} as unknown as Job

const baseProfile = {
  skills: ['Python', 'React', 'TypeScript', 'Node.js'],
  preferences: {
    job_types: ['internship', 'new_grad'],
    locations: ['San Francisco'],
    remote_ok: false,
    min_salary: null,
  },
} as unknown as Profile

describe('ruleBasedScore', () => {
  it('returns strong_match for high skill overlap + type + location match', () => {
    const result = ruleBasedScore(baseJob, baseProfile)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.verdict).toBe('strong_match')
    expect(result.tier).toBe('rule_match')
  })

  it('returns skip for zero skill overlap and wrong type', () => {
    const job = { ...baseJob, required_skills: ['rust', 'haskell', 'erlang'], job_type: 'fulltime', location: 'Berlin, DE' } as unknown as Job
    const profile = { ...baseProfile, preferences: { ...baseProfile.preferences, job_types: ['internship'], locations: ['NYC'] } } as unknown as Profile
    const result = ruleBasedScore(job, profile)
    expect(result.score).toBeLessThan(30)
    expect(result.verdict).toBe('skip')
    expect(result.tier).toBe('rule_skip')
  })

  it('returns needs_gemini for ambiguous cases', () => {
    const job = { ...baseJob, required_skills: ['python', 'java', 'go', 'rust'], location: 'Remote' } as unknown as Job
    const profile = { ...baseProfile, skills: ['Python'], preferences: { ...baseProfile.preferences, locations: ['NYC'], remote_ok: true } } as unknown as Profile
    const result = ruleBasedScore(job, profile)
    expect(result.tier).toBe('needs_gemini')
  })

  it('gives location match for remote_ok profiles', () => {
    const job = { ...baseJob, location: 'Berlin, DE' } as unknown as Job
    const profile = { ...baseProfile, preferences: { ...baseProfile.preferences, locations: [], remote_ok: true } } as unknown as Profile
    const result = ruleBasedScore(job, profile)
    expect(result.score).toBeGreaterThan(0)
  })

  it('handles jobs with no required_skills gracefully', () => {
    const job = { ...baseJob, required_skills: [] } as unknown as Job
    const result = ruleBasedScore(job, baseProfile)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/scoring/rule-scorer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement rule-based scorer**

```typescript
// lib/scoring/rule-scorer.ts
import type { Job, Profile } from '@/lib/types'

export interface ScoringResult {
  score: number
  verdict: 'strong_match' | 'stretch' | 'skip'
  tier: 'rule_match' | 'rule_skip' | 'needs_gemini'
  matching_skills: string[]
  skill_gaps: string[]
}

export function ruleBasedScore(job: Job, profile: Profile): ScoringResult {
  const userSkills = new Set(profile.skills.map(s => s.toLowerCase()))
  const required = job.required_skills.map(s => s.toLowerCase())

  const matching = required.filter(s => userSkills.has(s))
  const gaps = required.filter(s => !userSkills.has(s))
  const skillOverlap = required.length > 0 ? matching.length / required.length : 0.5

  const typeMatch = job.job_type && profile.preferences.job_types.includes(job.job_type) ? 1 : 0

  const locationMatch = profile.preferences.remote_ok ||
    job.remote_policy === 'remote' ||
    profile.preferences.locations.some(l => job.location?.toLowerCase().includes(l.toLowerCase())) ? 1 : 0

  const score = Math.round(skillOverlap * 60 + typeMatch * 20 + locationMatch * 20)

  const matchingOrigCase = job.required_skills.filter(s => userSkills.has(s.toLowerCase()))
  const gapsOrigCase = job.required_skills.filter(s => !userSkills.has(s.toLowerCase()))

  if (score >= 70) return { score, verdict: 'strong_match', tier: 'rule_match', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
  if (score < 30) return { score, verdict: 'skip', tier: 'rule_skip', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
  return { score, verdict: 'stretch', tier: 'needs_gemini', matching_skills: matchingOrigCase, skill_gaps: gapsOrigCase }
}
```

- [ ] **Step 4: Implement Gemini scorer for ambiguous jobs**

```typescript
// lib/scoring/gemini-scorer.ts
import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'
import type { Job, Profile } from '@/lib/types'

interface GeminiScoringResult {
  score: number
  verdict: 'strong_match' | 'stretch' | 'skip'
  matching_skills: string[]
  skill_gaps: string[]
  reasoning: string
}

const SYSTEM_PROMPT = `You are a job relevance scorer. Given a job posting and candidate profile, assess fit.
Consider: skill transferability, career trajectory, growth potential, not just exact keyword matches.
Respond in JSON: {"score": 0-100, "verdict": "strong_match|stretch|skip", "matching_skills": [...], "skill_gaps": [...], "reasoning": "..."}`

export async function geminiScore(
  job: Job,
  profile: Profile
): Promise<{ result: GeminiScoringResult; inputTokens: number; outputTokens: number }> {
  const prompt = `Job:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.required_skills.join(', ') || 'Not specified'}
Preferred Skills: ${job.preferred_skills.join(', ') || 'Not specified'}
Location: ${job.location ?? 'Not specified'}
Type: ${job.job_type ?? 'Not specified'}

Candidate:
Skills: ${profile.skills.join(', ')}
Preferred Job Types: ${profile.preferences.job_types.join(', ')}
Preferred Locations: ${profile.preferences.locations.join(', ')}
Remote OK: ${profile.preferences.remote_ok}`

  const { text, inputTokens, outputTokens } = await callGemini(prompt, SYSTEM_PROMPT)

  try {
    const result = parseGeminiJSON<GeminiScoringResult>(text)
    return { result, inputTokens, outputTokens }
  } catch {
    return {
      result: { score: 50, verdict: 'stretch', matching_skills: [], skill_gaps: [], reasoning: 'Parse error' },
      inputTokens, outputTokens,
    }
  }
}
```

- [ ] **Step 5: Create scoring API endpoint**

```typescript
// app/api/jobs/score/route.ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ruleBasedScore } from '@/lib/scoring/rule-scorer'
import { geminiScore } from '@/lib/scoring/gemini-scorer'
import type { Job, Profile } from '@/lib/types'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all users with profiles
  const { data: profiles } = await adminClient.from('profiles').select('*')
  if (!profiles?.length) return NextResponse.json({ scored: 0, message: 'No profiles found' })

  // Get unscored active jobs (limit per run)
  const { data: jobs } = await adminClient
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .limit(50)

  if (!jobs?.length) return NextResponse.json({ scored: 0 })

  let scored = 0
  let geminiCalls = 0

  for (const profile of profiles) {
    // Find jobs this user hasn't scored yet
    const { data: existingScores } = await adminClient
      .from('job_scores')
      .select('job_id')
      .eq('user_id', profile.user_id)

    const scoredJobIds = new Set((existingScores ?? []).map(s => s.job_id))
    const unscored = jobs.filter(j => !scoredJobIds.has(j.id))

    for (const job of unscored) {
      const rule = ruleBasedScore(job as Job, profile as unknown as Profile)

      let finalScore = rule.score
      let finalVerdict = rule.verdict
      let tier = rule.tier
      let reasoning: string | null = null
      let matchingSkills = rule.matching_skills
      let skillGaps = rule.skill_gaps

      // Tier 2: Gemini for ambiguous
      if (rule.tier === 'needs_gemini' && geminiCalls < 15) {
        try {
          const { result } = await geminiScore(job as Job, profile as unknown as Profile)
          finalScore = result.score
          finalVerdict = result.verdict
          tier = 'claude_scored' // Keep column name for compatibility
          reasoning = result.reasoning
          matchingSkills = result.matching_skills
          skillGaps = result.skill_gaps
          geminiCalls++

          await adminClient.from('ai_logs').insert({
            user_id: profile.user_id, model: 'gemini-2.0-flash', step: 'score',
            input_tokens: 0, output_tokens: 0, latency_ms: 0,
          })
        } catch {
          // Fall back to rule score on Gemini failure
        }
      }

      await adminClient.from('job_scores').upsert({
        job_id: job.id,
        user_id: profile.user_id,
        score: finalScore,
        verdict: finalVerdict,
        tier,
        matching_skills: matchingSkills,
        skill_gaps: skillGaps,
        reasoning,
        scored_at: new Date().toISOString(),
      }, { onConflict: 'job_id,user_id' })

      scored++
    }
  }

  return NextResponse.json({ scored, gemini_calls: geminiCalls })
}
```

- [ ] **Step 6: Run tests**

Run: `cd autoapply/apps/web && npx vitest run __tests__/lib/scoring/`
Expected: PASS

- [ ] **Step 7: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add lib/scoring/ app/api/jobs/score/ __tests__/lib/scoring/
git commit -m "feat: add two-tier job relevance scoring (rule-based + Gemini)"
```

---

### Task 8: Ghost Detector + Weekly Insights

**Files:**
- Create: `app/api/applications/ghost-detect/route.ts`
- Create: `app/api/insights/generate/route.ts`

- [ ] **Step 1: Implement ghost detector**

```typescript
// app/api/applications/ghost-detect/route.ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale, error } = await adminClient
    .from('applications')
    .update({ status: 'ghosted', last_activity_at: new Date().toISOString() })
    .in('status', ['applied', 'oa', 'interviewing'])
    .lt('last_activity_at', thirtyDaysAgo)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ghosted: stale?.length ?? 0 })
}
```

- [ ] **Step 2: Implement weekly insights generator**

```typescript
// app/api/insights/generate/route.ts
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'
import type { InsightItem } from '@/lib/types'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all users with applications
  const { data: users } = await adminClient.from('users').select('id')
  if (!users?.length) return NextResponse.json({ generated: 0 })

  const weekStart = getWeekStart()
  let generated = 0

  for (const user of users) {
    // Check if insight already exists for this week
    const { data: existing } = await adminClient
      .from('insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existing) continue

    const { data: apps } = await adminClient
      .from('applications')
      .select('status, applied_at, last_activity_at')
      .eq('user_id', user.id)

    if (!apps?.length) continue

    const total = apps.length
    const applied = apps.filter(a => a.status !== 'saved').length
    const responded = apps.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
    const ghosted = apps.filter(a => a.status === 'ghosted').length
    const rejected = apps.filter(a => a.status === 'rejected').length
    const offers = apps.filter(a => a.status === 'offer').length
    const responseRate = applied > 0 ? Math.round((responded / applied) * 100) / 100 : 0

    const prompt = `Application stats for a job seeker:
- Total applications: ${total}
- Applied (non-saved): ${applied}
- Got responses (OA/interview/offer): ${responded}
- Offers: ${offers}
- Rejected: ${rejected}
- Ghosted (30+ days no response): ${ghosted}
- Response rate: ${(responseRate * 100).toFixed(0)}%

Generate 3-5 actionable insights. Be encouraging but honest.`

    const systemPrompt = `You generate weekly job search insights. Respond in JSON:
{"insights": [{"type": "stat|recommendation|warning", "message": "...", "data_point": "..." or null}]}`

    try {
      const { text } = await callGemini(prompt, systemPrompt)
      const parsed = parseGeminiJSON<{ insights: InsightItem[] }>(text)

      await adminClient.from('insights').insert({
        user_id: user.id,
        insights: parsed.insights,
        response_rate: responseRate,
        avg_days_to_response: null,
        week_start: weekStart,
      })

      generated++
    } catch (err) {
      console.error('Insight generation failed for user:', user.id, err)
    }
  }

  return NextResponse.json({ generated })
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day // Sunday = 0
  const sunday = new Date(now.setDate(diff))
  return sunday.toISOString().split('T')[0]
}
```

- [ ] **Step 3: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/api/applications/ghost-detect/ app/api/insights/generate/
git commit -m "feat: add ghost detector and weekly AI insights generator"
```

---

### Task 9: Data Export + Account Deletion

**Files:**
- Create: `app/api/profile/export/route.ts`
- Modify: `app/api/profile/route.ts` (add DELETE handler)

- [ ] **Step 1: Implement data export**

```typescript
// app/api/profile/export/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, applications, scores, emails, deadlines, insights] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('applications').select('*, job:jobs(title, company, location)').eq('user_id', user.id),
    supabase.from('job_scores').select('*').eq('user_id', user.id),
    supabase.from('email_queue').select('id, subject, sender, classification, created_at').eq('user_id', user.id),
    supabase.from('deadlines').select('*').eq('user_id', user.id),
    supabase.from('insights').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    applications: applications.data,
    job_scores: scores.data,
    email_events: emails.data,
    deadlines: deadlines.data,
    insights: insights.data,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="autoapply-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
```

- [ ] **Step 2: Add DELETE handler to profile route**

Read and modify `app/api/profile/route.ts` — append a DELETE handler:

```typescript
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Revoke Gmail tokens if connected
  try {
    const tokens = await getGmailTokens(adminClient, user.id)
    if (tokens?.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
        method: 'POST',
      })
    }
  } catch { /* Non-fatal */ }

  // Delete vault secrets
  const key = buildVaultKey(user.id)
  const { data: secret } = await adminClient
    .schema('vault')
    .from('secrets')
    .select('id')
    .eq('name', key)
    .maybeSingle()
  if (secret?.id) {
    await adminClient.rpc('vault_delete_secret', { secret_id: secret.id })
  }

  // Delete user (CASCADE handles child tables)
  await adminClient.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
```

Add required imports at top of the file:
```typescript
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getGmailTokens, buildVaultKey } from '@/lib/gmail/vault'
```

- [ ] **Step 3: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/api/profile/
git commit -m "feat: add GDPR data export and account deletion"
```

---

### Task 10: Update Insights Page + Profile Gmail UI

**Files:**
- Modify: `app/(dashboard)/insights/page.tsx`
- Modify: `app/(dashboard)/profile/page.tsx` or `components/profile/ProfileForm.tsx`

- [ ] **Step 1: Add AI insights section to insights page**

Append before the closing `</div>` in the insights page, after the status breakdown section:

```tsx
{/* AI Weekly Insights */}
{(() => {
  // This will be fetched server-side
  return null // Placeholder — fetch and render in next step
})()}
```

Actually, add a server-side fetch and render:

After the existing query block, add:
```typescript
const { data: latestInsight } = await supabase
  .from('insights')
  .select('*')
  .eq('user_id', user.id)
  .order('week_start', { ascending: false })
  .limit(1)
  .maybeSingle()
```

Then add this section after the status breakdown in the JSX:

```tsx
{latestInsight && (
  <div className="bg-surface-card rounded-2xl p-6 shadow-ambient">
    <h2 className="text-base font-semibold text-on-surface mb-4">AI Insights</h2>
    <div className="space-y-3">
      {(latestInsight.insights as InsightItem[]).map((insight, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
            insight.type === 'stat' ? 'bg-primary' :
            insight.type === 'recommendation' ? 'bg-amber-400' : 'bg-red-400'
          }`} />
          <p className="text-sm text-on-surface">{insight.message}</p>
        </div>
      ))}
    </div>
    <p className="text-xs text-on-surface-muted/50 mt-3">
      Week of {new Date(latestInsight.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </p>
  </div>
)}
```

Import `InsightItem` at the top:
```typescript
import type { InsightItem } from '@/lib/types'
```

- [ ] **Step 2: Run build**

Run: `cd autoapply/apps/web && npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/insights/page.tsx
git commit -m "feat: display AI-generated weekly insights on insights page"
```

---

### Task 11: Run Migration + Manual Testing

- [ ] **Step 1: Run migration SQL in Supabase**

Copy `supabase/migrations/20260324_phase3_intelligence.sql` into Supabase SQL Editor and execute.
Expected: "Success. No rows returned."

- [ ] **Step 2: Push and deploy**

```bash
git push origin main
```

Wait for Vercel deploy.

- [ ] **Step 3: Test Gmail OAuth flow**

Visit `https://autoapply-seven.vercel.app/api/auth/gmail`
Expected: Redirects to Google consent screen.
After consent: Redirects to `/profile?gmail=connected`.

- [ ] **Step 4: Test job scoring**

```bash
curl -s -X POST "https://autoapply-seven.vercel.app/api/jobs/score" \
  -H "Authorization: Bearer $CRON_SECRET"
```
Expected: JSON with `scored` count.

- [ ] **Step 5: Test ghost detection**

```bash
curl -s -X POST "https://autoapply-seven.vercel.app/api/applications/ghost-detect" \
  -H "Authorization: Bearer $CRON_SECRET"
```
Expected: JSON with `ghosted` count.

- [ ] **Step 6: Test insights generation**

```bash
curl -s -X POST "https://autoapply-seven.vercel.app/api/insights/generate" \
  -H "Authorization: Bearer $CRON_SECRET"
```
Expected: JSON with `generated` count.

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Database migration (email_queue, deadlines, insights, ai_logs) | Manual SQL |
| 2 | Types + Gemini client wrapper | Build check |
| 3 | Gmail OAuth flow (initiation + callback + token refresh) | 4 unit tests |
| 4 | Pub/Sub webhook + Gmail watch registration | Build check |
| 5 | AI email pipeline (classifier, entities, deadlines, matcher) | 4 unit tests |
| 6 | Email processing orchestrator | Build check |
| 7 | Two-tier job scoring (rule-based + Gemini) | 5 unit tests |
| 8 | Ghost detector + weekly insights | Build check |
| 9 | Data export + account deletion | Build check |
| 10 | Update insights page UI | Build check |
| 11 | Migration + manual testing | Manual E2E |
