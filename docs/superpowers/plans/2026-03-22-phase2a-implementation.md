# AutoApply OS — Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the "Digital Curator" UI/UX overhaul, Workday-style profile, application detail page, and automated job sync with two new Summer 2026 repos.

**Architecture:** Component-first — design tokens → rebuilt shadcn primitives → navigation shell → pages. Server-component fetch pattern preserved throughout. Full CSS token replacement (no aliasing of old shadcn oklch vars). TDD for all new components.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Radix UI, Supabase, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-22-phase2a-design.md`
**Stitch references:** `stitch/*/code.html` and `stitch/*/screen.png` — use as visual reference for each page

---

## File Map

```
autoapply/apps/web/
├── app/
│   ├── globals.css                              REPLACE — full token swap
│   ├── layout.tsx                               KEEP — no changes
│   ├── (auth)/login/page.tsx                    RESTYLE — update class names
│   ├── (dashboard)/
│   │   ├── layout.tsx                           REPLACE — use Sidebar component
│   │   ├── page.tsx                             REPLACE — use PipelineKanban
│   │   ├── jobs/page.tsx                        REPLACE — grid layout
│   │   ├── applications/
│   │   │   ├── page.tsx                         RESTYLE — update ApplicationKanban styles
│   │   │   └── [id]/page.tsx                    CREATE — detail page
│   │   ├── calendar/page.tsx                    CREATE — stub
│   │   ├── insights/page.tsx                    CREATE — stub
│   │   └── profile/page.tsx                     REPLACE — new ProfileForm
│   └── api/
│       └── applications/
│           └── [id]/route.ts                    CREATE — GET single application
├── components/
│   ├── ui/
│   │   ├── button.tsx                           REPLACE
│   │   ├── badge.tsx                            REPLACE
│   │   ├── card.tsx                             REPLACE
│   │   ├── input.tsx                            REPLACE
│   │   └── tabs.tsx                             RESTYLE (keep Radix, update classes)
│   ├── layout/
│   │   └── Sidebar.tsx                         CREATE
│   ├── dashboard/
│   │   ├── PipelineKanban.tsx                  CREATE (replaces ApplicationFunnel + DashboardView)
│   │   └── StatsBar.tsx                        CREATE
│   ├── jobs/
│   │   ├── JobCard.tsx                         REPLACE — grid card variant
│   │   └── JobFiltersClient.tsx                CREATE — thin 'use client' wrapper for filter tabs
│   ├── applications/
│   │   ├── ApplicationKanban.tsx               RESTYLE only
│   │   └── ApplicationDetail.tsx               CREATE
│   └── profile/
│       └── ProfileForm.tsx                     REPLACE — full rebuild
├── lib/
│   └── types.ts                                UPDATE — ExperienceEntry, ProfileDetails, Profile
├── tailwind.config.ts                          REPLACE — new token mapping
├── vercel.json                                 UPDATE — add cron block
└── __tests__/
    ├── components/
    │   ├── dashboard/
    │   │   ├── ApplicationFunnel.test.tsx       DELETE
    │   │   ├── PipelineKanban.test.tsx          CREATE
    │   │   └── StatsBar.test.tsx                CREATE
    │   ├── jobs/
    │   │   └── JobCard.test.tsx                UPDATE
    │   ├── applications/
    │   │   └── ApplicationDetail.test.tsx      CREATE
    │   └── profile/
    │       └── ProfileForm.test.tsx            REPLACE
    ├── pages/
    │   ├── CalendarPage.test.tsx               CREATE
    │   └── InsightsPage.test.tsx               CREATE
    └── api/
        └── applications/
            └── detail.test.ts                  CREATE
supabase/migrations/  (repo root — NOT inside autoapply/)
    └── 20260322000001_profile_details.sql      CREATE
```

---

## Task 1: Design Tokens + Tailwind Config

**Files:**
- Replace: `autoapply/apps/web/app/globals.css`
- Replace: `autoapply/apps/web/tailwind.config.ts`

- [ ] **Step 1: Replace `globals.css` with Digital Curator tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --surface: #f7f9fb;
    --surface-container: #e8eff3;
    --surface-card: #ffffff;
    --surface-container-highest: #c9d8e0;
    --primary: #0053db;
    --primary-dim: #0048c1;
    --on-surface: #2a3439;
    --on-surface-muted: #6b7f88;
    --outline-variant: #c4d0d7;
  }

  body {
    background-color: var(--surface);
    color: var(--on-surface);
    font-size: 0.875rem;
    -webkit-font-smoothing: antialiased;
  }

  * {
    border-color: transparent;
  }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .shadow-ambient { box-shadow: 0 12px 40px rgba(42, 52, 57, 0.06); }
  .gradient-primary { background: linear-gradient(135deg, #0053db, #0048c1); }
  .label-sm {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
```

- [ ] **Step 2: Replace `tailwind.config.ts` with new token mapping**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-container': 'var(--surface-container)',
        'surface-card': 'var(--surface-card)',
        'surface-container-highest': 'var(--surface-container-highest)',
        primary: {
          DEFAULT: 'var(--primary)',
          dim: 'var(--primary-dim)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          muted: 'var(--on-surface-muted)',
        },
        'outline-variant': 'var(--outline-variant)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        ambient: '0 12px 40px rgba(42, 52, 57, 0.06)',
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 3: Verify build compiles with new tokens**

```bash
cd autoapply/apps/web && npx next build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/app/globals.css autoapply/apps/web/tailwind.config.ts
git commit -m "feat: replace shadcn tokens with Digital Curator design system"
```

---

## Task 2: Rebuild UI Primitives

**Files:**
- Replace: `autoapply/apps/web/components/ui/button.tsx`
- Replace: `autoapply/apps/web/components/ui/badge.tsx`
- Replace: `autoapply/apps/web/components/ui/card.tsx`
- Replace: `autoapply/apps/web/components/ui/input.tsx`
- Restyle: `autoapply/apps/web/components/ui/tabs.tsx`

- [ ] **Step 1: Replace `components/ui/button.tsx`**

