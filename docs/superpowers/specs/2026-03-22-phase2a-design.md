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
- Design system: new tokens, Tailwind config, rebuilt shadcn primitives
- Navigation shell: 6-item sidebar (Dashboard, Jobs, Applications, Calendar, Insights, Profile)
- Dashboard: pipeline Kanban hero + stats bar (replaces funnel widget)
- Jobs: card grid with salary/location/featured badges + Curator's Pick highlight
- Applications: existing Kanban preserved, new detail page (`/applications/[id]`)
- Profile: full Workday-style (personal details, work experience, education, skills, preferences)
- Calendar page: stub (empty state with placeholder message)
- Insights page: stub (empty state with placeholder message)
- Job sync: add 2 new Summer 2026 repos, Vercel cron every 6 hours

### Out of scope
- Gmail live parsing (Phase 2B)
- AI job scoring (Phase 3)
- Drag-and-drop Kanban
- Auto-apply / browser extension

---

## 3. Design System — "Digital Curator"

### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `--surface` | `#f7f9fb` | Page background |
| `--surface-container` | `#e8eff3` | Sidebar, section backgrounds |
| `--surface-card` | `#ffffff` | Cards, inputs |
| `--primary` | `#0053db` | CTA gradient start |
| `--primary-dim` | `#0048c1` | CTA gradient end |
| `--on-surface` | `#2a3439` | All body text ("black") |
| `--on-surface-muted` | `#6b7f88` | Secondary / metadata text |
| `--outline-variant` | `#c4d0d7` | Ghost borders (15% opacity max) |

### Rules
- **No-Line Rule:** Zero 1px solid borders for layout. Separation via background color shifts only.
- **Ghost Border Fallback:** `outline-variant` at 15% opacity only when accessibility requires it.
- **Rounded corners:** `rounded-xl` (12px) cards, `rounded-2xl` (16px) modals/dropdowns.
- **Shadows:** Ambient only — `0 12px 40px rgba(42,52,57,0.06)`. No heavy drop shadows.
- **Glassmorphism:** Floating elements (modals, dropdowns) use `surface-card` at 80% opacity + `backdrop-blur-xl`.
- **Primary CTA:** Linear gradient `#0053db → #0048c1` at 135°.

### Typography (Inter)
| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 3.5rem | Regular | Empty states only, tracking -0.02em |
| Headline | 1.5rem | Medium | Section titles |
| Body | 0.875rem | Regular | All data |
| Label | 0.6875rem | Medium | Uppercase, 0.05em tracking — status tags |

### Component Patterns
- **Buttons:** Primary = gradient; Secondary = `surface-container` bg, no border; Tertiary = ghost
- **Cards:** `surface-card` on `surface-container` background for natural lift; hover shifts to `surface-container-high`
- **Inputs:** `surface-card` bg, label 0.5rem above field, focus = 2px `primary` glow at 20% opacity
- **Kanban tile:** `surface-card` + 4px left-accent bar in status color
- **Status tags:** uppercase label-sm, colored bg at 15% opacity
- **Timeline rail:** vertical `outline-variant` line at 20% opacity with tinted dots

---

## 4. Navigation Shell

**Sidebar** (`w-52`, `surface-container` background, no border):
- Logo + "Job OS" wordmark top-left
- Nav items: Dashboard / Jobs / Applications / Calendar / Insights / Profile
- Selected state: `surface-container-highest` background pill
- User avatar + name bottom-left
- "New Application" primary CTA button bottom

---

## 5. Pages

### 5.1 Dashboard (`/`)
**Hero:** Pipeline Kanban with columns: Applied → OA → Interview → Offer → Rejected
- Each column shows count badge
- Cards show company logo placeholder, job title, company name, status tag, days-ago label
- Cards use 4px left-accent bar colored by status

**Stats bar** (top right): OA Rate %, total application volume

**Data source:** `GET /api/applications` — client component, fetches on load

### 5.2 Jobs (`/jobs`)
**Layout:** Responsive card grid (3 columns desktop, 2 tablet, 1 mobile)

**Job card:** company logo placeholder, title, company, location, salary range (if available), job type badge, posted date, Apply button (gradient CTA)

**Curator's Pick:** First card slot on initial load shows a highlighted pick card (highest-scored job or most recent featured)

