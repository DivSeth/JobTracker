# Phase 03 — UI/UX Overhaul: Design Spec
_Written: 2026-04-26 | Approved by user before implementation_

---

## 1. Scope & Goal

Full visual overhaul of the AutoApply OS web app. Every page gets redesigned. The extension popup and fill panel are deferred to a separate spec (Phase 03b).

**Success criteria:**
1. Every page shares the Cognitive Workspace design system — consistent tokens, typography, spacing
2. The product looks and feels like a polished startup tool, not scaffolding
3. System preference drives dark/light mode; user can override via sidebar toggle
4. Motion is present throughout but never obstructs interaction

---

## 2. Aesthetic Direction

**Reference:** Linear (sharpness, dark surfaces, tight spacing) + Stripe (breathing room, clean hierarchy, trustworthy).

**In practice:**
- Dark backgrounds with layered surface elevation (`surface` < `surface-container` < `surface-card`)
- Generous whitespace within cards; tight spacing between them
- One accent color (`--primary`) used sparingly — active states, CTAs, key numbers
- No gradients on content; gradient only on logo mark and primary CTA button
- Borders: 1px at 8% opacity (`--border-subtle`), not full `outline-variant` everywhere

---

## 3. Design System Foundation

### 3.1 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display heading | Geist | 700 | 36px / 30px |
| Section heading | Geist | 600 | 24px / 20px |
| UI label | Inter | 500 | 14px |
| Body / form | Inter | 400 | 14px |
| Caption / muted | Inter | 400 | 12px |

Loaded via `next/font` — zero layout shift, no external request.

### 3.2 Token Additions (globals.css)

Existing palette is kept unchanged. New tokens added:

```css
--radius-card: 14px;
--border-subtle: rgba(42, 52, 57, 0.08);   /* light */
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
```

Dark mode equivalents:
```css
--border-subtle: rgba(255, 255, 255, 0.07);
--shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
```

`--font-display: 'Geist'` and `--font-body: 'Inter'` resolve via layout.tsx font injection.

### 3.3 Base Components (via 21st.dev Magic MCP)

Each component is generated via 21st.dev with a tight prompt matching the design direction, then lightly adjusted to use existing tokens. Components:

| Component | Notes |
|-----------|-------|
| `Button` | Primary (gradient), secondary (outline), ghost. Height 36px, radius 10px |
| `Input` | 36px height, subtle border, focus ring using `--primary` at 30% opacity |
| `Select` | Matches Input height, same focus treatment |
| `Badge` | Pill shape, status variants: default / success / warning / error / muted |
| `Card` | `bg-surface-card`, `--radius-card`, `--shadow-card`, `--border-subtle` |
| `Avatar` | Circular, initials fallback, size variants: sm/md/lg |
| `Separator` | 1px, `--border-subtle` color |
| `StatCard` | Animated counter, label, optional delta indicator |

### 3.4 Sidebar Overhaul

- Width: `w-48` (192px), down from `w-52`
- Logo: Geist Bold wordmark — `Auto` (on-surface) + `Apply` (primary)
- Nav items: same icons, tighter padding, active = `bg-surface-card` + left pill via `layoutId` Framer Motion shared layout animation
- Bottom: user `Avatar` chip (initials + email truncated), theme toggle, sign out
- No "New Application" CTA button in sidebar — moved to dashboard header

---

## 4. Page Layouts

### 4.1 Dashboard (`/`)

**Layout:** Full-width header + body with two columns (2:1 ratio)

**Header:** "Good morning, {first_name}" in Geist 30px + subtext with today's date. Right side of header: primary "New Application" button (gradient, 36px).

**Stat row (4 cards):**
- Total Applications
- Fills This Week
- Fill Success Rate
- Extension Status (connected / disconnected badge)

All four use `StatCard` with animated counter on mount (spring, 800ms).

**Left column (2/3):** Recent Applications feed — scrollable list of application cards. Each card: company favicon + name, role title, status `Badge`, time-ago label, chevron to detail. Stagger-in on mount (40ms delay per item).

**Right column (1/3):**
- Profile Readiness widget — circular progress or bar showing % of identity fields filled, CTA to `/profile` if incomplete
- Extension connection status — pill with dot indicator, "Sync now" button

---

### 4.2 Profile (`/profile`)

**Layout:** Single column, max-width 720px, centered

