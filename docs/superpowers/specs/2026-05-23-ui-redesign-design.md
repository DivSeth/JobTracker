# Design Spec: AutoApply OS UI Redesign (Phase 03)

**Date:** 2026-05-23  
**Branch:** phase/03-ui-overhaul  
**Approach:** Token system overhaul + page-by-page structural translation from Stitch HTML, preserving all existing API calls and business logic.  
**Source of truth:** Stitch MCP screens (8 screens read directly via MCP HTML export).

---

## 1. Token System Migration

### 1.1 Dark Mode Tokens (Default)

Applied via `:root` (dark is default — no `[data-theme=dark]` wrapper needed). Light mode overrides applied via `[data-theme=light]`.

```css
:root {
  /* Surfaces */
  --background:                #0f1419;
  --surface-abyss:             #0a0f14;
  --surface-container-lowest:  #0a0f14;
  --surface-container-low:     #171c21;
  --surface-container:         #1a2128;
  --surface-container-high:    #252a30;
  --surface-container-highest: #30353b;
  --surface-bright:            #353a3f;
  --surface-card:              #1e272e;
  --surface-variant:           #30353b;

  /* Primary */
  --primary:                   #a4c8ff;
  --primary-container:         #4d9fff;
  --primary-fixed:             #d4e3ff;
  --primary-fixed-dim:         #a4c8ff;
  --on-primary:                #00315d;
  --on-primary-container:      #003564;
  --inverse-primary:           #005fad;

  /* Electric Indigo (accent) */
  --electric-indigo:           #6366f1;
  --deep-violet:               #a855f7;

  /* Secondary */
  --secondary:                 #c0c1ff;
  --secondary-container:       #3131c0;
  --on-secondary:              #1000a9;
  --on-secondary-container:    #b0b2ff;

  /* Tertiary */
  --tertiary:                  #ddb7ff;
  --tertiary-container:        #c07fff;
  --on-tertiary:               #490080;

  /* Surface text */
  --on-surface:                #dee3ea;
  --on-surface-variant:        #c0c7d4;
  --outline:                   #8b919e;
  --outline-variant:           #414752;

  /* Semantic */
  --success-vibrant:           #22c55e;
  --error-vibrant:             #ef4444;
  --warning-vibrant:           #f59e0b;
  --error:                     #ffb4ab;

  /* Inverse */
  --inverse-surface:           #dee3ea;
  --inverse-on-surface:        #2c3136;

  /* Borders / glows */
  --border-glow:               rgba(99, 102, 241, 0.4);
  --border-whisper:            rgba(255, 255, 255, 0.05);

  /* Spacing */
  --sidebar-width:             220px;
  --container-padding:         2rem;
  --section-gap:               1.5rem;
  --card-gap:                  1rem;
  --element-gap:               0.375rem;

  /* Radius */
  --radius-sm:    0.125rem;
  --radius:       0.25rem;
  --radius-lg:    0.5rem;    /* cards → rounded-xl (8px) */
  --radius-full:  0.75rem;   /* badges/pills */

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15);
}
```

### 1.2 Light Mode Overrides

Applied via `[data-theme=light]` on `<html>`:

```css
[data-theme="light"] {
  --background:                #f7f9fb;
  --surface-abyss:             #f0f2f5;
  --surface-container-lowest:  #f7f9fb;
  --surface-container-low:     #f3f3fe;
  --surface-container:         #ededf9;
  --surface-container-high:    #e4e4f5;
  --surface-container-highest: #d8d8ef;
  --surface-bright:            #ffffff;
  --surface-card:              #ffffff;
  --surface-variant:           #e4e4f5;

  --primary:                   #003ea8;
  --primary-container:         #0053db;
  --primary-fixed:             #d4e3ff;
  --primary-fixed-dim:         #a4c8ff;
  --on-primary:                #ffffff;
  --on-primary-container:      #001a47;
  --inverse-primary:           #a4c8ff;

  --electric-indigo:           #003ea8;
  --deep-violet:               #7c3aed;

  --secondary:                 #3131c0;
  --secondary-container:       #e1e0ff;
  --on-secondary:              #ffffff;
  --on-secondary-container:    #07006c;

  --tertiary:                  #6d00ba;
  --tertiary-container:        #f0dbff;
  --on-tertiary:               #ffffff;

  --on-surface:                #191b23;
  --on-surface-variant:        #434655;
  --outline:                   #747689;
  --outline-variant:           #c3c6d7;

  --success-vibrant:           #16a34a;
  --error-vibrant:             #dc2626;
  --warning-vibrant:           #d97706;
  --error:                     #ba1a1a;

  --inverse-surface:           #2e3038;
  --inverse-on-surface:        #f5f5ff;

  --border-glow:               rgba(0, 62, 168, 0.3);
  --border-whisper:            rgba(42, 52, 57, 0.08);

  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
}
```