**Filters:** All / New Grad / Internship / Fulltime tabs (existing logic preserved)

**Data source:** `GET /api/jobs` (existing endpoint, no changes needed)

### 5.3 Applications (`/applications`)
**Kanban preserved** — existing columns and status transitions kept

**New: Application Detail page** (`/applications/[id]`):
- Header: company logo, job title, company name, status badge, Edit Details + Update Status buttons
- **Status Timeline** (left): vertical rail showing each status transition with date, label, and checkmark
- **Deadlines & Reminders** (right sidebar): upcoming deadline cards (red = urgent), "+ Add Reminder" button
- **Interview Notes** (right sidebar): free-text textarea, persisted to `applications.notes`
- **Communications** section: placeholder — shows "Connect Gmail to see emails" until Phase 2B

**New API:** `GET /api/applications/[id]` — returns single application with joined job data

### 5.4 Profile (`/profile`)
**Layout:** Two-column — left panel (avatar, score, quick links) + right panels (form sections)

**Left panel:**
- Avatar (initials fallback)
- Full name, current role/title
- Profile completeness score (% of fields filled)
- Quick links: resume URL, portfolio URL

**Right panels (accordion or stacked sections):**
1. **Personal Details** — full name, email, phone, location, short bio
2. **Work Experience** — list of entries, each: company, role, type (full-time/internship), start/end dates, bullet points; "+ Add Position" button
3. **Education** — list of entries: school, degree, major, GPA, graduation year; "+ Add" button
4. **Skills** — tag input (comma-separated, rendered as chips)
5. **Preferences** — job types (checkboxes), locations (tag input), remote_ok toggle, min salary

**Data:** All fields map to existing `profiles` table schema. No DB changes needed.

**Server action:** `POST /api/profile` upsert (existing endpoint, extend to handle all new fields)

### 5.5 Calendar (`/calendar`) — Stub
Empty state: display icon + "Calendar integration coming soon. Connect Gmail in Phase 2B to auto-extract deadlines and interview schedules."

### 5.6 Insights (`/insights`) — Stub
Empty state: display icon + "Insights arrive after you've tracked 5+ applications. Keep applying!"

---

## 6. Job Sync Updates

### New repos to add (migration)
```sql
INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/Summer2026-Internships', 'SimplifyJobs/Summer2026-Internships', 'internship', true),
  ('https://github.com/vanshb03/Summer2026-Internships', 'vanshb03/Summer2026-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
```

### Vercel Cron
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/jobs/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

The sync endpoint already validates via service role key. Vercel passes the `CRON_SECRET` header — add a check in `POST /api/jobs/sync` that accepts either `SUPABASE_SERVICE_ROLE_KEY` or Vercel's `CRON_SECRET`.

---

## 7. New Files

```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   ├── applications/
│   │   │   └── [id]/page.tsx           # Application detail page (new)
│   │   ├── calendar/page.tsx           # Stub (new)
│   │   └── insights/page.tsx           # Stub (new)
│   └── api/
│       └── applications/
│           └── [id]/route.ts           # GET single application (new)
└── components/
    ├── ui/                             # Rebuild: button, badge, input, card, tabs
    ├── layout/
    │   └── Sidebar.tsx                 # New sidebar component
    ├── dashboard/
    │   ├── PipelineKanban.tsx          # New (replaces ApplicationFunnel)
    │   └── StatsBar.tsx                # New
    ├── jobs/
    │   ├── JobCard.tsx                 # Rebuild as grid card
    │   └── CuratorsPick.tsx            # New highlight card
    ├── applications/
    │   ├── ApplicationKanban.tsx       # Update styles only
    │   └── ApplicationDetail.tsx       # New detail view
    └── profile/
        └── ProfileForm.tsx             # Full rebuild — all sections
```

---

## 8. Data Model Changes

No schema changes required. All new profile fields (`phone`, `bio`, resume/portfolio URLs) stored in existing `profiles.preferences` JSONB column as additional keys.

---

## 9. Testing

- Existing 36 unit tests must continue to pass
- Add component tests for: `PipelineKanban`, `JobCard` (grid variant), `ProfileForm` (section rendering)
- No E2E changes required for this phase