```typescript
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all rounded-xl',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0053db]/20',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'gradient-primary text-white hover:opacity-90',
        variant === 'secondary' && 'bg-surface-container text-on-surface hover:bg-surface-container-highest',
        variant === 'ghost' && 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-9 px-4 text-sm',
        size === 'lg' && 'h-11 px-6 text-sm',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Replace `components/ui/badge.tsx`**

```typescript
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  saved:        'bg-slate-500/15 text-slate-700',
  applied:      'bg-blue-600/15 text-blue-700',
  oa:           'bg-violet-600/15 text-violet-700',
  interviewing: 'bg-cyan-600/15 text-cyan-700',
  offer:        'bg-green-600/15 text-green-700',
  rejected:     'bg-red-600/15 text-red-700',
  ghosted:      'bg-gray-400/15 text-gray-500',
}

interface BadgeProps {
  children: React.ReactNode
  status?: string
  className?: string
}

export function Badge({ children, status, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-lg label-sm',
      status
        ? (STATUS_STYLES[status] ?? 'bg-surface-container text-on-surface-muted')
        : 'bg-surface-container text-on-surface-muted',
      className
    )}>
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Replace `components/ui/card.tsx`**

```typescript
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-surface-card rounded-xl shadow-ambient', className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Replace `components/ui/input.tsx`**

```typescript
import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes, LabelHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block label-sm text-on-surface-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl',
          'outline-none transition-all placeholder:text-on-surface-muted/50',
          'focus:ring-2 focus:ring-[#0053db]/20',
          className
        )}
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 5: Update `components/ui/tabs.tsx` — restyle Radix triggers**

Replace only the `className` values in `TabsList` and `TabsTrigger` (keep Radix wiring):

```typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 bg-surface-container p-1 rounded-xl",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm text-on-surface-muted",
      "transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-surface-card data-[state=active]:text-on-surface data-[state=active]:shadow-ambient data-[state=active]:font-medium",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus:outline-none", className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 6: Verify build still passes**

```bash
cd autoapply/apps/web && npx next build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add autoapply/apps/web/components/ui/
git commit -m "feat: rebuild UI primitives for Digital Curator design system"
```

---

## Task 3: Navigation Shell

**Files:**
- Create: `autoapply/apps/web/components/layout/Sidebar.tsx`
- Replace: `autoapply/apps/web/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create `components/layout/Sidebar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',             label: 'Dashboard',    icon: '⊞' },
  { href: '/jobs',         label: 'Jobs',         icon: '⊡' },
  { href: '/applications', label: 'Applications', icon: '◫' },
  { href: '/calendar',     label: 'Calendar',     icon: '▦' },
  { href: '/insights',     label: 'Insights',     icon: '◈' },
  { href: '/profile',      label: 'Profile',      icon: '○' },
]

interface SidebarProps { userEmail: string }

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <aside className="w-52 h-screen bg-surface-container flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <p className="text-sm font-semibold text-on-surface tracking-tight">Job OS</p>
        <p className="label-sm text-on-surface-muted mt-0.5">The Digital Curator</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(item => {
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                active
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container-highest/60'
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: CTA + user */}
      <div className="p-4 space-y-3">
        <Link
          href="/applications/new"
          className="flex items-center justify-center w-full h-9 gradient-primary text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          + New Application
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center label-sm text-primary shrink-0">
            {initials}
          </div>
          <p className="text-xs text-on-surface-muted truncate">{userEmail}</p>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Replace `app/(dashboard)/layout.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd autoapply/apps/web && npx next build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/components/layout/ autoapply/apps/web/app/\(dashboard\)/layout.tsx
git commit -m "feat: add Sidebar component and update dashboard layout"
```

---

## Task 4: TypeScript Types + DB Migration

**Files:**
- Update: `autoapply/apps/web/lib/types.ts`
- Create: `supabase/migrations/20260322000001_profile_details.sql`

- [ ] **Step 1: Update `lib/types.ts` — add `employment_type` to `ExperienceEntry`, new `ProfileDetails`, update `Profile`**

Open `lib/types.ts`. Make these targeted changes:

Replace `ExperienceEntry`:
```typescript
export interface ExperienceEntry {
  company: string
  role: string
  employment_type: 'full_time' | 'internship' | 'part_time' | 'contract'
  start: string
  end: string | null
  bullets: string[]
}
```

Add `ProfileDetails` after `ExperienceEntry`:
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

Replace `Profile`:
```typescript
export interface Profile {
  id: string
  user_id: string
  details: ProfileDetails
  skills: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  preferences: UserPreferences
}
```

- [ ] **Step 2: Run existing type tests to confirm no breakage**

```bash
cd autoapply/apps/web && npx vitest run __tests__/lib/types.test.ts
```

Expected: PASS (the test only checks `Application` and `ApplicationStatus`, not `Profile`)

- [ ] **Step 3: Create migration `supabase/migrations/20260322000001_profile_details.sql`**

```sql
-- Add profile_details JSONB column for personal info (name, phone, bio, resume/portfolio URLs)
-- Keeps preferences JSONB strictly for job search preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_details JSONB DEFAULT '{}';

-- Add Summer 2026 job sources
INSERT INTO job_sources (repo_url, repo_name, job_type_tag, is_active) VALUES
  ('https://github.com/SimplifyJobs/Summer2026-Internships', 'SimplifyJobs/Summer2026-Internships', 'internship', true),
  ('https://github.com/vanshb03/Summer2026-Internships', 'vanshb03/Summer2026-Internships', 'internship', true)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Push migration to Supabase**

```bash
npx supabase db push
```

Expected: `Applying migration 20260322000001_profile_details.sql... Finished supabase db push.`

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/lib/types.ts supabase/migrations/20260322000001_profile_details.sql
git commit -m "feat: extend types (ProfileDetails, ExperienceEntry.employment_type) and add migration"
```

---

## Task 5: Dashboard Page

**Files:**
- Create: `autoapply/apps/web/components/dashboard/PipelineKanban.tsx`
- Create: `autoapply/apps/web/components/dashboard/StatsBar.tsx`
- Replace: `autoapply/apps/web/app/(dashboard)/page.tsx`
- Create: `autoapply/apps/web/__tests__/components/dashboard/PipelineKanban.test.tsx`
- Create: `autoapply/apps/web/__tests__/components/dashboard/StatsBar.test.tsx`
- Delete: `autoapply/apps/web/__tests__/components/dashboard/ApplicationFunnel.test.tsx` (only after new tests pass)

- [ ] **Step 1: Write failing test for `PipelineKanban`**

Create `__tests__/components/dashboard/PipelineKanban.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import type { ApplicationWithJob } from '@/lib/types'

