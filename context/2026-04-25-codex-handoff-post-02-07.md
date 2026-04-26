# Codex Handoff — Post Phase 02-07 (Basic Identity)
_Written: 2026-04-25 | Branch: `phase/02-07-basic-identity`_

---

## 1. What You're Inheriting

AutoApply OS is an AI-powered job application platform for college students. Core value: one Chrome extension that auto-fills ATS forms (Greenhouse, Workday) from a user-built profile — eliminating the repetitive manual labor of typing the same information hundreds of times.

The product has been actively developed through Claude Code. Phase 02-07 (Basic Identity) just completed all automated work. You're picking up at the live smoke test and everything after.

**Stack:** Next.js 14 + Supabase + Tailwind + shadcn (web). WXT + Chrome MV3 + React (extension). Vitest (unit), Playwright (E2E). TypeScript strict throughout.

**Monorepo layout:**
```
autoapply/
  apps/web/          # Next.js 14 web app
  apps/extension/    # Chrome MV3 extension (WXT)
  supabase/          # Migrations, seeds
```

---

## 2. Current State of the Codebase

### Branch: `phase/02-07-basic-identity`

**Phase 02-07 is fully implemented and tested.** All 101 extension unit tests pass. Both Playwright E2E tests pass (original fill + new identity coverage). One manual step remains: live smoke test against the Discord Greenhouse posting (Task 17).

### What 02-07 built

**Schema** (`autoapply/supabase/migrations/20260422000000_basic_identity.sql`):
- `profiles` table extended with 12 base-identity columns: `first_name`, `last_name`, `preferred_first_name`, `pronouns`, `linkedin_url`, `github_url`, `portfolio_url`, `date_of_birth`, `willing_to_relocate`, `work_arrangement_preference`, `earliest_start_date`, `referral_source`
- New `user_regional_identities` table: email, phone_e164, full address, work-auth booleans (`authorized_to_work`, `needs_sponsorship_now`, `needs_sponsorship_future`, `work_auth_status`), salary fields, `notice_period_weeks` — with RLS, single-default trigger, updated_at trigger

**Web API** (all under `autoapply/apps/web/app/api/`):
- `GET/PATCH /api/profile` — base identity read/write
- `POST /api/profile/regional-identities` — create regional block
- `PATCH/DELETE /api/profile/regional-identities/[id]` — update/delete
- `GET /api/extension/profile` — extension-facing mirror, bypasses auth redirect

**Web UI** (`autoapply/apps/web/components/profile/`):
- `BaseIdentityForm.tsx` — auto-save on blur, 12 fields
- `RegionalIdentityForm.tsx` — per-region form, auto-patch on blur, delete button
- `RegionalIdentityCard.tsx` — display wrapper
- `RegionalIdentityList.tsx` — card list + "+ Add region" button
- `CountryCodeChipInput.tsx` — chip select for ISO-3166-2 codes
- `/profile` page: readiness banner + BaseIdentityForm + RegionalIdentityList + ProfileForm (trimmed)
- Middleware: `/` → `/profile` redirect if `first_name IS NULL`

**Extension** (`autoapply/apps/extension/`):
- `utils/identity.ts` — `StoredBaseIdentity`, `StoredRegionalIdentity`, `MergedIdentity` interfaces + `mergeActiveIdentity()` + API conversion helpers
- `utils/storage.ts` — `getBaseIdentity/setBaseIdentity`, `getRegionalIdentities/setRegionalIdentities`
- `background.ts` — `syncProfiles()` calls `GET /api/extension/profile`, writes `baseIdentity` and `regionalIdentities` to chrome.storage, clears legacy `userIdentity`
- `lib/greenhouse/country-detector.ts` — `detectJobCountry(doc)`: combobox → location text → JSON-LD
- `lib/greenhouse/regional-selection.ts` — pure `selectRegionalIdentity()`: none/single/country-match/ambiguous/default/chosen
- `greenhouse.content/index.tsx` — `PickerPanel` UI; takes new path when `base?.firstName` is set; merges base + chosen regional for mapper
- `lib/greenhouse/mapper.ts` — 37 rules, `first_name_or_split`/`last_name_or_split`/`yes_no` transforms, fixed sponsorship rule ordering, fixed `\bunit\b` pattern
- `lib/form-fill/events.ts` — fixed empty-option bug in `fillSelectField`