### 1.3 Tailwind Config

All CSS vars mapped as Tailwind color tokens. Border radius updated to Stitch system (no `14px` card radius — cards use `rounded-xl` = 8px). Spacing tokens added.

---

## 2. Typography

- **Display / Headlines:** `Geist Sans` (weights 400, 600, 700, 800) — loaded via Google Fonts
- **Body / UI:** `Inter` (weights 400, 500, 600) — loaded via Google Fonts
- **Icons:** `Material Symbols Outlined` (replacing lucide-react) — FILL/wght variable font

Tailwind font families:
```js
fontFamily: {
  display: ['Geist Sans', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
}
```

---

## 3. Shell Layout

### 3.1 Sidebar (`components/layout/Sidebar.tsx`)

- Fixed left, full height, `w-[220px]`
- Background: `bg-surface-container-low` (dark: `#171c21`)
- Right border: `border-r border-white/5`
- Padding: `py-6 px-4`
- Logo: `font-display font-bold text-[#6366f1]` "AutoApply OS" + `text-outline uppercase tracking-widest text-xs` "Precision Workflow"
- Nav items: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm`
  - Default: `text-on-surface-variant hover:bg-surface-container hover:text-on-surface`
  - Active: `text-primary bg-primary-container/10 border-r-2 border-electric-indigo font-medium`
- Icons: Material Symbols Outlined, `text-[20px]`
- Bottom: "New Application" CTA — `bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg py-2.5 text-center text-sm font-medium`

Nav items (icon, label, href):
1. `dashboard` → Dashboard → `/`
2. `work` → Jobs → `/jobs`
3. `send` → Applications → `/applications`
4. `calendar_today` → Calendar → `/calendar`
5. `insights` → Insights → `/insights`
6. `person` → Profile → `/profile`
7. `folder_special` → App Profiles → `/profiles`

### 3.2 Top Header (`components/layout/TopHeader.tsx`)

New component (does not exist in current codebase):
- `h-14 bg-background/70 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5`
- Left: page title (dynamic, set by each page)
- Center: search input `bg-surface-container-high border-none rounded-lg py-1.5 pl-10 pr-4 text-sm` with magnifier icon
- Right: sync indicator (animated ping `text-success-vibrant`), notification bell, avatar circle

### 3.3 Dashboard Shell (`app/(dashboard)/layout.tsx`)

```tsx
<div className="flex min-h-screen bg-background mesh-gradient">
  <Sidebar />
  <div className="flex-1 ml-[220px] flex flex-col">
    <TopHeader />
    <main className="flex-1 p-8">{children}</main>
  </div>