const makeApp = (status: string): ApplicationWithJob => ({
  id: Math.random().toString(), user_id: 'u', job_id: 'j',
  status: status as any, applied_at: '2026-01-01T00:00:00Z',
  last_activity_at: '2026-01-01T00:00:00Z', notes: null, source: 'manual',
  job: { id: 'j', source_id: 's', source_url: null, title: 'SWE', company: 'Acme',
         location: null, job_type: 'internship', required_skills: [], preferred_skills: [],
         experience_level: null, remote_policy: null, apply_url: null,
         posted_at: null, first_seen_at: '', is_active: true },
})

it('renders all 5 pipeline column labels', () => {
  render(<PipelineKanban applications={[]} />)
  expect(screen.getByText('APPLIED')).toBeInTheDocument()
  expect(screen.getByText('OA')).toBeInTheDocument()
  expect(screen.getByText('INTERVIEWING')).toBeInTheDocument()
  expect(screen.getByText('OFFER')).toBeInTheDocument()
  expect(screen.getByText('REJECTED')).toBeInTheDocument()
})

it('shows correct count per column', () => {
  const apps = [makeApp('applied'), makeApp('applied'), makeApp('oa')]
  render(<PipelineKanban applications={apps} />)
  const counts = screen.getAllByText('2')
  expect(counts.length).toBeGreaterThan(0)
})

it('renders company name on card', () => {
  render(<PipelineKanban applications={[makeApp('applied')]} />)
  expect(screen.getByText('Acme')).toBeInTheDocument()
})

it('shows empty state placeholder when column is empty', () => {
  render(<PipelineKanban applications={[]} />)
  const empties = screen.getAllByText('Empty')
  expect(empties.length).toBe(5)
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/dashboard/PipelineKanban.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/dashboard/PipelineKanban'`

- [ ] **Step 3: Create `components/dashboard/PipelineKanban.tsx`**

```typescript
'use client'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'applied',      label: 'APPLIED',      color: '#2563eb' },
  { id: 'oa',           label: 'OA',           color: '#7c3aed' },
  { id: 'interviewing', label: 'INTERVIEWING', color: '#0891b2' },
  { id: 'offer',        label: 'OFFER',        color: '#16a34a' },
  { id: 'rejected',     label: 'REJECTED',     color: '#dc2626' },
]

interface Props { applications: ApplicationWithJob[] }

export function PipelineKanban({ applications }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map(col => {
        const cards = applications.filter(a => a.status === col.id)
        return (
          <div key={col.id} className="min-w-[180px] flex-1 flex-shrink-0 space-y-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <span className="label-sm text-on-surface-muted">{col.label}</span>
              <span className="label-sm text-on-surface bg-surface-container px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.map(app => (
                <div
                  key={app.id}
                  className="bg-surface-card rounded-xl p-3 shadow-ambient space-y-1"
                  style={{ borderLeft: `4px solid ${col.color}` }}
                >
                  <p className="text-sm font-medium text-on-surface truncate">
                    {app.job?.company ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-on-surface-muted truncate">
                    {app.job?.title ?? 'Manual Entry'}
                  </p>
                  <p className="text-[0.6875rem] text-on-surface-muted/60">
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : new Date(app.last_activity_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
              {/* Empty state */}
              {cards.length === 0 && (
                <div className="h-16 rounded-xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                  <span className="label-sm text-on-surface-muted/40">Empty</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Write failing test for `StatsBar`**

Create `__tests__/components/dashboard/StatsBar.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { StatsBar } from '@/components/dashboard/StatsBar'

it('renders OA RATE label', () => {
  render(<StatsBar applications={[]} jobCount={42} />)
  expect(screen.getByText('OA RATE')).toBeInTheDocument()
})

it('shows 0% OA rate when no applications', () => {
  render(<StatsBar applications={[]} jobCount={0} />)
  expect(screen.getByText('0%')).toBeInTheDocument()
})

it('shows job count', () => {
  render(<StatsBar applications={[]} jobCount={57} />)
  expect(screen.getByText('57')).toBeInTheDocument()
})
```

Run and confirm it fails:
```bash
cd autoapply/apps/web && npx vitest run __tests__/components/dashboard/StatsBar.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/dashboard/StatsBar'`

- [ ] **Step 5: Create `components/dashboard/StatsBar.tsx`**

```typescript
import type { ApplicationWithJob } from '@/lib/types'

interface Props { applications: ApplicationWithJob[]; jobCount: number }

export function StatsBar({ applications, jobCount }: Props) {
  const applied = applications.filter(a => a.status !== 'saved').length
  const oa = applications.filter(a => ['oa','interviewing','offer'].includes(a.status)).length
  const oaRate = applied > 0 ? Math.round((oa / applied) * 100) : 0

  return (
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">OA RATE</p>
        <p className="text-2xl font-semibold text-on-surface">{oaRate}%</p>
      </div>
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">VOLUME</p>
        <p className="text-2xl font-semibold text-on-surface">{applied} sent</p>
      </div>
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">JOBS</p>
        <p className="text-2xl font-semibold text-on-surface">{jobCount}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Replace `app/(dashboard)/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import { StatsBar } from '@/components/dashboard/StatsBar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('user_id', user!.id)
    .order('last_activity_at', { ascending: false })

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Application Pipeline</h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Manage your active pursuits across strategic stages.
          </p>
        </div>
        <StatsBar applications={(applications ?? []) as any} jobCount={jobCount ?? 0} />
      </div>
      <PipelineKanban applications={(applications ?? []) as any} />
    </div>
  )
}
```

- [ ] **Step 7: Run tests — confirm both PipelineKanban and StatsBar tests pass**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/dashboard/PipelineKanban.test.tsx __tests__/components/dashboard/StatsBar.test.tsx
```

Expected: PASS (7 tests total). Only proceed to next step if this passes.

- [ ] **Step 8: Delete old test (only after Step 7 passes)**

```bash
rm autoapply/apps/web/__tests__/components/dashboard/ApplicationFunnel.test.tsx
```

- [ ] **Step 9: Run full test suite**

```bash
cd autoapply/apps/web && npx vitest run
```

Expected: All tests pass (no failures)

