# Phase 03 UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual overhaul of the AutoApply web app — consistent Cognitive Workspace design system, Geist + Inter typography, dark/light mode with system preference, Framer Motion animations throughout.

**Architecture:** Foundation first (tokens → components → sidebar), then pages (dashboard, profile, profiles, login, applications, polish pages), then a motion pass. All pages share the same token set; components are updated in-place rather than replaced wholesale. The extension popup/fill panel is out of scope (Phase 03b).

**Tech Stack:** Next.js 14, Tailwind CSS, Framer Motion (new), `geist` package (new), shadcn primitives, Radix UI, lucide-react.

---

## File Map

### New files
- `apps/web/components/ui/avatar.tsx` — initials fallback avatar, sm/md/lg sizes
- `apps/web/components/ui/separator.tsx` — 1px border-subtle horizontal rule
- `apps/web/components/ui/select.tsx` — styled native select matching Input height
- `apps/web/components/ui/stat-card.tsx` — animated counter card (Framer Motion)
- `apps/web/components/dashboard/Greeting.tsx` — client component with time-based greeting
- `apps/web/components/auth/SignInButton.tsx` — isolated client component for OAuth flow

### Modified files
- `apps/web/package.json` — add `geist`, `framer-motion`
- `apps/web/app/layout.tsx` — replace Manrope with GeistSans; map to `--font-display`
- `apps/web/app/globals.css` — add `--radius-card`, `--border-subtle`, `--shadow-card`
- `apps/web/tailwind.config.ts` — add `border-subtle`, `rounded-card`, `shadow-card` aliases
- `apps/web/components/ui/button.tsx` — secondary border-subtle, focus ring primary/30, radius 10px
- `apps/web/components/ui/input.tsx` — h-9, border-subtle, focus ring primary/30
- `apps/web/components/ui/badge.tsx` — explicit success/warning/error/muted variants
- `apps/web/components/ui/card.tsx` — rounded-card, shadow-card, border-subtle
- `apps/web/components/layout/Sidebar.tsx` — w-48, motion.span layoutId pill, Avatar chip, remove CTA
- `apps/web/app/(dashboard)/layout.tsx` — add page transition wrapper
- `apps/web/app/(dashboard)/page.tsx` — full redesign: greeting, StatCards, 2-col feed + readiness
- `apps/web/app/(dashboard)/profile/page.tsx` — card wrappers, styled readiness banner
- `apps/web/app/(dashboard)/profiles/page.tsx` — card grid with hover actions, ghost "New Profile" card
- `apps/web/app/(dashboard)/applications/page.tsx` — polished page header
- `apps/web/app/(auth)/login/page.tsx` — 60/40 split layout
- `apps/web/app/(dashboard)/jobs/page.tsx` — page header font-display
- `apps/web/app/(dashboard)/insights/page.tsx` — card token updates
- `apps/web/app/(dashboard)/calendar/page.tsx` — card wrapper polish

---

## PHASE A: FOUNDATION

---

### Task 1: Install dependencies

**Files:**
- Modify: `apps/web/package.json` (via npm install)

- [ ] **Step 1: Install packages**

Run from `apps/web/`:
```bash
cd /path/to/autoapply/apps/web
npm install geist framer-motion
```

Expected output: both packages resolved with no peer dep warnings.

- [ ] **Step 2: Verify installs**

```bash
cat package.json | grep -E '"geist|"framer-motion'
```

Expected output:
```
"framer-motion": "^...",
"geist": "^...",
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "deps(03): add geist + framer-motion"
```

---

### Task 2: Wire Geist font in layout.tsx

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```typescript
// apps/web/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
// GeistSans.variable resolves to '--font-geist-sans'

export const metadata: Metadata = {
  title: 'AutoApply',
  description: 'Your job application operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()` }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Verify dev server starts without error**

```bash
npm run dev
```

Expected: no font-related errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(03): wire GeistSans font variable"
```

---

### Task 3: Design tokens — globals.css + tailwind.config.ts

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Add CSS tokens to globals.css**

In the `:root` block, after `--error: #ef4444;`, add:
```css
    --radius-card: 14px;
    --border-subtle: rgba(42, 52, 57, 0.08);
    --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
```

In the `[data-theme="dark"]` block, after `--error: #f87171;`, add:
```css
    --border-subtle: rgba(255, 255, 255, 0.07);
    --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
```

In the `h1, h2, h3` rule, update to also map Geist:
```css
  h1, h2, h3 { font-family: var(--font-geist-sans, var(--font-display, inherit)); }
```

Also add `--font-display` alias in `:root` so tailwind's `font-display` utility resolves:
```css
    --font-display: var(--font-geist-sans);
```