### Tests (all green)
- 101 unit tests passing (`npx vitest run` from `apps/extension/`)
- 2 Playwright E2E passing (`npx playwright test` from `apps/web/`)
- Web unit tests: run from `apps/web/` with `npx vitest run`

---

## 3. Immediate Next Step: Task 17 Live Smoke Test

**This is a MANUAL step. You cannot automate it from code. The user must run it.**

### Instructions for the user:
1. Build extension: `cd autoapply/apps/extension && npx wxt build`
2. Load unpacked extension from `autoapply/apps/extension/.output/chrome-mv3` in Chrome
3. In extension service-worker console: `await chrome.storage.local.clear()`
4. Sign in via extension popup → OAuth → lands on `/profile`
5. Fill base identity: first_name, last_name, linkedin_url, github_url
6. Add one region block: label="US student", country_codes=['US'], email=your@email.edu, phone_e164=+1XXXXXXXXXX, country=US, authorized_to_work=Yes, needs_sponsorship_future=Yes
7. Visit `https://job-boards.greenhouse.io/discord/jobs/8475182002`
8. Click extension Fill → Confirm Fill
9. **Expected:** email, first_name, last_name, phone, country combobox, authorized-to-work field, needs-sponsorship-future field all fill. Previously (02-06) only email filled.

If the smoke test passes:
- Update `.planning/phases/02-07-basic-identity/02-07-SUMMARY.md`: set `status: complete`, `completed: <date>`, fill Live Smoke Test Result
- Merge `phase/02-07-basic-identity` → `main`

---

## 4. Open Blocker: SEC-01

**Do NOT merge to main or ship to real users until SEC-01 is fixed.**

See `.planning/SECURITY-FINDINGS.md` for full details.

**Root cause:** Extension sign-in puts `access_token` and `refresh_token` in the URL query string:
```
/login?access_token=...&refresh_token=...
```
This leaks long-lived credentials into browser history, server logs, Referer headers, and screenshots.

**File:** `autoapply/apps/web/app/api/auth/callback/route.ts:38-44`

**Fix direction:** Replace the query-string relay with a one-time exchange code. Extension requests a short-TTL single-use code from a dedicated endpoint, then exchanges it for tokens in a POST body over TLS. Tokens never touch a URL.

This is Phase 03 work. You may choose to implement it next if the smoke test passes and the user is ready to ship.

---

## 5. Product Vision & Next Phases

The user's north star: **minimize per-application user input — ask once at onboarding, never per application.** Phase 02-07 completes the identity foundation for this.

### Phase 03: Security Hardening (SEC-01)
Must ship before real users. One focused task: replace the query-string token relay with a one-time exchange code flow.

### Phase 03 (parallel): UI/UX Overhaul
The product works but doesn't look startup quality. Planned scope:
- Web app profile pages and dashboard to startup visual standards
- Extension popup and PreviewPanel to match web design system
- Cohesive Cognitive Workspace design language (tokens like `bg-surface`, `text-primary` are already in place)
- Responsive 1024–1920px

### Phase 04: Workday Auto-Fill
This is the high-value, high-complexity item. Workday covers ~40% of target applications.
- Multi-page wizard navigation
- `data-automation-id` selectors (not CSS classes — these are stable)
- Dynamic dropdowns (need to trigger open → wait for options → pick)
- File upload via DataTransfer API
- Bot detection awareness (typing delays, focus/blur)
- Graceful degradation when expected fields missing

### Phase 05: Q&A Intelligence
Once the fill loop is solid across Greenhouse + Workday, the compounding moat is the Q&A bank:
- Extension pauses on unknown screening questions, prompts user to answer
- Answers saved with question fingerprints
- Future applications fuzzy-match against the bank
- "AI-generate" mode: Gemini drafts answers from profile + job description context

### Phase 06: Analytics, Cover Letters & Monetization
- Application funnel analytics (response rate, time-to-response, per-profile stats)
- AI cover letter generation (profile + JD → cover letter → editable → saved to profile)
- Freemium/Pro tiers via Stripe (free: rule-based, capped fills; pro: AI scoring, unlimited, cover letters)