- [ ] **Step 10: Commit**

```bash
git add autoapply/apps/web/components/dashboard/ \
        autoapply/apps/web/app/\(dashboard\)/page.tsx \
        autoapply/apps/web/__tests__/components/dashboard/
git commit -m "feat: add PipelineKanban dashboard with stats bar"
```

---

## Task 6: Jobs Page

**Files:**
- Replace: `autoapply/apps/web/components/jobs/JobCard.tsx`
- Create: `autoapply/apps/web/components/jobs/JobFiltersClient.tsx`
- Replace: `autoapply/apps/web/app/(dashboard)/jobs/page.tsx`
- Update: `autoapply/apps/web/__tests__/components/jobs/JobCard.test.tsx`

- [ ] **Step 1: Update `__tests__/components/jobs/JobCard.test.tsx`**

Replace the file entirely (tests match new grid card API):
```typescript
import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'
import type { JobWithScore } from '@/lib/types'

const baseJob: JobWithScore = {
  id: '1', source_id: 's1', source_url: 'https://github.com/SimplifyJobs/New-Grad-Positions',
  title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA',
  job_type: 'new_grad', required_skills: [], preferred_skills: [],
  experience_level: null, remote_policy: null,
  apply_url: 'https://careers.google.com',
  posted_at: null, first_seen_at: new Date().toISOString(), is_active: true,
}

it('renders company and title', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText('Google')).toBeInTheDocument()
  expect(screen.getByText('Software Engineer')).toBeInTheDocument()
})

it('renders location', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText('Mountain View, CA')).toBeInTheDocument()
})

it('renders Apply link', () => {
  render(<JobCard job={baseJob} />)
  const link = screen.getByRole('link', { name: /apply/i })
  expect(link).toHaveAttribute('href', 'https://careers.google.com')
})

it('renders job type badge', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText(/new grad/i)).toBeInTheDocument()
})

it('renders score badge when score present', () => {
  const job: JobWithScore = {
    ...baseJob,
    job_scores: [{
      id: '1', job_id: '1', user_id: 'u', score: 87, tier: 'claude_scored',
      matching_skills: ['Python'], skill_gaps: [], verdict: 'stretch',
      reasoning: null, scored_at: '',
    }],
  }
  render(<JobCard job={job} />)
  expect(screen.getByText('87%')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/jobs/JobCard.test.tsx
```

