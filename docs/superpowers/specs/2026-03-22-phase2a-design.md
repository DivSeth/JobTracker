# AutoApply OS — Phase 2A: UI/UX Overhaul, Profile Redesign & Job Sync

**Date:** 2026-03-22
**Status:** Approved
**Author:** Divyaansh Seth

---

## 1. Goal

Deliver a premium, production-quality UI matching the "Digital Curator" design system from the Stitch mockups, a full Workday-style profile, an application detail view, and automated job sync with two new Summer 2026 repos.

---

## 2. Scope

### In scope
- Design system: new CSS tokens (full replacement of shadcn defaults), Tailwind config, rebuilt shadcn primitives
- Navigation shell: 6-item sidebar (Dashboard, Jobs, Applications, Calendar, Insights, Profile)
- Dashboard: pipeline Kanban hero + stats bar (replaces funnel widget, server-component fetch pattern preserved)
- Jobs: card grid with salary/location/featured badges + Curator's Pick highlight
- Applications: existing Kanban preserved with updated styles; new detail page (`/applications/[id]`)
- Profile: full Workday-style (personal details, work experience, education, skills, preferences)
- Calendar page: stub
- Insights page: stub
- Job sync: add 2 new Summer 2026 repos, Vercel cron every 6 hours
- Type updates: `ExperienceEntry` extended, new `ProfileDetails` interface
- DB migration: new `profile_details` JSONB column on `profiles` table
- Tests: component tests updated to match rebuilt components

### Out of scope
- Gmail live parsing (Phase 2B)
- AI job scoring (Phase 3)
- Drag-and-drop Kanban
- Auto-apply / browser extension
- Deadline write path / Add Reminder (stubbed, Phase 2B)

---

## 3. Design System — "Digital Curator"

### CSS Token Strategy
**Full replacement:** The existing shadcn oklch token set in `globals.css` is retired and replaced with the Digital Curator tokens below. The Tailwind config is updated to map utility classes to the new CSS variables. All rebuilt components use the new tokens. This is a clean cut — no aliasing, no co-existence.

### Color Tokens
| CSS Variable | Value | Tailwind class | Usage |
|---|---|---|---|
| `--surface` | `#f7f9fb` | `bg-surface` | Page background |
| `--surface-container` | `#e8eff3` | `bg-surface-container` | Sidebar, section backgrounds |
| `--surface-card` | `#ffffff` | `bg-surface-card` | Cards, inputs |
| `--surface-container-highest` | `#c9d8e0` | `bg-surface-container-highest` | Selected nav state |
| `--primary` | `#0053db` | `bg-primary` | CTA gradient start, links |
| `--primary-dim` | `#0048c1` | `bg-primary-dim` | CTA gradient end |
| `--on-surface` | `#2a3439` | `text-on-surface` | All body text ("black") |
| `--on-surface-muted` | `#6b7f88` | `text-on-surface-muted` | Secondary / metadata text |
| `--outline-variant` | `#c4d0d7` | `border-outline-variant` | Ghost borders (15% opacity max) |