Final `:root` block:
```css
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
    --success: #22c55e;
    --error: #ef4444;
    --radius-card: 14px;
    --border-subtle: rgba(42, 52, 57, 0.08);
    --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    --font-display: var(--font-geist-sans);
  }
```

Final `[data-theme="dark"]` block:
```css
  [data-theme="dark"] {
    --surface: #0f1419;
    --surface-container: #1a2128;
    --surface-card: #1e272e;
    --surface-container-highest: #2a3439;
    --primary: #4d9fff;
    --primary-dim: #3d8fe8;
    --on-surface: #e8eff3;
    --on-surface-muted: #8b9da7;
    --outline-variant: #3a4a54;
    --success: #34d399;
    --error: #f87171;
    --border-subtle: rgba(255, 255, 255, 0.07);
    --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
  }
```

- [ ] **Step 2: Add Tailwind aliases to tailwind.config.ts**

In `theme.extend.colors`, add:
```typescript
'border-subtle': 'var(--border-subtle)',
```

In `theme.extend.borderRadius`, add:
```typescript
'card': 'var(--radius-card)',
```

In `theme.extend.boxShadow`, change the existing `ambient` entry and add `card`:
```typescript
boxShadow: {
  ambient: '0 12px 40px rgba(42, 52, 57, 0.06)',
  card: 'var(--shadow-card)',
},
```

