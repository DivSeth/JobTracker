# Technology Stack

**Project:** AutoApply OS - Phase 4+ (Browser Extension, Referral Marketplace, Outreach, Interview Prep, Analytics)
**Researched:** 2026-03-25
**Confidence caveat:** Web search and doc verification tools were unavailable during this research session. Versions are based on training data (cutoff May 2025) and should be verified with `npm view <pkg> version` before installation. Confidence levels reflect this limitation.

## Existing Stack (Confirmed from package.json)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.35 | Web app framework |
| React | ^18 | UI |
| TypeScript | ^5 | Language |
| Supabase JS | ^2.99.3 | Database + Auth |
| Tailwind CSS | ^3.4.1 | Styling |
| shadcn | ^4.1.0 | Component library |
| Vitest | ^4.1.0 | Unit tests |
| Playwright | ^1.58.2 | E2E tests |
| Monorepo | npm workspaces | `apps/web` exists, ready for `apps/extension` |

## Recommended New Stack

### Browser Extension Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| WXT | ^0.19.x | Extension framework | MEDIUM |  |

**Why WXT over alternatives:**
- **WXT** is the modern successor to raw Manifest V3 boilerplate. It provides file-based routing for content scripts, background workers, and popups -- similar to how Next.js structures pages. It uses Vite under the hood, supports TypeScript natively, and has hot-reload for content scripts during development.
- **Not Plasmo** -- Plasmo is the other major option but is more opinionated and has a heavier abstraction layer. It bundles its own React framework and state management, which conflicts with wanting to share code with the existing Next.js app. Plasmo also pushes toward their cloud deployment platform. WXT is framework-agnostic and leaner.
- **Not raw Manifest V3** -- Too much boilerplate for content script injection, message passing, and build configuration. WXT handles all of this declaratively.
- **Not CRXJS** -- `@crxjs/vite-plugin` was promising but development stalled in 2023-2024. Not actively maintained.

**Key WXT features needed:**
- Content script auto-injection with URL matching (for Workday/Greenhouse pages)
- Background service worker with alarm-based scheduling
- Popup UI with React support
- `chrome.storage` API integration for local profile caching
- Cross-origin messaging between content script and background worker

### Content Script DOM Manipulation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Native DOM APIs | N/A | ATS form interaction | Direct DOM access needed for complex Workday/Greenhouse forms | HIGH |
| MutationObserver | Native | Dynamic form detection | Workday renders forms dynamically; must observe DOM changes | HIGH |
| Zod | ^3.23.x | Form field validation | Validate scraped form structures before auto-fill | MEDIUM |

**Why NOT use a DOM abstraction library:**
- Workday and Greenhouse render forms with custom web components, shadow DOM elements, and React-managed state. jQuery or similar abstractions add weight without helping -- you need raw `querySelector`, `dispatchEvent`, and `MutationObserver` to reliably trigger React/Angular change handlers.
- The critical pattern: setting `input.value` is insufficient. You must dispatch `input`, `change`, and `blur` events to trigger the ATS framework's state management. This requires native DOM APIs.

### Extension-to-Web-App Communication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase JS (shared) | ^2.99.3 | Auth + data sync | Reuse existing auth; extension reads user profiles from Supabase | HIGH |
| chrome.storage.local | Native | Offline profile cache | Cache active profile locally so auto-fill works without network roundtrip | HIGH |
| chrome.runtime messaging | Native | Content-to-background IPC | Content scripts cannot directly call Supabase; messages relay through background worker | HIGH |

**Architecture decision:** The extension background service worker holds the Supabase client and auth session. Content scripts send messages to the background worker for any data operations. This avoids exposing Supabase credentials in content script scope and handles CORS cleanly.

### Referral Marketplace (Backend Additions)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (existing) | ^2.99.3 | Data layer | Referral profiles, credit ledger, match history -- all fit PostgreSQL + RLS | HIGH |
| Supabase Realtime | Included | Live notifications | Notify referrers of new requests; notify applicants of referral status changes | HIGH |
| Stripe | ^14.x or ^15.x | Payment processing (future Pro tier) | Industry standard for subscription billing; needed when credits become monetized | LOW (version unverified) |
| Resend | ^3.x or ^4.x | Transactional email | Referral match notifications, outreach delivery tracking | LOW (version unverified) |