**Structure (top to bottom):**
1. **Readiness banner** — green (complete) or amber (incomplete), lists what's missing
2. **Base Identity card** — `Card` component, fields in a 2-column grid. Sections: Personal (name, preferred, pronouns), Online Presence (LinkedIn, GitHub, Portfolio), Logistics (DOB, relocate, arrangement, start date, referral)
3. **Regional Identities section** — heading row with "+ Add region" button. One `Card` per region, collapsible. Fields grouped: Contact, Address, Work Auth, Compensation

No wall of inputs. Each group has a subtle `label-sm` section label above it.

---

### 4.3 Application Profiles (`/profiles`)

**Layout:** Page header + responsive card grid (2-col laptop, 3-col wide)

Each profile card:
- Profile name (Geist medium)
- Resume status pill (Uploaded / Missing)
- Default badge (if `is_default`)
- Last updated timestamp
- Action row: Edit · Duplicate · Delete (ghost buttons, visible on hover)

Final card in grid: dashed border ghost card with `+` icon — "New Profile"

---

### 4.4 Applications (`/applications`)

**Layout:** Kanban board — horizontal scroll on smaller screens

**Columns:** Applied → Screening → Interview → Offer → Rejected

Each column:
- Column header with count badge
- Scrollable card stack
- Drop zone highlights on drag-over

Each application card:
- Company name + role (truncated)
- Date applied
- Source badge (Extension / Manual)
- Drag handle (subtle, appears on hover)

Drag powered by Framer Motion `drag` + `dragConstraints`.

---

### 4.5 Jobs (`/jobs`), Insights (`/insights`), Calendar (`/calendar`)

Layout polish only — consistent page headers (`text-2xl Geist` + subtitle), card wrappers around existing content, spacing normalization. No structural changes.

---

### 4.6 Login (`/login`)

**Layout:** Full-screen split — left 60% / right 40%

**Left panel (dark surface):**
- AutoApply wordmark top-left
- Headline: "Apply once. Apply everywhere." in Geist 48px
- 3-line value prop list with check icons
- Subtle animated fill demo mockup (static screenshot of fill panel, gentle float animation)

**Right panel (surface-card):**
- "Sign in to AutoApply" heading
- Google OAuth button (full-width, 44px, icon + label)
- Legal footnote

---

## 5. Motion Strategy

Library: **Framer Motion** (docs via Motion AI Kit MCP — no hallucinated APIs)

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transition | `opacity` 0→1 + `y` 8→0 | 200ms ease-out |
| Stat counters | Spring from 0 to value | 800ms spring |
| Card hover | `scale` 1→1.01 + shadow lift | 150ms ease-out |
| Staggered lists | Each item: fade-up, 40ms stagger | 180ms per item |
| Sidebar active pill | `layoutId` shared layout | 200ms spring |
| Form save feedback | Spring in, auto-fade after 2s | 200ms / 1500ms |
| Kanban drag | Framer `drag` + drop highlight | Real-time |

**Rule:** Motion only on containers and feedback elements. Never on inputs, selects, or text the user is actively reading.

---

## 6. Tool Integration Plan

| Tool | Used for | When |
|------|----------|------|
| `frontend-design` skill | Aesthetic decisions when designs leave gaps | Throughout |
| `21st.dev Magic MCP` | Generate base components, isolated UI elements | Foundation phase |
| `Stitch MCP` | Read user's Stitch designs (layouts) | After user sketches pages |
| `Figma MCP` | Consume Stitch→Figma exports, implement page layouts | Per page, after Stitch |
| `Motion AI Kit MCP` | Framer Motion API docs | Motion phase |
| `Vercel MCP` | Deploy previews for visual review | Per milestone |

**Execution order:**
1. Foundation (tokens, fonts, base components, sidebar) — me, using 21st.dev + frontend-design
2. User sketches dashboard + profile + profiles in Stitch → exports to Figma
3. I consume Figma frames via Figma MCP → implement those 3 pages
4. Remaining pages (applications kanban, login, polish pages) — me, using 21st.dev
5. Motion pass — Framer Motion across all pages using Motion AI Kit MCP
6. Vercel deploy preview → visual review → final adjustments

---

## 7. Out of Scope (this spec)

- Extension popup and fill panel (Phase 03b, separate spec)
- New pages or features — layout polish only for Jobs/Insights/Calendar
- Mobile breakpoints below 1024px
- Animation for the extension fill panel