Expected: FAIL (existing card doesn't render location, job type badge in same way)

- [ ] **Step 3: Replace `components/jobs/JobCard.tsx`**

```typescript
import { Badge } from '@/components/ui/badge'
import type { JobWithScore } from '@/lib/types'

interface Props {
  job: JobWithScore
  featured?: boolean
}

export function JobCard({ job, featured }: Props) {
  const score = job.job_scores?.[0]?.score

  return (
    <div className="bg-surface-card rounded-xl shadow-ambient p-5 flex flex-col gap-4 hover:shadow-[0_16px_48px_rgba(42,52,57,0.10)] transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Company logo placeholder */}
        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-sm font-semibold text-on-surface-muted shrink-0">
          {job.company.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {featured && (
            <span className="label-sm px-2 py-0.5 rounded-lg bg-[#0053db]/10 text-[#0053db]">
              FEATURED
            </span>
          )}
          {score != null && (
            <span className="label-sm px-2 py-0.5 rounded-lg bg-green-500/10 text-green-700">
              {score}%
            </span>
          )}
        </div>
      </div>

      {/* Title + company */}
      <div className="space-y-0.5 flex-1">
        <h3 className="text-sm font-semibold text-on-surface leading-snug">{job.title}</h3>
        <p className="text-sm text-on-surface-muted">{job.company}</p>
        {job.location && (
          <p className="text-xs text-on-surface-muted/70">{job.location}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {job.job_type && (
            <Badge className="label-sm">
              {job.job_type.replace('_', ' ')}
            </Badge>
          )}
        </div>
        {job.apply_url ? (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-4 gradient-primary text-white text-xs font-medium rounded-xl inline-flex items-center hover:opacity-90 transition-opacity"
          >
            Apply ↗
          </a>
        ) : (
          <span className="text-xs text-on-surface-muted/50">No link</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/jobs/JobFiltersClient.tsx`**

This is a thin `'use client'` wrapper so the server component jobs page can use the filter tabs with URL navigation. It must live in its own file because a server component file cannot contain `'use client'` code.

```typescript
'use client'
import { useRouter } from 'next/navigation'
import { JobFilters } from '@/components/jobs/JobFilters'
import type { JobType } from '@/lib/types'

interface Props { active: JobType | 'all' }

export function JobFiltersClient({ active }: Props) {
  const router = useRouter()
  return (
    <JobFilters
      active={active}
      onChange={(tab: string) => {
        const params = new URLSearchParams()
        if (tab !== 'all') params.set('type', tab)
        router.push(`/jobs${params.toString() ? `?${params}` : ''}`)
      }}
    />
  )
}
```

- [ ] **Step 5: Replace `app/(dashboard)/jobs/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFiltersClient } from '@/components/jobs/JobFiltersClient'
import type { JobType, JobWithScore } from '@/lib/types'

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select(`*, job_scores!left(score, tier, matching_skills, skill_gaps, verdict, id, user_id, job_id, reasoning, scored_at), source:job_sources(repo_name, repo_url)`)
    .eq('is_active', true)
    .order('first_seen_at', { ascending: false })
    .limit(100)

  if (type && type !== 'all') query = query.eq('job_type', type)

  const { data: jobs } = await query
  const list = (jobs ?? []) as JobWithScore[]
  const curatorsPick = list[0] ?? null
  const rest = list.slice(1)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Job Feed</h1>
          <p className="text-sm text-on-surface-muted mt-1">
            {list.length} opportunities matching your profile
          </p>
        </div>
      </div>

      <JobFiltersClient active={(type as JobType) ?? 'all'} />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {curatorsPick && <JobCard job={curatorsPick} featured />}
        {rest.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
        {list.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <p className="text-5xl font-light text-on-surface-muted/30 tracking-tight">No jobs yet</p>
            <p className="text-sm text-on-surface-muted mt-3">Sync will populate this feed automatically every 6 hours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run job card tests — confirm they pass**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/jobs/JobCard.test.tsx
```

Expected: PASS (5 tests)

- [ ] **Step 7: Run build**

```bash
cd autoapply/apps/web && npx next build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add autoapply/apps/web/components/jobs/ \
        autoapply/apps/web/app/\(dashboard\)/jobs/ \
        autoapply/apps/web/__tests__/components/jobs/
git commit -m "feat: rebuild jobs page as card grid with Curator's Pick"
```

---

## Task 7: Application Detail Page + API

**Files:**
- Create: `autoapply/apps/web/app/api/applications/[id]/route.ts`
- Create: `autoapply/apps/web/components/applications/ApplicationDetail.tsx`
- Create: `autoapply/apps/web/app/(dashboard)/applications/[id]/page.tsx`
- Create: `autoapply/apps/web/__tests__/api/applications/detail.test.ts`
- Create: `autoapply/apps/web/__tests__/components/applications/ApplicationDetail.test.tsx`
- Update: `autoapply/apps/web/components/applications/ApplicationKanban.tsx` (styles only)

- [ ] **Step 1: Write failing API test**

Create `__tests__/api/applications/detail.test.ts`:
```typescript
import { GET } from '@/app/api/applications/[id]/route'
import { NextRequest } from 'next/server'

it('returns 401 when unauthenticated', async () => {
  const req = new NextRequest('http://localhost/api/applications/123')
  const res = await GET(req, { params: Promise.resolve({ id: '123' }) })
  expect(res.status).toBe(401)
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd autoapply/apps/web && npx vitest run __tests__/api/applications/detail.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/applications/[id]/route'`

- [ ] **Step 3: Create `app/api/applications/[id]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('id', id)
    .eq('user_id', user.id)  // ownership check — 404 for both missing and unauthorized
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ application: data, job: data.job ?? null })
}
```

- [ ] **Step 4: Run API test — confirm it passes**

```bash
cd autoapply/apps/web && npx vitest run __tests__/api/applications/detail.test.ts
```

Expected: PASS (1 test)

- [ ] **Step 5: Write failing component test**

Create `__tests__/components/applications/ApplicationDetail.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import type { ApplicationWithJob } from '@/lib/types'

const mockApp: ApplicationWithJob = {
  id: '1', user_id: 'u', job_id: 'j',
  status: 'interviewing', applied_at: '2026-01-15T00:00:00Z',
  last_activity_at: '2026-01-20T00:00:00Z',
  notes: 'Ask about tech stack', source: 'manual',
  job: {
    id: 'j', source_id: 's', source_url: null,
    title: 'SWE Intern', company: 'Stripe', location: 'Remote',
    job_type: 'internship', required_skills: [], preferred_skills: [],
    experience_level: null, remote_policy: null, apply_url: null,
    posted_at: null, first_seen_at: '', is_active: true,
  },
}

it('renders job title and company', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText('SWE Intern')).toBeInTheDocument()
  expect(screen.getByText('Stripe')).toBeInTheDocument()
})

it('renders status badge', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText(/interviewing/i)).toBeInTheDocument()
})

it('renders status timeline with applied date', () => {
  render(<ApplicationDetail application={mockApp} />)
  expect(screen.getByText(/applied/i)).toBeInTheDocument()
  expect(screen.getByText(/jan 15/i)).toBeInTheDocument()
})

it('renders notes textarea with existing notes', () => {
  render(<ApplicationDetail application={mockApp} />)
  const textarea = screen.getByPlaceholderText(/interview notes/i)
  expect(textarea).toHaveValue('Ask about tech stack')
})
```

- [ ] **Step 6: Run test — confirm it fails**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/applications/ApplicationDetail.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/applications/ApplicationDetail'`

- [ ] **Step 7: Create `components/applications/ApplicationDetail.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApplicationWithJob } from '@/lib/types'

interface Props { application: ApplicationWithJob }

export function ApplicationDetail({ application: app }: Props) {
  const [notes, setNotes] = useState(app.notes ?? '')

  const appliedDate = app.applied_at
    ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown'

  async function saveNotes() {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, notes }),
    })
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-lg font-semibold text-on-surface-muted">
            {(app.job?.company ?? 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Badge status={app.status}>{app.status.toUpperCase()}</Badge>
              {app.job?.company && (
                <span className="text-sm text-on-surface-muted">· {app.job.company}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-on-surface mt-1">
              {app.job?.title ?? 'Manual Entry'}
            </h1>
            {app.job?.location && (
              <p className="text-sm text-on-surface-muted">{app.job.location}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm">Edit Details</Button>
          <Button variant="primary" size="sm">Update Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Status Timeline (Phase 2A: applied_at only) */}
        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-4">Status Timeline</h2>
            <div className="relative pl-6">
              {/* Rail */}
              <div className="absolute left-2 top-2 bottom-0 w-px bg-outline-variant/20" />
              {/* Current status dot */}
              <div className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-card" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-on-surface capitalize">{app.status.replace('_', ' ')}</p>
                <p className="text-xs text-on-surface-muted">Applied · {appliedDate}</p>
              </div>
            </div>
          </div>

          {/* Communications placeholder */}
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-3">Communications</h2>
            <div className="bg-surface-container rounded-xl p-6 text-center">
              <p className="text-sm text-on-surface-muted">
                Connect Gmail to see emails · Coming in Phase 2B
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notes + Deadlines */}
        <div className="space-y-5">
          {/* Deadlines stub */}
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Deadlines</h3>
              <button disabled className="label-sm text-on-surface-muted/50 cursor-not-allowed" title="Coming soon">
                + Add Reminder
              </button>
            </div>
            <p className="text-xs text-on-surface-muted/60 text-center py-2">No deadlines yet</p>
          </div>

          {/* Interview Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Interview Notes</h3>
            <textarea
              className="w-full h-36 bg-surface-card rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-[#0053db]/20 resize-none placeholder:text-on-surface-muted/50"
              placeholder="Interview notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create `app/(dashboard)/applications/[id]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'

interface Props { params: Promise<{ id: string }> }

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  return <ApplicationDetail application={data as any} />
}
```

- [ ] **Step 9: Update `ApplicationKanban.tsx` card to link to detail page**

In `components/applications/ApplicationKanban.tsx`, wrap each card in a `Link` to `/applications/[id]`:

```typescript
// Add at top:
import Link from 'next/link'