**Why NOT build a separate referral microservice:**
- The existing Supabase PostgreSQL instance with RLS handles multi-tenant data isolation natively. A credit ledger is just a table with atomic increment/decrement via Supabase RPC functions. Adding a separate service would introduce deployment complexity for zero benefit at this scale.

### Recruiter Outreach Automation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Resend | ^3.x or ^4.x | Cold email sending | Deliverability-focused email API; better than raw SMTP or SendGrid for cold outreach | LOW (version unverified) |
| Gemini 2.0 Flash (existing) | Existing | Personalization AI | Generate personalized outreach messages from job posting + user profile | HIGH |
| Supabase pg_cron / Vercel Cron | Existing | Send scheduling | Drip campaigns need scheduled sends; Vercel cron (free tier: daily) or Supabase pg_cron | HIGH |

**Why Resend over SendGrid/Mailgun:**
- Resend was built for developer experience with a modern API. It has built-in React email template support (via `@react-email/components`), which means outreach templates can share the same component system as the web app. SendGrid's API is bloated and its free tier is more restrictive. Mailgun is fine but lacks the React integration.

**Why NOT LinkedIn automation:**
- LinkedIn aggressively detects and bans automated messaging. Any "automated LinkedIn DM" feature is a Terms of Service violation that will get users' accounts suspended. **Do not build this.** Instead, generate personalized message drafts that users copy-paste into LinkedIn manually. The AI writes the message; the human sends it.

### Interview Prep Pipeline

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Gemini 2.0 Flash (existing) | Existing | Question generation | Generate role-specific interview questions from job description + company research | HIGH |
| Supabase Storage | Included | Recording storage (future) | If mock interview recordings are added later | MEDIUM |
| @google/generative-ai | ^0.21.x | Gemini SDK | Already used in codebase for email classification | MEDIUM (version unverified) |

**Prep pipeline is primarily a data model + AI prompt problem, not a new stack problem.** The existing Gemini integration handles question generation. The main work is:
1. Triggering prep generation when Gmail detects an interview invite
2. Structuring prep content (behavioral, technical, company-specific)
3. Storing Q&A pairs in Supabase for review and practice

### Success Pattern Analytics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase PostgreSQL (existing) | Existing | Aggregate query engine | PostgreSQL's window functions and CTEs handle the analytics queries | HIGH |
| Supabase RPC functions | Existing | Aggregate computation | Anonymized aggregate queries via server-side functions (no raw data exposure) | HIGH |
| Recharts | ^2.12.x | Data visualization | Lightweight React charting; integrates with shadcn design system | MEDIUM (version unverified) |

**Why NOT a separate analytics database:**
- At the current scale (college students, thousands of applications), PostgreSQL handles analytics queries without breaking a sweat. Adding a data warehouse or OLAP system is premature. When/if B2B launches with millions of records, consider Supabase's pg_analytics extension or a read replica.

**Why Recharts over alternatives:**
- Recharts is the most common React charting library, built on D3 but with a React component API. It handles bar charts, line charts, and scatter plots -- the core visualizations for "which resume styles get callbacks." Lighter than Victory, more React-native than Chart.js.
- **Not Nivo** -- Nivo is beautiful but heavier and harder to customize to match an existing design system.
- **Not Tremor** -- Tremor is opinionated about its own design system, which would conflict with the Cognitive Workspace design.

### Shared Libraries (Monorepo Addition)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Shared `packages/` workspace | N/A | Code sharing | Types, Supabase client config, and Zod schemas shared between web and extension | HIGH |
| Zod | ^3.23.x | Schema validation | Validate form field mappings, API responses, profile data across both apps | MEDIUM (version unverified) |

**Monorepo structure recommendation:**
```
autoapply/
  apps/
    web/          (existing Next.js app)
    extension/    (new WXT browser extension)
  packages/
    shared/       (types, Supabase client, Zod schemas, constants)
```

The existing `npm workspaces` setup in `package.json` already supports this. Add `"packages/*"` to the workspaces array.

### Encryption & Privacy

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Vault (existing) | Existing | Token/secret storage | Already used for Gmail tokens; extend to PII encryption keys | HIGH |
| pgcrypto (Supabase built-in) | Existing | Field-level encryption | Encrypt sensitive profile fields (SSN for EEO, work authorization) at database level | HIGH |

