# Architecture Patterns

**Domain:** Browser extension auto-fill + marketplace/outreach features for existing Next.js app
**Researched:** 2026-03-25

## Recommended Architecture

### High-Level System View

```
[Chrome Extension]                    [Next.js Web App]
  |                                       |
  +-- Popup UI (React)                    +-- Dashboard (existing)
  +-- Content Scripts                     +-- API Routes (existing + new)
  |    +-- Workday Filler                 +-- Referral Marketplace pages
  |    +-- Greenhouse Filler              +-- Outreach pages
  |    +-- Field Detector                 +-- Interview Prep pages
  +-- Background Worker                   +-- Analytics pages
       +-- Supabase Client                |
       +-- Profile Cache                  [Supabase]
       +-- Message Router                   +-- PostgreSQL (data)
       |                                    +-- Auth (shared)
       +-------- API calls --------->       +-- Realtime (notifications)
                                            +-- Storage (files)
                                            +-- Vault (secrets)
                                            +-- RPC (analytics aggregates)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Extension Popup | Profile selection, fill status, settings | Background Worker (chrome.runtime messages) |
| Content Script (per ATS) | DOM manipulation, field detection, form filling | Background Worker (chrome.runtime messages) |
| Background Worker | Auth management, Supabase client, profile caching, message routing | Supabase (direct), Content Scripts (messages), Popup (messages) |
| Web App API Routes | CRUD for profiles, referrals, outreach, prep content | Supabase (direct), Extension Background (HTTP) |
| Supabase | Data persistence, auth, realtime, file storage | All server-side components |

### Data Flow

**Auto-Fill Flow:**
```
1. User navigates to Workday/Greenhouse application page
2. Content script activates (URL pattern match via WXT)
3. Content script scans DOM, identifies form type and fields
4. Content script sends field map to Background Worker
5. Background Worker fetches active profile from cache (or Supabase)
6. Background Worker maps profile fields to ATS field identifiers
7. Background Worker returns fill instructions to Content Script
8. Content script fills each field:
   a. Set input value
   b. Dispatch 'input' event
   c. Dispatch 'change' event
   d. Dispatch 'blur' event
   e. Wait for DOM to settle (MutationObserver)
9. For unknown fields: Content script asks Background Worker
10. Background Worker checks Q&A memory bank
11. If no match: popup notification asking user to answer
12. After all pages filled: notify user to review and submit
13. On user submission: Background Worker POSTs to /api/applications
```

**Referral Marketplace Flow:**
```
1. Applicant requests referral for Company X
2. POST /api/referrals/request -> creates referral_request record
3. Supabase Realtime notifies matched referrers (company match)
4. Referrer accepts -> PATCH /api/referrals/:id/accept
5. Applicant receives notification (Realtime + email via Resend)
6. Referrer submits referral -> PATCH /api/referrals/:id/complete
7. Credit ledger updated via Supabase RPC (atomic transaction)
8. When referral results in hire -> bonus credits
```

**Outreach Draft Flow:**
```
1. User selects job + recruiter from dashboard
2. POST /api/outreach/generate with job_id, recruiter_info, profile_id
3. API calls Gemini Flash with job description + user profile + recruiter context
4. Returns personalized email draft and LinkedIn message draft
5. User edits, then:
   a. Email: sent via Resend API (POST /api/outreach/send)
   b. LinkedIn: copied to clipboard for manual paste
6. Track open/click rates via Resend webhooks
```

## Patterns to Follow

### Pattern 1: ATS Adapter Pattern (Extension Side)

**What:** Each ATS platform gets a dedicated content script module with a common interface.
**When:** Adding support for a new ATS platform.
**Why:** Workday and Greenhouse have completely different DOM structures. A shared interface keeps the Background Worker and Popup agnostic to the ATS.

```typescript
// packages/shared/src/types/ats-filler.ts
interface ATSFiller {
  platform: 'workday' | 'greenhouse' | 'lever';
  detect(): boolean;  // Is this page an application form?
  scanFields(): FieldMap[];  // What fields exist?
  fill(field: FieldMap, value: string): Promise<void>;  // Fill one field
  nextPage(): Promise<boolean>;  // Navigate to next page (Workday)
  isComplete(): boolean;  // All pages done?
}

// apps/extension/src/content-scripts/workday-filler.ts
const workdayFiller: ATSFiller = {
  platform: 'workday',
  detect: () => !!document.querySelector('[data-automation-id="jobPostingPage"]'),
  scanFields: () => { /* Workday-specific DOM scanning */ },
  fill: async (field, value) => { /* Workday-specific fill with event dispatch */ },
  nextPage: async () => { /* Click Workday "Next" button, wait for page load */ },
  isComplete: () => { /* Check if on review/submit page */ },
};
```

### Pattern 2: Message Bus Between Extension Components

**What:** Typed message passing between Content Script, Background Worker, and Popup.
**When:** Any communication between extension contexts (they run in separate JS environments).

```typescript
// packages/shared/src/types/extension-messages.ts
type ExtensionMessage =
  | { type: 'SCAN_FIELDS'; payload: { url: string } }
  | { type: 'FIELDS_SCANNED'; payload: { fields: FieldMap[] } }
  | { type: 'REQUEST_FILL'; payload: { profileId: string } }
  | { type: 'FILL_PROGRESS'; payload: { filled: number; total: number; current: string } }
  | { type: 'UNKNOWN_FIELD'; payload: { field: FieldMap; question: string } }
  | { type: 'USER_ANSWER'; payload: { fieldId: string; answer: string; remember: boolean } }
  | { type: 'FILL_COMPLETE'; payload: { applicationId: string } };