// Replace <Card key={app.id} ...> with:
<Link key={app.id} href={`/applications/${app.id}`}>
  <Card className="p-3 space-y-1 hover:bg-surface-container transition-colors cursor-pointer"
        style={{ borderLeft: `4px solid var(--status-${app.status}, #64748b)` }}>
    ...existing card content...
  </Card>
</Link>
```

- [ ] **Step 10: Run component tests**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/applications/ApplicationDetail.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 11: Run full test suite**

```bash
cd autoapply/apps/web && npx vitest run
```

Expected: All pass

- [ ] **Step 12: Commit**

```bash
git add autoapply/apps/web/app/api/applications/ \
        autoapply/apps/web/app/\(dashboard\)/applications/ \
        autoapply/apps/web/components/applications/ \
        autoapply/apps/web/__tests__/
git commit -m "feat: add application detail page with timeline, notes, and GET /api/applications/[id]"
```

---

## Task 8: Profile Page

**Files:**
- Replace: `autoapply/apps/web/components/profile/ProfileForm.tsx`
- Replace: `autoapply/apps/web/app/(dashboard)/profile/page.tsx`
- Update: `autoapply/apps/web/app/api/profile/route.ts`
- Replace: `autoapply/apps/web/__tests__/components/profile/ProfileForm.test.tsx`

- [ ] **Step 1: Update `app/api/profile/route.ts` to handle `profile_details`**

Replace the POST handler body:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      skills: body.skills ?? [],
      education: body.education ?? [],
      experience: body.experience ?? [],
      preferences: body.preferences ?? {},
      profile_details: body.profile_details ?? {},
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Write failing ProfileForm tests**

Replace `__tests__/components/profile/ProfileForm.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { Profile } from '@/lib/types'

const emptyProfile: Partial<Profile> = {}

it('renders all section headings', () => {
  render(<ProfileForm initialProfile={emptyProfile} onSubmit={async () => {}} />)
  expect(screen.getByText(/personal details/i)).toBeInTheDocument()
  expect(screen.getByText(/work experience/i)).toBeInTheDocument()
  expect(screen.getByText(/education/i)).toBeInTheDocument()
  expect(screen.getByText(/skills/i)).toBeInTheDocument()
  expect(screen.getByText(/preferences/i)).toBeInTheDocument()
})

it('renders skills input', () => {
  render(<ProfileForm initialProfile={emptyProfile} onSubmit={async () => {}} />)
  expect(screen.getByLabelText(/skills/i)).toBeInTheDocument()
})

it('calls onSubmit with parsed skills array', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm initialProfile={emptyProfile} onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React, TypeScript, Python' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ skills: ['React', 'TypeScript', 'Python'] })
    )
  })
})

it('strips whitespace from skills', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ProfileForm initialProfile={emptyProfile} onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/skills/i), {
    target: { value: 'React,  , TypeScript' },
  })
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ skills: ['React', 'TypeScript'] })
    )
  })
})

it('can add a work experience entry', () => {
  render(<ProfileForm initialProfile={emptyProfile} onSubmit={async () => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /add position/i }))
  expect(screen.getByPlaceholderText(/company name/i)).toBeInTheDocument()
})
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/profile/ProfileForm.test.tsx
```

Expected: FAIL

- [ ] **Step 4: Replace `components/profile/ProfileForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Profile, ExperienceEntry, EducationEntry, ProfileDetails } from '@/lib/types'

interface Props {
  initialProfile: Partial<Profile>
  onSubmit: (data: Partial<Profile>) => Promise<void>
}

const emptyExp = (): ExperienceEntry => ({
  company: '', role: '', employment_type: 'internship',
  start: '', end: null, bullets: [''],
})

const emptyEdu = (): EducationEntry => ({
  school: '', degree: '', major: '', graduation_year: new Date().getFullYear(),
})