**PII strategy:** Encrypt at-rest using pgcrypto for fields like EEO responses and work authorization status. Regular profile data (name, email, skills) does not need field-level encryption -- Supabase's disk encryption + RLS handles it. The extension should never persist PII in `chrome.storage` unencrypted; use the Web Crypto API for local caching if needed.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Extension framework | WXT | Plasmo | Heavier abstraction, vendor lock-in to Plasmo cloud, React-opinionated |
| Extension framework | WXT | Raw MV3 | Too much boilerplate, no hot reload, painful DX |
| Extension framework | WXT | CRXJS/Vite | Development stalled ~2023, not actively maintained |
| Email sending | Resend | SendGrid | Bloated API, worse DX, restrictive free tier |
| Email sending | Resend | AWS SES | Overkill setup for this scale, poor DX |
| Charts | Recharts | Tremor | Conflicts with existing design system |
| Charts | Recharts | Nivo | Heavier, harder to customize |
| LinkedIn outreach | Manual copy-paste | Automation | ToS violation, account ban risk. Generate message, user sends |
| Analytics DB | PostgreSQL (existing) | Separate OLAP | Premature at current scale |
| Referral backend | Supabase + RLS | Separate microservice | Unnecessary complexity for credit ledger |
| Payment | Stripe | Paddle/LemonSqueezy | Stripe has best API, largest ecosystem, most docs |

## What NOT to Add

| Technology | Why Avoid |
|------------|-----------|
| Redis/BullMQ | No background job queue needed -- Vercel cron + Supabase pg_cron cover scheduling. Adding Redis means adding infrastructure cost (violates zero-budget constraint). |
| Puppeteer/Playwright in extension | Cannot run headless browsers in a Chrome extension. Content scripts have direct DOM access -- use that instead. |
| GraphQL | The app uses REST API routes. Adding GraphQL for new features splits the API surface for no benefit. Keep REST. |
| React Native (yet) | Mobile app is in the roadmap but not in this milestone. Don't add RN dependencies prematurely. |
| LangChain | Overkill for the AI tasks here (message personalization, question generation). Direct Gemini API calls with structured prompts are simpler and more predictable. |
| Prisma | Supabase JS client is the established data access pattern. Adding an ORM creates two data access patterns. |
| Next.js 15 upgrade | Not needed for these features and would require migration effort. Stay on 14.2.35. |

## Installation Plan

```bash
# 1. Add shared packages workspace
# In autoapply/package.json, update workspaces:
# "workspaces": ["apps/*", "packages/*"]

# 2. Create shared package
mkdir -p packages/shared/src
cd packages/shared
npm init -y
# Add: zod, @supabase/supabase-js, shared types

# 3. Create extension workspace
cd apps
npx wxt@latest init extension --template react
cd extension
npm install @supabase/supabase-js zod
# WXT handles: manifest.json generation, Vite config, TypeScript

# 4. Web app additions (from apps/web)
npm install recharts resend
npm install -D @types/chrome  # For extension message type definitions

# 5. When monetization is ready (NOT now)
npm install stripe @stripe/stripe-js
```

## Version Verification Checklist

Before installing, verify these versions are current (training data may be stale):

| Package | Claimed Version | Verify Command | Priority |
|---------|----------------|----------------|----------|
| wxt | ^0.19.x | `npm view wxt version` | CRITICAL -- framework choice depends on maturity |
| zod | ^3.23.x | `npm view zod version` | Low risk -- stable API |
| recharts | ^2.12.x | `npm view recharts version` | Low risk |
| resend | ^3.x | `npm view resend version` | Medium -- API may have changed |
| stripe | ^14.x | `npm view stripe version` | Low priority -- not needed immediately |
| @google/generative-ai | ^0.21.x | `npm view @google/generative-ai version` | Check -- existing codebase may already pin a version |

## Sources

- Existing codebase: `autoapply/apps/web/package.json` (confirmed versions)
- Existing architecture: `.planning/codebase/ARCHITECTURE.md` (confirmed patterns)
- Chrome Extension Manifest V3: developer.chrome.com/docs/extensions (known from training data, not live-verified)
- WXT documentation: wxt.dev (known from training data, not live-verified)
- Resend documentation: resend.com/docs (known from training data, not live-verified)

**Honest assessment:** All "new addition" version numbers are from training data (cutoff May 2025) and carry LOW-MEDIUM confidence. Run `npm view <pkg> version` for each before locking versions. The architectural decisions (WXT, not Plasmo; Resend, not SendGrid; no LinkedIn automation; etc.) are HIGH confidence regardless of exact version numbers.