Full updated `tailwind.config.ts`:
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
        success: 'var(--success)',
        error: 'var(--error)',
        'border-subtle': 'var(--border-subtle)',
      },
      fontFamily: {
        display: ['var(--font-geist-sans)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        ambient: '0 12px 40px rgba(42, 52, 57, 0.06)',
        card: 'var(--shadow-card)',
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

- [ ] **Step 3: Verify Tailwind picks up new tokens**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: no errors about unknown utilities.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/globals.css apps/web/tailwind.config.ts
git commit -m "feat(03): add radius-card, border-subtle, shadow-card tokens"
```

---

### Task 4: Update base UI components — Button, Input, Badge, Card + new Select

**Files:**
- Modify: `apps/web/components/ui/button.tsx`
- Modify: `apps/web/components/ui/input.tsx`
- Modify: `apps/web/components/ui/badge.tsx`
- Modify: `apps/web/components/ui/card.tsx`
- Create: `apps/web/components/ui/select.tsx`

- [ ] **Step 1: Update button.tsx**

```typescript
// apps/web/components/ui/button.tsx
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
        'inline-flex items-center justify-center font-medium transition-all rounded-[10px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'gradient-primary text-white hover:opacity-90',
        variant === 'secondary' && [
          'bg-surface-container text-on-surface hover:bg-surface-container-highest',
          'border border-border-subtle',
        ],
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

- [ ] **Step 2: Update input.tsx**

```typescript
// apps/web/components/ui/input.tsx
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

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
        id={id}
        ref={ref}
        className={cn(
          'w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-xl',
          'border border-border-subtle',
          'outline-none focus:ring-2 focus:ring-primary/30',
          'placeholder:text-on-surface-muted/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 3: Update badge.tsx**

```typescript
// apps/web/components/ui/badge.tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const VARIANT_STYLES = {
  default:  'bg-surface-container text-on-surface-muted',
  success:  'bg-success/15 text-success',
  warning:  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  error:    'bg-error/15 text-error',
  muted:    'bg-on-surface-muted/10 text-on-surface-muted',
  primary:  'bg-primary/15 text-primary',
} as const

const STATUS_VARIANT: Record<string, keyof typeof VARIANT_STYLES> = {
  saved:        'muted',
  applied:      'primary',
  oa:           'primary',
  interviewing: 'primary',
  offer:        'success',
  rejected:     'error',
  internship:   'primary',
  new_grad:     'primary',
  full_time:    'success',
}

interface BadgeProps {
  children: ReactNode
  status?: string
  variant?: keyof typeof VARIANT_STYLES
  className?: string
}

export function Badge({ children, status, variant, className }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? (STATUS_VARIANT[status] ?? 'muted') : 'default')
  return (
    <span className={cn('label-sm px-2 py-0.5 rounded-full', VARIANT_STYLES[resolvedVariant], className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Update card.tsx**

```typescript
// apps/web/components/ui/card.tsx
import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface-card rounded-card shadow-card border border-border-subtle',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold font-display text-on-surface', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-on-surface-muted', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'
```

- [ ] **Step 5: Create select.tsx**

```typescript
// apps/web/components/ui/select.tsx
import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block label-sm text-on-surface-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          'w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-xl',
          'border border-border-subtle',
          'outline-none focus:ring-2 focus:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'appearance-none',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
)
Select.displayName = 'Select'
```

- [ ] **Step 6: Verify TypeScript happy**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in the modified files.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/ui/
git commit -m "feat(03): update base UI components to Cognitive Workspace tokens"
```

---

### Task 5: Create Avatar, Separator, StatCard

**Files:**
- Create: `apps/web/components/ui/avatar.tsx`
- Create: `apps/web/components/ui/separator.tsx`
- Create: `apps/web/components/ui/stat-card.tsx`

- [ ] **Step 1: Create avatar.tsx**

```typescript
// apps/web/components/ui/avatar.tsx
import { cn } from '@/lib/utils'

interface AvatarProps {
  email?: string | null
  fullName?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(email?: string | null, fullName?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function Avatar({ email, fullName, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0 select-none',
        SIZE_CLASSES[size],
        className
      )}
    >
      {getInitials(email, fullName)}
    </div>
  )
}
```

- [ ] **Step 2: Create separator.tsx**

```typescript
// apps/web/components/ui/separator.tsx
import { cn } from '@/lib/utils'

interface SeparatorProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ className, orientation = 'horizontal' }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'bg-border-subtle',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className
      )}
    />
  )
}
```

- [ ] **Step 3: Create stat-card.tsx**

```typescript
// apps/web/components/ui/stat-card.tsx
'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  iconClassName?: string
  delta?: string
  deltaPositive?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  delta,
  deltaPositive,
  className,
}: StatCardProps) {
  const numValue = typeof value === 'number' ? value : null
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (numValue === null || !ref.current) return
    const controls = animate(0, numValue, {
      duration: 0.8,
      type: 'spring',
      stiffness: 60,
      damping: 20,
      onUpdate(val) {
        if (ref.current) ref.current.textContent = String(Math.round(val))
      },
    })
    return controls.stop
  }, [numValue])

  return (
    <div
      className={cn(
        'bg-surface-card rounded-card shadow-card border border-border-subtle p-5 flex flex-col gap-3',
        className
      )}
    >
      {icon && (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconClassName ?? 'bg-primary/10 text-primary')}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold font-display text-on-surface">
          {numValue !== null ? <span ref={ref}>0</span> : value}
        </p>
        <p className="text-xs text-on-surface-muted mt-0.5">{label}</p>
      </div>
      {delta && (
        <p className={cn('text-xs font-medium', deltaPositive ? 'text-success' : 'text-error')}>
          {delta}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/ui/avatar.tsx apps/web/components/ui/separator.tsx apps/web/components/ui/stat-card.tsx
git commit -m "feat(03): add Avatar, Separator, StatCard components"
```

---

### Task 6: Sidebar overhaul

**Files:**
- Modify: `apps/web/components/layout/Sidebar.tsx`

Changes:
- `w-52` → `w-48`
- Static `<span>` active pill → `motion.span` with `layoutId="sidebar-active-pill"`
- Bottom: remove "New Application" CTA button
- Bottom: add Avatar chip (Avatar + truncated email)
- Keep theme toggle and sign out

- [ ] **Step 1: Write the new Sidebar.tsx**

```typescript
// apps/web/components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Calendar,
  BarChart2,
  User,
  Users,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Avatar } from '@/components/ui/avatar'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/jobs',         label: 'Jobs',         icon: Briefcase       },
  { href: '/applications', label: 'Applications', icon: FileText        },
  { href: '/calendar',     label: 'Calendar',     icon: Calendar        },
  { href: '/insights',     label: 'Insights',     icon: BarChart2       },
  { href: '/profile',      label: 'Profile',      icon: User            },
  { href: '/profiles',     label: 'App Profiles', icon: Users           },
]

interface Props {
  userEmail?: string | null
}

export function Sidebar({ userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-48 shrink-0 flex flex-col bg-surface-container min-h-screen px-3 py-5 gap-1">
      {/* Logo */}
      <div className="px-3 mb-6 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full gradient-primary shrink-0" />
        <span className="text-lg font-bold font-display text-on-surface tracking-tight">
          Auto<span className="text-primary">Apply</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <div key={item.href} className="relative">
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors',
                  active
                    ? 'bg-surface-container-highest text-on-surface font-medium'
                    : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container-highest/50'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="h-px bg-border-subtle my-2" />

      {/* Bottom: Avatar chip + theme toggle + sign out */}
      <div className="space-y-1 pt-1">
        {userEmail && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <Avatar email={userEmail} size="sm" />
            <p className="text-xs text-on-surface-muted truncate">{userEmail}</p>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-muted hover:text-on-surface transition-colors rounded-xl"
        >
          <span className="transition-transform duration-300" style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-muted hover:text-error transition-colors rounded-xl"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i sidebar
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify sidebar renders**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm:
- Sidebar is narrower (w-48)
- Geist font on "AutoApply" wordmark
- Avatar chip visible at bottom with user's email initial
- "New Application" button is gone from sidebar
- Active nav item has left pill indicator

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/layout/Sidebar.tsx
git commit -m "feat(03): sidebar overhaul — w-48, motion pill, Avatar chip"
```

---

## PHASE B: PAGES

> **Note on Stitch designs:** If the user has sketched the dashboard, profile, or profiles pages in Stitch and exported to Figma, use the `mcp__plugin_figma_figma__get_design_context` tool with the Figma frame nodeId to get the design reference before implementing those pages. The spec below is sufficient to implement without Stitch — Stitch designs, if available, take priority.

---

### Task 7: Dashboard page redesign

**Files:**
- Create: `apps/web/components/dashboard/Greeting.tsx`
- Modify: `apps/web/app/(dashboard)/page.tsx`

The dashboard moves from "PipelineKanban as the main view" to "command center with stat cards, recent applications feed, and profile readiness". PipelineKanban stays on `/applications`.

- [ ] **Step 1: Create Greeting client component**

```typescript
// apps/web/components/dashboard/Greeting.tsx
'use client'

interface Props {
  firstName: string
}

export function Greeting({ firstName }: Props) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return (
    <div>
      <h1 className="text-[30px] font-bold font-display text-on-surface leading-tight">
        {greeting}, {firstName}
      </h1>
      <p className="text-sm text-on-surface-muted mt-1">{dateStr}</p>
    </div>
  )
}
```

- [ ] **Step 2: Write the new dashboard page**

```typescript
// apps/web/app/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, Clock, Trophy, Zap, ChevronRight, Plug } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Greeting } from '@/components/dashboard/Greeting'
import type { ApplicationWithJob } from '@/lib/types'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const BASE_FIELDS = [
  'first_name', 'last_name', 'linkedin_url', 'github_url', 'portfolio_url',
  'date_of_birth', 'open_to_relocation', 'work_arrangement', 'available_from',
] as const

function computeReadinessPct(base: Record<string, unknown>, hasRegional: boolean): number {
  const filled = BASE_FIELDS.filter(f => base[f] !== null && base[f] !== undefined && base[f] !== '').length
  const total = BASE_FIELDS.length + 1 // +1 for regional
  return Math.round(((filled + (hasRegional ? 1 : 0)) / total) * 100)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [appsRes, baseRes, regionalRes] = await Promise.all([
    supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .eq('user_id', user!.id)
      .order('last_activity_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
    supabase.from('user_regional_identities').select('id').eq('user_id', user!.id).limit(1),
  ])

  const applications = (appsRes.data ?? []) as ApplicationWithJob[]
  const base = (baseRes.data ?? {}) as Record<string, unknown>
  const hasRegional = (regionalRes.data ?? []).length > 0
  const readinessPct = computeReadinessPct(base, hasRegional)

  const total = applications.length
  const thisWeek = applications.filter(a => a.applied_at && a.applied_at >= oneWeekAgo).length
  const advanced = applications.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
  const successRate = total > 0 ? Math.round((advanced / total) * 100) : 0
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there'
  const recentApps = applications.slice(0, 8)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Greeting firstName={firstName} />
        <Link href="/applications/new">
          <Button variant="primary" size="md">New Application</Button>
        </Link>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={total}
          icon={<Briefcase size={18} />}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Applied This Week"
          value={thisWeek}
          icon={<Clock size={18} />}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label="Progressed Rate"
          value={total > 0 ? `${successRate}%` : '—'}
          icon={<Trophy size={18} />}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          label="Extension"
          value="Install"
          icon={<Plug size={18} />}
          iconClassName="bg-on-surface-muted/10 text-on-surface-muted"
        />
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Recent Applications feed (2/3) */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-base font-semibold font-display text-on-surface">Recent Applications</h2>
          {recentApps.length === 0 ? (
            <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-10 text-center">
              <p className="text-on-surface-muted text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="bg-surface-card rounded-card border border-border-subtle shadow-card divide-y divide-border-subtle overflow-hidden">
              {recentApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {app.job?.company ?? 'Unknown Company'}
                    </p>
                    <p className="text-xs text-on-surface-muted truncate mt-0.5">
                      {app.job?.title ?? 'Unknown Role'}
                    </p>
                  </div>
                  <Badge status={app.status}>{app.status}</Badge>
                  <span className="text-xs text-on-surface-muted shrink-0 w-16 text-right">
                    {app.applied_at ? timeAgo(app.applied_at) : '—'}
                  </span>
                  <ChevronRight size={14} className="text-on-surface-muted/40 group-hover:text-on-surface-muted transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Profile readiness + Extension status (1/3) */}
        <div className="space-y-4">
          {/* Profile Readiness */}
          <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold font-display text-on-surface">Profile Readiness</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-muted">Completion</span>
                <span className="text-sm font-bold text-on-surface">{readinessPct}%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${readinessPct}%` }}
                />
              </div>
              {readinessPct < 100 && (
                <p className="text-xs text-on-surface-muted pt-1">
                  Complete your profile to enable full auto-fill.
                </p>
              )}
            </div>
            <Link href="/profile">
              <Button variant="secondary" size="sm" className="w-full">
                {readinessPct === 100 ? 'View Profile' : 'Complete Profile'}
              </Button>
            </Link>
          </div>

          {/* Extension status */}
          <div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display text-on-surface">Extension</h3>
              <Badge variant="muted">Manual check</Badge>
            </div>
            <p className="text-xs text-on-surface-muted">
              Install the AutoApply Chrome extension to start auto-filling job applications.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Get Extension
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Check:
- Greeting with user's first name and today's date
- 4 stat cards in a row
- Two-column layout with applications feed and sidebar widgets
- No PipelineKanban on the dashboard

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/dashboard/Greeting.tsx apps/web/app/(dashboard)/page.tsx
git commit -m "feat(03): dashboard redesign — greeting, StatCards, 2-col feed"
```

---

### Task 8: Profile page visual redesign

**Files:**
- Modify: `apps/web/app/(dashboard)/profile/page.tsx`

Wrap the existing form components in Card containers with proper section headers. The data fetching and form logic is unchanged.

- [ ] **Step 1: Update profile/page.tsx**

```typescript
// apps/web/app/(dashboard)/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
import { redirect } from 'next/navigation'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, regionalRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('user_regional_identities')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }),
  ])

  const baseIdentity = profileRes.data ?? {}
  const regional = regionalRes.data ?? []

  const hasName = !!(baseIdentity as { first_name?: string | null }).first_name
  const hasRegional = regional.length > 0
  const ready = hasName && hasRegional

  const missingItems = [
    !hasName && 'your first name',
    !hasRegional && 'at least one regional identity',
  ].filter(Boolean) as string[]

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-4 py-8">
      {/* Readiness banner */}
      {ready ? (
        <div className="flex items-center gap-3 rounded-card border border-success/20 bg-success/8 px-4 py-3">
          <CheckCircle size={16} className="text-success shrink-0" />
          <p className="text-sm text-success font-medium">
            Profile complete — the extension can auto-fill applications.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-card border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Profile incomplete</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Add {missingItems.join(' and ')} to enable auto-fill.
            </p>
          </div>
        </div>
      )}

      {/* Base Identity card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Base Identity</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Personal details, online presence, and logistics
          </p>
        </div>
        <div className="p-6">
          <BaseIdentityForm initial={baseIdentity} />
        </div>
      </div>

      {/* Regional Identities card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Regional Identities</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Country-specific contact, work authorization, and compensation
          </p>
        </div>
        <div className="p-6">
          <RegionalIdentityList initial={regional} />
        </div>
      </div>

      {/* Application Profile card */}
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold font-display text-on-surface">Fill Preferences</h2>
          <p className="text-xs text-on-surface-muted mt-0.5">
            EEO, background check, and other application defaults
          </p>
        </div>
        <div className="p-6">
          <ProfileForm initialProfile={profileRes.data ?? {}} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders without breaking forms**

```bash
npm run dev
```

Open `http://localhost:3000/profile`. Check:
- Readiness banner visible with correct state
- Each section in a card with header
- Forms work (auto-save on blur still fires)

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/profile/page.tsx
git commit -m "feat(03): profile page — card wrappers + styled readiness banner"
```

---

### Task 9: Application Profiles grid redesign

**Files:**
- Modify: `apps/web/app/(dashboard)/profiles/page.tsx`

Add ghost "New Profile" card at the end of the grid. Update page header to use new font tokens.

- [ ] **Step 1: Update profiles/page.tsx**

```typescript
// apps/web/app/(dashboard)/profiles/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileListClient } from '@/components/profiles/ProfileListClient'
import type { ApplicationProfile } from '@/lib/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ApplicationProfilesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('application_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  const profileList: ApplicationProfile[] = profiles ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">
            Application Profiles
          </h1>
          <p className="text-sm text-on-surface-muted mt-1">
            Role-specific profiles for auto-filling ATS applications.
          </p>
        </div>
        <Link href="/profiles/new">
          <Button variant="primary" size="md">New Profile</Button>
        </Link>
      </div>

      {profileList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-card border-2 border-dashed border-border-subtle flex items-center justify-center mb-4">
            <Plus size={20} className="text-on-surface-muted/40" />
          </div>
          <h2 className="text-lg font-semibold font-display text-on-surface mb-2">
            No profiles yet
          </h2>
          <p className="text-sm text-on-surface-muted max-w-sm mb-6">
            Create your first application profile to start auto-filling. Upload a resume to get started.
          </p>
          <Link href="/profiles/new">
            <Button variant="primary" size="md">Create Profile</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <ProfileListClient profiles={profileList} />

          {/* Ghost "New Profile" card */}
          <Link
            href="/profiles/new"
            className="rounded-card border-2 border-dashed border-border-subtle hover:border-primary/30 hover:bg-primary/5 transition-colors p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-on-surface-muted/20 group-hover:border-primary/40 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-on-surface-muted/40 group-hover:text-primary/60 transition-colors" />
            </div>
            <span className="text-sm font-medium text-on-surface-muted group-hover:text-on-surface transition-colors">
              New Profile
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/profiles`. Check:
- Grid layout present
- Ghost "New Profile" card at end of grid (if profiles exist)
- Page header uses Geist font

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/profiles/page.tsx
git commit -m "feat(03): profiles grid — ghost new card, font-display header"
```

---

### Task 10: Login split layout

**Files:**
- Create: `apps/web/components/auth/SignInButton.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`

The login page gets a full 60/40 split. Extract the OAuth call to a `SignInButton` client component so the page shell can be a server component.

- [ ] **Step 1: Create SignInButton.tsx**

```typescript
// apps/web/components/auth/SignInButton.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function SignInButton() {
  async function signInWithGoogle() {
    const supabase = createClient()
    const source = new URLSearchParams(window.location.search).get('source')
    const redirectTo =
      source === 'extension'
        ? `${window.location.origin}/api/auth/callback?source=extension`
        : `${window.location.origin}/api/auth/callback`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar',
        ].join(' '),
      },
    })
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="w-full h-11 rounded-[10px] bg-white text-[#1a1a1a] text-sm font-medium border border-border-subtle shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  )
}
```

- [ ] **Step 2: Rewrite login/page.tsx as server component**

```typescript
// apps/web/app/(auth)/login/page.tsx
import { CheckCircle } from 'lucide-react'
import { SignInButton } from '@/components/auth/SignInButton'

const VALUE_PROPS = [
  'Auto-fill any ATS form in one click',
  'Track every application in one dashboard',
  'AI-powered interview prep and insights',
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — 60% — dark hero */}
      <div className="hidden lg:flex w-3/5 flex-col bg-surface-container min-h-screen px-12 py-10 relative overflow-hidden">
        {/* Wordmark */}
        <div className="text-xl font-bold font-display text-on-surface">
          Auto<span className="text-primary">Apply</span>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-[48px] font-bold font-display text-on-surface leading-[1.1] mb-8 text-balance">
            Apply once.<br />Apply everywhere.
          </h1>
          <ul className="space-y-4">
            {VALUE_PROPS.map(item => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-success shrink-0" />
                <span className="text-sm text-on-surface-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      </div>

      {/* Right panel — 40% — auth */}
      <div className="flex-1 flex items-center justify-center bg-surface-card px-8 min-h-screen">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile wordmark */}
          <div className="lg:hidden text-xl font-bold font-display text-on-surface">
            Auto<span className="text-primary">Apply</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-on-surface">Sign in</h2>
            <p className="text-sm text-on-surface-muted mt-1">Continue to AutoApply OS</p>
          </div>

          <SignInButton />

          <p className="text-xs text-on-surface-muted text-center leading-relaxed">
            We read your Gmail to detect OA invites, interviews, and rejections.
            We never send emails on your behalf.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify login page**

```bash
npm run dev
```

Open `http://localhost:3000/login`. Check:
- Split layout on wide screen (lg+)
- Left panel shows wordmark, headline, value props
- Right panel shows sign-in button
- Google OAuth button works (triggers auth flow)

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/auth/SignInButton.tsx apps/web/app/(auth)/login/page.tsx
git commit -m "feat(03): login page — 60/40 split layout"
```

---

### Task 11: Applications page polish + polish pages (Jobs, Insights, Calendar)

**Files:**
- Modify: `apps/web/app/(dashboard)/applications/page.tsx`
- Modify: `apps/web/app/(dashboard)/jobs/page.tsx`
- Modify: `apps/web/app/(dashboard)/insights/page.tsx`
- Modify: `apps/web/app/(dashboard)/calendar/page.tsx`

Layout polish only — update page headers to use `font-display`, wrap existing content with the new Card tokens where applicable. No structural changes.

- [ ] **Step 1: Update applications/page.tsx header**

Change the header `div` block (lines 35-41 of current file) to use `font-display`:
```typescript
// In the return JSX, replace:
<h1 className="text-2xl font-semibold text-on-surface">Applications</h1>
// with:
<h1 className="text-2xl font-bold font-display text-on-surface">Applications</h1>
```

Also update the empty state styling:
```typescript
// Replace empty state div:
<div className="py-20 text-center">
  <p className="text-on-surface-muted/50 text-sm">No applications yet</p>
  <p className="text-sm text-on-surface-muted mt-3">Apply to jobs from the Job Feed to start tracking.</p>
</div>
```

- [ ] **Step 2: Update jobs/page.tsx header**

```typescript
// In jobs/page.tsx, update the h1:
<h1 className="text-2xl font-bold font-display text-on-surface">Job Feed</h1>
```

- [ ] **Step 3: Update insights/page.tsx — apply card tokens and font-display**

In insights/page.tsx:
1. Change `<h1 className="text-2xl font-bold text-on-surface">` → add `font-display`
2. Change all `rounded-2xl` stat cards to use `rounded-card shadow-card border border-border-subtle`
3. Change funnel and breakdown containers similarly

Replace every occurrence of `className="bg-surface-card rounded-2xl p-5 shadow-ambient flex flex-col gap-3"` with `className="bg-surface-card rounded-card shadow-card border border-border-subtle p-5 flex flex-col gap-3"`.

Replace every occurrence of `className="bg-surface-card rounded-2xl p-6 shadow-ambient"` with `className="bg-surface-card rounded-card shadow-card border border-border-subtle p-6"`.

- [ ] **Step 4: Update calendar/page.tsx — wrap in card**

```typescript
// apps/web/app/(dashboard)/calendar/page.tsx
export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-on-surface">Calendar</h1>
        <p className="text-sm text-on-surface-muted mt-1">Interview schedules and deadlines</p>
      </div>
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <p className="text-[3.5rem] font-light text-on-surface-muted/20 tracking-[-0.02em] select-none">▦</p>
        <h2 className="text-xl font-semibold font-display text-on-surface mt-4">Coming in Phase 2B</h2>
        <p className="text-sm text-on-surface-muted mt-2 max-w-sm">
          Connect Gmail to auto-extract interview schedules and deadlines.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify all pages render**

```bash
npm run dev
```

Visit `/applications`, `/jobs`, `/insights`, `/calendar`. Confirm:
- Page headers use Geist font (visually heavier, geometric)
- Cards use new shadow-card + border-subtle styling
- No broken layouts

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/applications/page.tsx apps/web/app/(dashboard)/jobs/page.tsx apps/web/app/(dashboard)/insights/page.tsx apps/web/app/(dashboard)/calendar/page.tsx
git commit -m "feat(03): polish pages — font-display headers, card token updates"
```

---

## PHASE C: MOTION PASS

---

### Task 12: Page transitions + stagger list + card hover

**Files:**
- Modify: `apps/web/app/(dashboard)/layout.tsx`
- Modify: `apps/web/app/(dashboard)/page.tsx` (stagger the recent applications list)

Motion rules from the spec:
- Page transition: `opacity` 0→1 + `y` 8→0, 200ms ease-out
- Card hover: `scale` 1→1.01 + shadow lift, 150ms ease-out
- Staggered lists: fade-up, 40ms stagger, 180ms per item
- Sidebar active pill: already done in Task 6

- [ ] **Step 1: Add page transition wrapper to dashboard layout**

```typescript
// apps/web/app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PageTransition } from '@/components/providers/PageTransition'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar userEmail={user?.email} />
        <main className="flex-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Create PageTransition component**

```typescript
// apps/web/components/providers/PageTransition.tsx
'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Add stagger animation to the Recent Applications list in dashboard**

In `apps/web/app/(dashboard)/page.tsx`, the recent applications list is server-rendered. Create a client wrapper for staggered list animation.

Create `apps/web/components/dashboard/StaggerFeed.tsx`:
```typescript
// apps/web/components/dashboard/StaggerFeed.tsx
'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode[]
}

export function StaggerFeed({ children }: Props) {
  return (
    <>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.04, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}
```

Then in `page.tsx`, wrap the map of `recentApps` links in `<StaggerFeed>`. Since `StaggerFeed` is a client component, the individual Link items passed as children will still be React elements — this works correctly:

```typescript
// In page.tsx, replace the recentApps.map() block:
import { StaggerFeed } from '@/components/dashboard/StaggerFeed'

// In JSX, replace:
<div className="bg-surface-card rounded-card border border-border-subtle shadow-card divide-y divide-border-subtle overflow-hidden">
  {recentApps.map((app) => (
    <Link key={app.id} ...>...</Link>
  ))}
</div>

// With (note: wrapping each Link in a div for StaggerFeed):
<div className="bg-surface-card rounded-card border border-border-subtle shadow-card divide-y divide-border-subtle overflow-hidden">
  <StaggerFeed>
    {recentApps.map((app) => (
      <Link
        key={app.id}
        href={`/applications/${app.id}`}
        className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {app.job?.company ?? 'Unknown Company'}
          </p>
          <p className="text-xs text-on-surface-muted truncate mt-0.5">
            {app.job?.title ?? 'Unknown Role'}
          </p>
        </div>
        <Badge status={app.status}>{app.status}</Badge>
        <span className="text-xs text-on-surface-muted shrink-0 w-16 text-right">
          {app.applied_at ? timeAgo(app.applied_at) : '—'}
        </span>
        <ChevronRight size={14} className="text-on-surface-muted/40 group-hover:text-on-surface-muted transition-colors shrink-0" />
      </Link>
    ))}
  </StaggerFeed>
</div>
```

Note: `StaggerFeed` receives an array of Link elements as children. Since Link is a valid ReactNode, this works.

- [ ] **Step 4: Add card hover scale to profiles grid (in ProfileListClient)**

In `apps/web/components/profiles/ProfileListClient.tsx`, wrap each card in a motion.div:

```typescript
// Wrap each profile card:
import { motion } from 'framer-motion'

// In the map:
<motion.div
  key={profile.id}
  whileHover={{ scale: 1.01 }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
>
  {/* existing profile card content */}
</motion.div>
```

Read `ProfileListClient.tsx` first and apply this pattern to each card in the grid.

- [ ] **Step 5: Verify motion works**

```bash
npm run dev
```

Test:
- Navigate between pages: each page fades in with a slight upward drift
- Dashboard's recent applications list: items fade in with stagger
- Sidebar nav item click: pill animates to new position (spring)
- StatCards: counters animate from 0 on mount

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/providers/PageTransition.tsx apps/web/components/dashboard/StaggerFeed.tsx apps/web/app/(dashboard)/layout.tsx apps/web/app/(dashboard)/page.tsx apps/web/components/profiles/ProfileListClient.tsx
git commit -m "feat(03): motion pass — page transitions, stagger feed, card hover"
```

---

## PHASE D: DEPLOY

---

### Task 13: Vercel preview deploy

**Files:**
- No code changes — deploy and review

- [ ] **Step 1: Run full build locally**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds (exit 0). Fix any TypeScript or import errors before deploying.

- [ ] **Step 2: Run tests**

```bash
npm run test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 3: Deploy to Vercel (if Vercel MCP is connected)**

Use the `mcp__claude_ai_Vercel__deploy_to_vercel` tool with the project settings, or push the branch and let Vercel auto-deploy.

Alternatively, push branch and open the Vercel dashboard to get the preview URL.

- [ ] **Step 4: Visual review checklist**

Open the preview URL and verify:
- [ ] Geist font renders on all headings (heavier, geometric compared to Manrope)
- [ ] Dark mode toggle works (sidebar bottom button)
- [ ] System color mode respected on first visit (no flash)
- [ ] Stat cards on dashboard animate from 0 on mount
- [ ] Sidebar pill animates between nav items
- [ ] Page transitions visible (subtle fade + drift)
- [ ] Login split layout renders on wide screen
- [ ] Profile page cards look polished with banner
- [ ] Profiles grid shows ghost "New Profile" card
- [ ] All existing functionality still works (forms save, OAuth flow, etc.)

- [ ] **Step 5: Address visual review findings**

Fix any issues found during review. Commit fixes with:
```bash
git commit -m "fix(03): visual review adjustments"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Geist + Inter typography | T2 |
| Token additions (radius-card, border-subtle, shadow-card) | T3 |
| Button, Input, Select, Badge, Card components | T4 |
| Avatar, Separator, StatCard | T5 |
| Sidebar w-48, layoutId pill, Avatar chip, no CTA | T6 |
| Dashboard: greeting, stat row, 2-col feed+readiness | T7 |
| Profile: readiness banner, Card wrappers | T8 |
| Profiles: grid with ghost card | T9 |
| Login: 60/40 split | T10 |
| Applications, Jobs, Insights, Calendar: polish | T11 |
| Page transitions, stagger lists, card hover | T12 |
| Framer Motion stat counters | T5 (StatCard) |
| System preference drives dark/light mode | Pre-existing (`data-theme` script) ✓ |
| User override via sidebar toggle | Pre-existing (ThemeProvider) ✓ |
| 21st.dev Magic MCP for component generation | Optional enhancement — executor can use `mcp__magic__21st_magic_component_builder` for any component task to generate a starting point from a prompt, then adapt to existing tokens |
| Motion AI Kit MCP for Framer Motion docs | Optional — use if Framer Motion API questions arise during T12 |
| Stitch/Figma MCP for page designs | Optional — if user creates Stitch designs, use `mcp__plugin_figma_figma__get_design_context` before implementing T7-T9 |
| Vercel deploy preview | T13 |

All spec requirements covered.