---

## 6. Architecture Decisions to Know

**Identity split:** `profiles` (base, one per user) + `user_regional_identities` (N per user). Base = stable fields (name, LinkedIn, etc.). Regional = per-country variants (email, work-auth, salary). Merged at fill time by `mergeActiveIdentity(base, regional)` in `utils/identity.ts`.

**Mapper pattern:** `DEFAULT_RULES` array in `mapper.ts` — first-match wins. Pattern is a regex tested against field name AND label (case-insensitive). Order matters — more specific rules come before broader ones (sponsorship-future before sponsorship-now; `\bunit\b` instead of bare `unit`).

**Extension fill flow:**
1. Background syncs base+regional to chrome.storage on alarm
2. `FILL_STARTED` message triggers content script
3. Content script fetches: applicationProfile (from storage), base+regional (from storage), field mappings (API), duplicate check (API)
4. `selectRegionalIdentity` picks the right regional block (single auto-pick / country-match / picker UI)
5. `mergeActiveIdentity` → `mapProfileToFields` → `PreviewPanel` renders
6. User confirms → `fillForm` fills DOM fields

**Test approach:** Direct chrome.storage seeding in Playwright (bypasses sync). For unit tests, vitest with `// @vitest-environment jsdom` per-file override for browser API tests.

---

## 7. Files You'll Touch Most

When extending the fill loop:
- `autoapply/apps/extension/lib/greenhouse/mapper.ts` — add/edit rules
- `autoapply/apps/extension/lib/greenhouse/mapper.test.ts` — tests
- `autoapply/apps/extension/lib/form-fill/events.ts` — DOM interaction primitives

When fixing SEC-01:
- `autoapply/apps/web/app/api/auth/callback/route.ts` — the redirect that leaks tokens
- Probably: new route `autoapply/apps/web/app/api/auth/exchange/route.ts`
- `autoapply/apps/extension/entrypoints/background.ts` — the listener that receives auth

When working on Workday:
- New: `autoapply/apps/extension/lib/workday/` directory
- Existing: `autoapply/apps/extension/entrypoints/workday.content/` (stub)
- `autoapply/apps/web/app/api/extension/` — may need Workday-specific endpoints

---

## 8. Running the Project Locally

```bash
# Prerequisites: Node 20, Supabase CLI, Chrome

# Start local Supabase
cd autoapply && npx supabase start

# Start web app
cd autoapply/apps/web && npm run dev

# Run extension unit tests
cd autoapply/apps/extension && npx vitest run

# Run web unit tests
cd autoapply/apps/web && npx vitest run

# Build extension
cd autoapply/apps/extension && npx wxt build

# Run E2E (requires extension build)
cd autoapply/apps/web && npx playwright test
```

---

## 9. What Codex Should NOT Do

- Do not push to `main` without user confirmation
- Do not merge `phase/02-07-basic-identity` until Task 17 (live smoke test) passes and user confirms
- Do not skip SEC-01 — it is a hard blocker for shipping to real users
- Do not use GSD commands (`/gsd:*`) — they are uninstalled
- Do not create `.planning/phases/*/` work-tracking files for new tasks — use inline todos
- For new mapper rules, always add a test in `mapper.test.ts` (table-driven is fine)
- Do not touch `autoapply/supabase/migrations/` without understanding the migration order

---

## 10. Suggested Immediate Actions for Codex

1. **Verify task 17 status** — ask the user if they've run the live smoke test yet
2. **Fix SEC-01** (`app/api/auth/callback/route.ts`) — replace query-string token relay with exchange code pattern
3. **Merge 02-07 to main** — after smoke test + SEC-01
4. **Plan Phase 03 UI/UX** — run `superpowers:brainstorming` on the UI overhaul scope before writing any code
5. **Plan Phase 04 Workday** — research Workday `data-automation-id` patterns against live postings before writing any scanner code

---

_This context file describes the project state as of 2026-04-25, immediately after phase 02-07 implementation. The live smoke test (Task 17) and SEC-01 fix are the two gates before anything merges to main._