```

### Pattern 3: Credit Ledger as Append-Only Log

**What:** Referral credits tracked as an append-only transaction log, not a mutable balance field.
**When:** Any credit earn/spend/refund operation.
**Why:** Prevents race conditions, enables audit trail, makes disputes resolvable.

```sql
-- Supabase migration
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,  -- positive = earn, negative = spend
  type TEXT NOT NULL,  -- 'referral_complete', 'referral_hired', 'spend_outreach', 'refund'
  reference_id UUID,  -- links to referral_id or outreach_id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Balance is computed, never stored
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Pattern 4: Profile Field Mapping Registry

**What:** A declarative mapping between user profile fields and ATS form field selectors.
**When:** Adding ATS support or handling field mapping updates.

```typescript
// packages/shared/src/mappings/workday.ts
const WORKDAY_FIELD_MAP: FieldMapping[] = [
  { profileField: 'firstName', selector: '[data-automation-id="legalNameSection_firstName"]', type: 'text' },
  { profileField: 'lastName', selector: '[data-automation-id="legalNameSection_lastName"]', type: 'text' },
  { profileField: 'email', selector: '[data-automation-id="email"]', type: 'text' },
  { profileField: 'phone', selector: '[data-automation-id="phone"]', type: 'text' },
  { profileField: 'resume', selector: '[data-automation-id="file-upload-input-ref"]', type: 'file' },
  { profileField: 'education', selector: '[data-automation-id="educationSection"]', type: 'complex' },
  // ... EEO fields, work history, etc.
];
```

**Why declarative:** When Workday updates their DOM (they do, frequently), you update the mapping file, not the fill logic.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Auth Tokens in Content Scripts
**What:** Passing Supabase access tokens to content scripts for direct API calls.
**Why bad:** Content scripts run in the web page's context. A malicious page could read the token. ATS sites you inject into are not under your control.
**Instead:** All authenticated calls go through the Background Worker. Content scripts send messages; Background Worker makes API calls.

### Anti-Pattern 2: Synchronous DOM Filling
**What:** Setting all form fields in a tight loop without waiting for the ATS framework to process each change.
**Why bad:** Workday's React/Angular framework processes state changes asynchronously. Filling too fast causes fields to revert, dropdowns to not update dependent fields, and validation errors.
**Instead:** Fill one field, wait for MutationObserver to confirm the DOM settled (or use a small delay), then fill the next. Treat it as an async pipeline.

### Anti-Pattern 3: Single Monolithic Content Script
**What:** One massive content script that handles all ATS platforms with if/else branching.
**Why bad:** Content scripts are injected into every matching page. A monolithic script is slow to inject and hard to maintain.
**Instead:** Use WXT's content script routing to inject platform-specific scripts only on matching URLs.

### Anti-Pattern 4: Mutable Credit Balance Field
**What:** Storing a `balance` column that gets incremented/decremented directly.
**Why bad:** Race conditions when concurrent referral completions try to update the same balance. No audit trail for disputes.
**Instead:** Append-only transaction log with computed balance (Pattern 3 above).

### Anti-Pattern 5: Putting Analytics Queries in API Routes
**What:** Complex SQL aggregation queries inline in Next.js API route handlers.
**Why bad:** Analytics queries are expensive and should not block API response times. They also expose query logic that should live in the database.
**Instead:** Use Supabase RPC functions for analytics aggregations. Consider materialized views or pg_cron for pre-computing expensive aggregates.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Profile storage | Supabase free tier handles it | Still fine on Pro tier | Partition profiles table by user_id range |
| Extension sync | Direct Supabase calls, no caching needed | Cache profiles in chrome.storage.local, sync on profile change | Same + background sync with stale-while-revalidate |
| Referral matching | Simple SQL queries | Add indexes on company, role_category | Consider a matching queue with scoring |
| Analytics aggregation | Real-time SQL queries fine | Pre-compute daily with pg_cron | Materialized views + read replica |
| Outreach emails | Resend free tier (100/day) | Resend Pro tier | Rate limiting + queue system |
| Credit ledger | Direct queries fine | Add index on user_id, created_at | Partition by month, compute running balances |

## Sources

- Chrome Extension architecture: Manifest V3 documentation (training data)
- Workday DOM structure patterns (training data, commonly documented in developer forums)
- Supabase RPC/Realtime: Known from existing codebase patterns
- Credit ledger pattern: Standard event-sourcing/append-only-log pattern