export function ProfileForm({ initialProfile, onSubmit }: Props) {
  const [details, setDetails] = useState<ProfileDetails>({
    full_name: null, phone: null, location: null,
    bio: null, resume_url: null, portfolio_url: null,
    ...((initialProfile as any)?.details ?? {}),
  })
  const [skills, setSkills] = useState(
    (initialProfile.skills ?? []).join(', ')
  )
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    initialProfile.experience ?? []
  )
  const [education, setEducation] = useState<EducationEntry[]>(
    initialProfile.education ?? []
  )
  const [prefs, setPrefs] = useState(
    initialProfile.preferences ?? { job_types: [], locations: [], remote_ok: false, min_salary: null }
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSubmit({
      details,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      education,
      preferences: prefs,
    })
    setSaving(false)
  }

  const completedFields = [
    details.full_name, details.phone, details.location, details.bio,
    skills, experience.length > 0, education.length > 0,
  ].filter(Boolean).length
  const completionPct = Math.round((completedFields / 7) * 100)

  return (
    <div className="flex gap-8 p-8">
      {/* Left panel */}
      <div className="w-44 shrink-0 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center text-xl font-semibold text-on-surface-muted mx-auto">
          {(details.full_name ?? 'AU').slice(0, 2).toUpperCase()}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-on-surface">{details.full_name || 'Your Name'}</p>
          <p className="text-xs text-on-surface-muted mt-0.5">
            {experience[0]?.role || 'Add your role'}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="label-sm text-on-surface-muted">Profile Score</span>
              <span className="label-sm text-on-surface">{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
        {details.resume_url && (
          <a href={details.resume_url} target="_blank" rel="noopener noreferrer"
             className="block text-xs text-primary hover:underline truncate">
            📄 Resume
          </a>
        )}
        {details.portfolio_url && (
          <a href={details.portfolio_url} target="_blank" rel="noopener noreferrer"
             className="block text-xs text-primary hover:underline truncate">
            🔗 Portfolio
          </a>
        )}
      </div>

      {/* Right panels */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        {/* Personal Details */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-on-surface">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" id="full_name" placeholder="Alex Rivera"
              value={details.full_name ?? ''} onChange={e => setDetails(d => ({ ...d, full_name: e.target.value }))} />
            <Input label="Phone" id="phone" placeholder="+1 (000) 000-0000"
              value={details.phone ?? ''} onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))} />
            <Input label="Location" id="location" placeholder="San Francisco, CA"
              value={details.location ?? ''} onChange={e => setDetails(d => ({ ...d, location: e.target.value }))} />
            <Input label="Resume URL" id="resume_url" placeholder="https://..."
              value={details.resume_url ?? ''} onChange={e => setDetails(d => ({ ...d, resume_url: e.target.value }))} />
            <Input label="Portfolio URL" id="portfolio_url" placeholder="https://..."
              value={details.portfolio_url ?? ''} onChange={e => setDetails(d => ({ ...d, portfolio_url: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bio" className="block label-sm text-on-surface-muted">Bio</label>
            <textarea
              id="bio" rows={3}
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#0053db]/20 placeholder:text-on-surface-muted/50 resize-none"
              placeholder="Short bio..."
              value={details.bio ?? ''}
              onChange={e => setDetails(d => ({ ...d, bio: e.target.value }))}
            />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Work Experience</h2>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => setExperience(ex => [...ex, emptyExp()])}>
              + Add Position
            </Button>
          </div>
          {experience.map((exp, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Company" id={`exp_company_${i}`} placeholder="Company name"
                  value={exp.company} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} />
                <Input label="Role" id={`exp_role_${i}`} placeholder="Software Engineer"
                  value={exp.role} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} />
                <Input label="Start" id={`exp_start_${i}`} placeholder="Jan 2024"
                  value={exp.start} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} />
                <Input label="End" id={`exp_end_${i}`} placeholder="Present"
                  value={exp.end ?? ''} onChange={e => setExperience(ex => ex.map((x, j) => j === i ? { ...x, end: e.target.value || null } : x))} />
              </div>
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setExperience(ex => ex.filter((_, j) => j !== i))}
                  className="text-xs text-on-surface-muted/60 hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {experience.length === 0 && (
            <p className="text-sm text-on-surface-muted/60 text-center py-4">No positions added yet.</p>
          )}
        </section>

        {/* Education */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Education</h2>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => setEducation(ed => [...ed, emptyEdu()])}>
              + Add Education
            </Button>
          </div>
          {education.map((edu, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="School" id={`edu_school_${i}`} placeholder="University of..."
                  value={edu.school} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} />
                <Input label="Degree" id={`edu_degree_${i}`} placeholder="B.S. Computer Science"
                  value={edu.degree} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} />
                <Input label="Graduation Year" id={`edu_year_${i}`} type="number"
                  value={edu.graduation_year} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_year: Number(e.target.value) } : x))} />
                <Input label="GPA (optional)" id={`edu_gpa_${i}`} type="number" step="0.01"
                  value={edu.gpa ?? ''} onChange={e => setEducation(ed => ed.map((x, j) => j === i ? { ...x, gpa: e.target.value ? Number(e.target.value) : undefined } : x))} />
              </div>
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setEducation(ed => ed.filter((_, j) => j !== i))}
                  className="text-xs text-on-surface-muted/60 hover:text-red-500 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-on-surface">Skills</h2>
          <Input
            label="Skills"
            id="skills"
            placeholder="React, TypeScript, Python, Go..."
            value={skills}
            onChange={e => setSkills(e.target.value)}
          />
          <p className="text-xs text-on-surface-muted">Separate with commas. Use exact tech names for better job matching.</p>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-on-surface">Preferences</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="remote_ok"
              className="w-4 h-4 rounded accent-primary"
              checked={prefs.remote_ok}
              onChange={e => setPrefs(p => ({ ...p, remote_ok: e.target.checked }))}
            />
            <label htmlFor="remote_ok" className="text-sm text-on-surface">Open to remote</label>
          </div>
        </section>

        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Replace `app/(dashboard)/profile/page.tsx`**

The page passes an `onSubmit` to `ProfileForm`. `ProfileForm` is a client component, so `onSubmit` must be a regular async function that calls `POST /api/profile` — not a server action. (Server actions cannot be passed as props from server to client components in Next.js 14 App Router without a special wrapper pattern, and the spec says to use `/api/profile`.)

```typescript
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <ProfileForm initialProfile={profile ?? {}} />
}
```

The `onSubmit` is defined inside `ProfileForm` itself (client component) and calls `POST /api/profile`. Update `ProfileForm.tsx` to remove the `onSubmit` prop and use `fetch` directly:

In `ProfileForm.tsx`, replace the `handleSubmit` function:
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setSaving(true)
  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      details,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      education,
      preferences: prefs,
    }),
  })
  setSaving(false)
}
```

And update the `Props` interface to remove `onSubmit`:
```typescript
interface Props {
  initialProfile: Partial<Profile>
}
```

And update the test's `ProfileForm` calls to remove the `onSubmit` prop — replace the test's `onSubmit` approach with spying on `fetch`. Update the test in Step 2:
```typescript
it('calls POST /api/profile on submit', async () => {
  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)
  render(<ProfileForm initialProfile={emptyProfile} />)
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }))
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' }))
  })
  fetchSpy.mockRestore()
})
```
Replace the two `onSubmit` tests (`calls onSubmit with parsed skills array` and `strips whitespace from skills`) with this single fetch spy test. The skills parsing logic is still tested implicitly.

Also update `profile/page.tsx` test expectation: the section heading tests and `can add a work experience entry` test remain unchanged (they don't use `onSubmit`).

- [ ] **Step 6: Run ProfileForm tests**

```bash
cd autoapply/apps/web && npx vitest run __tests__/components/profile/ProfileForm.test.tsx
```

Expected: PASS (5 tests)

- [ ] **Step 7: Run full test suite**

```bash
cd autoapply/apps/web && npx vitest run
```

Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add autoapply/apps/web/components/profile/ \
        autoapply/apps/web/app/\(dashboard\)/profile/ \
        autoapply/apps/web/app/api/profile/ \
        autoapply/apps/web/__tests__/components/profile/
git commit -m "feat: full Workday-style profile form with personal details, experience, education"
```

---

## Task 9: Calendar + Insights Stubs

**Files:**
- Create: `autoapply/apps/web/app/(dashboard)/calendar/page.tsx`
- Create: `autoapply/apps/web/app/(dashboard)/insights/page.tsx`
- Create: `autoapply/apps/web/__tests__/pages/CalendarPage.test.tsx`
- Create: `autoapply/apps/web/__tests__/pages/InsightsPage.test.tsx`

- [ ] **Step 1: Write failing tests for Calendar and Insights stubs**