### Rules
- **No-Line Rule:** Zero 1px solid borders for layout separation. Use background color shifts only.
- **Ghost Border Fallback:** `outline-variant` at 15% opacity only when accessibility strictly requires it.
- **Rounded corners:** `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for modals/dropdowns.
- **Shadows:** Ambient only — `0 12px 40px rgba(42,52,57,0.06)`. No heavy drop shadows.
- **Glassmorphism:** Floating elements use `surface-card` at 80% opacity + `backdrop-blur-xl`.
- **Primary CTA:** Linear gradient `#0053db → #0048c1` at 135°.
- **No pure black:** All text uses `--on-surface` (#2a3439).

### Typography (Inter — already installed)
| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 3.5rem | Regular | Empty states only, tracking -0.02em |
| Headline | 1.5rem | Medium | Section titles |
| Body | 0.875rem | Regular | All data |
| Label | 0.6875rem | Medium | Uppercase, 0.05em tracking — status tags |

### Component Patterns
- **Buttons:** Primary = 135° gradient; Secondary = `surface-container` bg, no border; Tertiary = ghost
- **Cards:** `surface-card` on `surface-container`; hover shifts bg slightly darker
- **Inputs:** `surface-card` bg, label 0.5rem above, focus = 2px `primary` glow at 20% opacity
- **Kanban tile:** `surface-card` + 4px left-accent bar in status color
- **Status tags:** uppercase label-sm, colored bg at 15% opacity
- **Timeline rail:** vertical `outline-variant` line at 20% opacity with tinted dots

---

## 4. Navigation Shell

**Sidebar** (`w-52`, `surface-container` background, no visible border):
- Logo + "Job OS" wordmark top-left
- Nav items: Dashboard / Jobs / Applications / Calendar / Insights / Profile
- Selected state: `surface-container-highest` background pill
- User avatar (initials fallback) + name bottom-left
- "New Application" primary CTA button at bottom

---

## 5. Pages

### 5.1 Dashboard (`/`)

**Architecture:** Server component (`page.tsx`) — preserves existing pattern of direct Supabase queries, passes data as props to client component children. No change to fetch strategy.

**Hero:** `PipelineKanban` client component (replaces `DashboardView`/`ApplicationFunnel`)
- Columns: Applied → OA → Interview → Offer → Rejected
- Each column: count badge + scrollable card list
- Cards: company name, job title, status tag (uppercase label-sm), days-ago
- Cards use 4px left-accent bar colored by status

**Stats bar** (top-right of hero): OA Rate % + total application count — computed server-side from applications array

**Data:** `page.tsx` fetches applications directly via Supabase client (existing pattern)

### 5.2 Jobs (`/jobs`)

**Architecture:** Existing server component pattern preserved

**Layout:** Responsive card grid (3 columns desktop, 2 tablet, 1 mobile)

**Job card (rebuilt):** company name, title, location, job type badge, posted date, Apply button (gradient CTA). Salary range shown if `null` values are not present (currently not in schema — omit for now).

**Curator's Pick:** Highlighted card in first slot — the first element of the existing `GET /api/jobs` response (already ordered `first_seen_at DESC`). No separate query needed — derive client-side from the response array. AI scoring in Phase 3 will replace this logic.

**Filters:** All / New Grad / Internship / Fulltime tabs (existing logic unchanged)

### 5.3 Applications (`/applications` + `/applications/[id]`)

**Kanban:** Existing columns and status transitions preserved; styles updated to Digital Curator system.

**New: Application Detail page** (`/applications/[id]`):
- Header: job title, company name, status badge, "Edit Details" + "Update Status" buttons
- **Status Timeline (Phase 2A scope):** Shows current status + `applied_at` date only. Full history (all transitions) is deferred to Phase 2B when an `application_events` table will be added. Display as a single-item timeline rail with the submission date.
- **Deadlines & Reminders:** Read-only panel for Phase 2A. "+ Add Reminder" button renders as disabled with tooltip "Coming soon". No write path implemented.
- **Interview Notes:** Free-text textarea, saved to `applications.notes` via `PATCH /api/applications`
- **Communications:** Static placeholder — "Connect Gmail to see emails" message. Phase 2B feature.

**New API:** `GET /api/applications/[id]`
- Returns single application row joined with job data (`jobs.*`)
- Response shape:
```typescript
{
  application: Application,
  job: Job | null
}
```
- RLS enforced — query uses `.eq('user_id', user.id)`. Returns 404 for both "not found" and "belongs to another user" (no distinction — security by obscurity). Matches existing PATCH pattern.

### 5.4 Profile (`/profile`)

**Architecture:** Server component fetches profile, renders `ProfileForm` client component with initial data. Same pattern as current implementation.

**Layout:** Two-column — left panel (160px fixed) + right scrollable sections

**Left panel:**
- Avatar circle with initials fallback
- Full name + role (from first experience entry or empty)
- Profile completeness % (fields filled / total fields × 100)
- Resume URL + Portfolio URL as clickable links (editable inline)

**Right sections (stacked, not accordion):**
1. **Personal Details** — full name, email (read-only, from auth), phone, location, short bio
2. **Work Experience** — list of `ExperienceEntry` items; each: company, role, employment type, start, end (or "Present"), bullet points; "+ Add Position" appends empty entry
3. **Education** — list of `EducationEntry` items: school, degree, major, GPA, graduation year; "+ Add" appends empty entry
4. **Skills** — tag chip input (type + Enter or comma to add, × to remove)
5. **Preferences** — job types (checkbox group), locations (tag input), remote_ok toggle, min salary (number input)

**Save:** Single "Save Profile" button at bottom — upserts entire profile to `/api/profile`

### 5.5 Calendar (`/calendar`) — Stub
Empty state: calendar icon (large, muted) + headline "Calendar coming soon" + body "Connect Gmail in Phase 2B to auto-extract interview schedules and deadlines."

### 5.6 Insights (`/insights`) — Stub
Empty state: chart icon (large, muted) + headline "Insights unlock at 5 applications" + body "Keep applying — your response rate, OA conversion, and offer trends appear here."

---

## 6. Type Changes (`lib/types.ts`)

### Extended `ExperienceEntry`
```typescript
export interface ExperienceEntry {
  company: string
  role: string
  employment_type: 'full_time' | 'internship' | 'part_time' | 'contract'  // NEW
  start: string
  end: string | null
  bullets: string[]
}
```

### New `ProfileDetails` interface
```typescript
export interface ProfileDetails {
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  resume_url: string | null
  portfolio_url: string | null
}
```

### Extended `Profile`
```typescript
export interface Profile {
  id: string
  user_id: string
  details: ProfileDetails        // NEW — stored in profile_details JSONB column
  skills: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  preferences: UserPreferences   // unchanged
}
```

---

## 7. Database Migration

New migration `20260322000001_profile_details.sql`:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_details JSONB DEFAULT '{}';
```

`UserPreferences` JSONB column remains strictly for job search prefs (`job_types`, `locations`, `remote_ok`, `min_salary`). Personal details go in the new `profile_details` column. No existing data is affected.

Also add new job sources:
```sql
INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/Summer2026-Internships', 'SimplifyJobs/Summer2026-Internships', 'internship', true),
  ('https://github.com/vanshb03/Summer2026-Internships', 'vanshb03/Summer2026-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
```

---

## 8. Job Sync — Vercel Cron

### New repos
Added via migration above.

### Vercel cron config (`vercel.json`)
```json
{
  "crons": [{
    "path": "/api/jobs/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

### Auth update (`/api/jobs/sync` route)
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` env var is set. Update the route to accept either bearer token:

```typescript
const authHeader = request.headers.get('authorization')
const token = authHeader?.replace('Bearer ', '')
const isValid =
  token === process.env.SUPABASE_SERVICE_ROLE_KEY ||
  token === process.env.CRON_SECRET
if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

Add `CRON_SECRET` to Vercel environment variables (any strong random string).

---

## 9. New Files

```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   ├── applications/[id]/page.tsx     # Application detail (new)
│   │   ├── calendar/page.tsx              # Stub (new)
│   │   └── insights/page.tsx             # Stub (new)
│   └── api/
│       └── applications/[id]/route.ts    # GET single application (new)
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                   # Extracted sidebar (new)
│   ├── dashboard/
│   │   ├── PipelineKanban.tsx            # Replaces ApplicationFunnel + DashboardView
│   │   └── StatsBar.tsx                  # New
│   ├── jobs/
│   │   └── JobCard.tsx                   # Rebuild as grid card
│   ├── applications/
│   │   └── ApplicationDetail.tsx         # New detail view client component
│   └── profile/
│       └── ProfileForm.tsx               # Full rebuild
└── lib/
    └── types.ts                          # Extended (ExperienceEntry, ProfileDetails, Profile)
```

---

## 10. Testing

- **Updated tests:** `ApplicationFunnel.test.tsx` → rewritten as `PipelineKanban.test.tsx`. `JobCard.test.tsx` updated for grid variant. `ProfileForm.test.tsx` updated for new sections.
- **New tests:** `ApplicationDetail.test.tsx` (renders timeline + notes textarea), `GET /api/applications/[id]` route test
- **Unchanged:** All 8 non-component tests (types, vault, github/sync, auth callback, jobs list) must continue passing without modification