</div>
```

---

## 4. CSS Utility Classes

Added to `globals.css` (not Tailwind — used in JSX className):

```css
/* Glass morphism */
.glass {
  background: rgba(30, 39, 46, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Mesh gradient overlay */
.mesh-gradient {
  background-image: radial-gradient(at top right, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
}
.mesh-gradient-card {
  background-image: radial-gradient(at top right, rgba(99, 102, 241, 0.02) 0%, transparent 60%);
}

/* Border glow hover */
.border-glow-hover:hover {
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
}

/* Border beam animation (active/featured cards) */
@keyframes beam {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
.border-beam-active {
  position: relative;
  overflow: hidden;
}
.border-beam-active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  background-size: 200% 100%;
  animation: beam 3s linear infinite;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #30353b; border-radius: 10px; }
```

---

## 5. Page Specifications

### 5.1 Dashboard (`/`)

**Layout:** Full-width content area inside shell.

**Header row:** Page title "Dashboard" + date + "Sync Now" button.

**Stat cards row:** 4 equal columns.  
Each card: `bg-surface-card p-5 rounded-xl border border-white/5 hover:border-electric-indigo/30 transition-all group mesh-gradient-card`  
- Icon container: `w-10 h-10 rounded-lg bg-[color]/10 flex items-center justify-center`
- Large number: `text-3xl font-display font-bold text-on-surface`
- Label: `text-sm text-on-surface-variant`
- Delta badge: `text-xs px-2 py-0.5 rounded-full bg-[color]/10 text-[color]`

Stats: Active Apps (primary), Interviews (tertiary), Offers (success), Response Rate (warning).

**Main grid:** `grid grid-cols-12 gap-6`
- Recent Applications: `col-span-8` — table-style list with company logo, role, ATS badge, status chip, date
- Activity Log: `col-span-4` — vertical timeline
  - Connector: `absolute left-[7px] top-0 bottom-0 w-[1px] bg-white/5`
  - Node dot: `w-3.5 h-3.5 rounded-full border-2 border-surface-container` with colored fill per event type
  - Event text: `text-sm text-on-surface` + `text-xs text-outline`

### 5.2 Jobs (`/jobs`)

**Filter section:** `bg-surface-container rounded-xl p-6 border border-outline-variant shadow-sm mesh-gradient-card`  
Filters: search input, Role Type select, Location select, Experience select, Salary Range select — all `bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface`.

**Masonry grid:** `columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4` (CSS columns masonry)

**Job card:** `break-inside-avoid bg-surface-card rounded-xl border border-outline-variant p-5 transition-all hover:scale-[1.01] border-glow-hover flex flex-col gap-4 mesh-gradient-card`
- Header: company logo `w-12 h-12 rounded-lg bg-surface-container-highest border border-outline-variant overflow-hidden p-2` + company name + role title
- Featured badge (if applicable): `border-beam-active`
- Tags: match score `bg-primary/10 text-primary`, remote/hybrid, skills
- Salary/Match row: `py-3 border-y border-outline-variant/20 flex justify-between items-center`
- Auto-Apply toggle: custom CSS toggle `peer-checked:bg-electric-indigo`
- Apply button: `bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-full px-4 py-1.5 text-sm font-medium`

**FAB:** `fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary-container to-electric-indigo shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center`

### 5.3 Applications (`/applications`)

**Header:** title + stats chips (total, active, interviewed, offers).

**Filter bar:** search + status filter tabs (`All`, `Applied`, `Interview`, `Offer`, `Rejected`) — active tab: `bg-primary-container/10 text-primary border-b-2 border-electric-indigo`.

**Application cards:** `bg-surface-card rounded-xl border border-outline-variant p-5 border-glow-hover transition-all`
- Company logo + role title + company name
- ATS badge: `bg-surface-container-highest text-on-surface-variant text-xs px-2 py-0.5 rounded-full`
- Status chip: colored by status (`success-vibrant`, `warning-vibrant`, `error-vibrant`, `primary`)
- Applied date + follow-up date
- Action buttons: View, Follow Up

### 5.4 Calendar (`/calendar`)

**Calendar header:** Month/year navigation, view toggle (Month/Week/Day).

**Calendar grid:** CSS grid 7 columns with `background-color: outline-variant` gaps.
- Each cell: `min-h-[120px] bg-surface-container p-2`
- Today highlight: `bg-primary-container/10 border border-electric-indigo/30`
- Event chips within cells: `bg-primary/10 text-primary text-xs rounded px-1.5 py-0.5 truncate`

**Sidebar panel** (right, `w-80`): upcoming events list for selected day.

### 5.5 Insights (`/insights`)

**Header:** title + time range selector tabs.

**Top stats row:** 4 metric cards (same style as Dashboard stat cards).

**Charts section:** `grid grid-cols-2 gap-6`
- Each chart card: `bg-surface-card rounded-xl border border-outline-variant p-6`
- Chart placeholder (real charts: recharts or similar)

**Application funnel:** horizontal funnel visualization.

**Source breakdown:** table with platform name, count, conversion rate.

### 5.6 Profile (`/profile`)

**Layout:** Two-column — `col-span-8` form + `col-span-4` preview/summary.

**Sections:** Personal Info, Work Experience, Education, Skills, Resume Upload.

**Section cards:** `bg-surface-card rounded-xl border border-outline-variant p-6`

**Inputs:** `bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-electric-indigo/50 focus:ring-1 focus:ring-electric-indigo/30`

**Save button:** `bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-6 py-2.5 font-medium`

### 5.7 App Profiles (`/profiles`)

**Header:** title + "New Profile" button.

**Profile cards grid:** `grid grid-cols-3 gap-4`

Each card: `bg-surface-card rounded-xl border border-outline-variant p-5 transition-all`
- Active profile: `border-beam-active` + `border-electric-indigo/40`
- Inactive: `border-glow-hover`
- Profile name, role target, last used date
- Skills tags row
- Edit / Set Active buttons

**Empty state:** centered illustration + CTA.

### 5.8 Login Page (reskin only, keep 60/40 layout)

Left panel (60%): keep existing content, update colors to new tokens.
- Background: `bg-surface-container-low` 
- Card: `bg-surface-card rounded-xl border border-outline-variant`
- `SignInButton` component: same gradient as CTA

Right panel (40%): `bg-gradient-to-br from-surface-container-low via-background to-surface-container-lowest` with indigo mesh gradient overlay, feature bullet points.

---

## 6. UX Enhancement Layer

Applied after base page rebuild is complete.

### 6.1 Framer Motion

- **Page transitions:** `<AnimatePresence>` in `app/(dashboard)/layout.tsx` with `opacity/y` slide-up on route change (duration 0.2s)
- **Stagger feeds:** Application list items, job cards animate in with staggered delay (0.03s per item)
- **Card hover lift:** `whileHover={{ scale: 1.01, y: -1 }}` on job/application cards (spring, stiffness 400)
- **Stat counter:** Count-up animation on Dashboard stat numbers on first mount

### 6.2 Theme Toggle

`ThemeToggle` component: sun/moon icon button in TopHeader.
- Clicks toggle `data-theme` on `<html>` between `light`/`dark`
- State persisted in `localStorage` key `"theme"`
- Animated icon swap via Framer Motion `AnimatePresence` (rotate + scale)
- CSS transitions on all color tokens: `transition-colors duration-300`

### 6.3 Sync Indicator

In TopHeader: when sync is active, animated ping on green dot:
```tsx
<span className="relative flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-vibrant opacity-75" />
  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-vibrant" />
</span>
```

---

## 7. Implementation Order

1. **Token layer** — `globals.css` + `tailwind.config.ts` (no visual changes until consumed)
2. **Shell** — `Sidebar`, `TopHeader`, `layout.tsx`
3. **Dashboard** — stat cards + 8/4 grid + activity log
4. **Jobs** — masonry grid + job cards + FAB
5. **Applications** — filter tabs + application cards
6. **Calendar** — grid + day panel
7. **Insights** — charts + funnel
8. **Profile** — two-col form
9. **App Profiles** — border-beam cards
10. **Login** — reskin 60/40
11. **UX layer** — Framer Motion + theme toggle + sync indicator

Each step is independently committable. Business logic (API calls, Supabase queries, server components) is preserved as-is — only JSX structure and className strings change.

---

## 8. Out of Scope

- New API endpoints or database schema changes
- Extension (separate codebase)
- Email/Gmail integration UI
- Interview prep pages
- Referral network pages
- Any feature not currently in the codebase