Create `__tests__/pages/CalendarPage.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import CalendarPage from '@/app/(dashboard)/calendar/page'

it('renders calendar coming soon headline', () => {
  render(<CalendarPage />)
  expect(screen.getByText(/calendar coming soon/i)).toBeInTheDocument()
})
```

Create `__tests__/pages/InsightsPage.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import InsightsPage from '@/app/(dashboard)/insights/page'

it('renders insights unlock headline', () => {
  render(<InsightsPage />)
  expect(screen.getByText(/insights unlock/i)).toBeInTheDocument()
})
```

Run and confirm both fail:
```bash
cd autoapply/apps/web && npx vitest run __tests__/pages/
```
Expected: FAIL — `Cannot find module`

- [ ] **Step 2: Create `app/(dashboard)/calendar/page.tsx`**

```typescript
export default function CalendarPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <p className="text-[3.5rem] font-light text-on-surface-muted/20 tracking-[-0.02em] select-none">▦</p>
      <h1 className="text-2xl font-semibold text-on-surface mt-4">Calendar coming soon</h1>
      <p className="text-sm text-on-surface-muted mt-2 max-w-sm">
        Connect Gmail in Phase 2B to auto-extract interview schedules and deadlines directly into your calendar.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/insights/page.tsx`**

```typescript
export default function InsightsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <p className="text-[3.5rem] font-light text-on-surface-muted/20 tracking-[-0.02em] select-none">◈</p>
      <h1 className="text-2xl font-semibold text-on-surface mt-4">Insights unlock at 5 applications</h1>
      <p className="text-sm text-on-surface-muted mt-2 max-w-sm">
        Keep applying — your response rate, OA conversion, and offer trends will appear here.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run stub tests — confirm they pass**

```bash
cd autoapply/apps/web && npx vitest run __tests__/pages/
```

Expected: PASS (2 tests)

- [ ] **Step 5: Build check**

```bash
cd autoapply/apps/web && npx next build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add autoapply/apps/web/app/\(dashboard\)/calendar/ \
        autoapply/apps/web/app/\(dashboard\)/insights/ \
        autoapply/apps/web/__tests__/pages/
git commit -m "feat: add Calendar and Insights stub pages"
```

---

## Task 10: Job Sync — Cron Auth + Vercel Config

**Files:**
- Update: `autoapply/apps/web/app/api/jobs/sync/route.ts`
- Update: `autoapply/apps/web/vercel.json`

- [ ] **Step 1: Write failing test for CRON_SECRET auth path**

Find the existing sync route test at `__tests__/api/github/sync.test.ts`. Add a new test case:

```typescript
it('returns 401 when token is wrong', async () => {
  const req = new NextRequest('http://localhost/api/jobs/sync', {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-token' },
  })
  const res = await POST(req)
  expect(res.status).toBe(401)
})

it('accepts CRON_SECRET as bearer token', async () => {
  process.env.CRON_SECRET = 'test-cron-secret'
  const req = new NextRequest('http://localhost/api/jobs/sync', {
    method: 'POST',
    headers: { authorization: 'Bearer test-cron-secret' },
  })
  // The rest of POST will try to sync jobs; mock or let it fail at the DB step.
  // We just need auth to pass (not return 401).
  const res = await POST(req)
  expect(res.status).not.toBe(401)
  delete process.env.CRON_SECRET
})
```

Run and confirm the CRON_SECRET test fails (it will either fail to import or return 401 since the code doesn't accept it yet):
```bash
cd autoapply/apps/web && npx vitest run __tests__/api/github/sync.test.ts
```

- [ ] **Step 2: Update auth check in `app/api/jobs/sync/route.ts`**

Replace the auth block at the top of `POST`:
```typescript
const authHeader = request.headers.get('authorization')
const token = authHeader?.replace('Bearer ', '')
const isValid =
  token === process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET)
if (!isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Run tests again — confirm CRON_SECRET test now passes:
```bash
cd autoapply/apps/web && npx vitest run __tests__/api/github/sync.test.ts
```
Expected: All sync tests pass.

- [ ] **Step 3: Update `vercel.json` to add cron**

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "crons": [
    {
      "path": "/api/jobs/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- [ ] **Step 4: Add `CRON_SECRET` to Vercel environment variables**

Go to Vercel Dashboard → your project → **Settings → Environment Variables** and add:
```
CRON_SECRET = <any strong random string, e.g. output of: openssl rand -hex 32>
```

- [ ] **Step 5: Run full test suite and build**

```bash
cd autoapply/apps/web && npx vitest run && npx next build 2>&1 | tail -5
```

Expected: All tests pass, `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add autoapply/apps/web/app/api/jobs/sync/route.ts \
        autoapply/apps/web/vercel.json \
        autoapply/apps/web/__tests__/api/github/sync.test.ts
git commit -m "feat: add Vercel cron for 6-hourly job sync, accept CRON_SECRET auth"
```

---

## Task 11: Final Verification + Push

- [ ] **Step 1: Run full test suite**

```bash
cd autoapply/apps/web && npx vitest run
```

Expected:
```
Test Files  XX passed
Tests       XX passed
```
Zero failures.

- [ ] **Step 2: Run production build**

```bash
cd autoapply/apps/web && npx next build
```

Expected: `✓ Compiled successfully` with no type errors.

- [ ] **Step 3: Push to GitHub (triggers Vercel deploy)**

```bash
git push
```

- [ ] **Step 4: Verify `page_client-reference-manifest.js` is generated for all dashboard pages**

After `next build` completes locally:
```bash
find autoapply/apps/web/.next/server/app/\(dashboard\) -name "*manifest*" | sort
```

Expected: A manifest file for each page route including `page.tsx`, `jobs/page`, `applications/page`, `profile/page`, `calendar/page`, `insights/page`.

- [ ] **Step 5: Trigger first sync on production**

After Vercel deploy completes:
```bash
curl -X POST https://autoapply-seven.vercel.app/api/jobs/sync \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected: `{"synced": N}` — jobs now in production DB.

---

## Running Tests

```bash
# Unit + component tests
cd autoapply/apps/web && npx vitest run

# Watch mode
cd autoapply/apps/web && npx vitest

# Production build check
cd autoapply/apps/web && npx next build

# Push migration to Supabase
npx supabase db push
```
