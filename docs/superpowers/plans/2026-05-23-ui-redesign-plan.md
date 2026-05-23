# AutoApply OS UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire visual layer of AutoApply OS with the Stitch design system — dark-by-default, new token set, new shell (220px sidebar + sticky top header), and 8 redesigned pages — while preserving all business logic intact.

**Architecture:** Token system overhaul in `globals.css` + `tailwind.config.ts` first (structural foundation), then shell components, then pages top-to-bottom, then UX enhancement layer last. Each task is independently committable. No API routes, Supabase queries, or business logic changes.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS v3, Framer Motion, Material Symbols Outlined (replacing lucide-react in layout components)

---

## File Map

**Modified:**
- `autoapply/apps/web/app/globals.css` — complete CSS var replacement (dark default, light overrides)
- `autoapply/apps/web/tailwind.config.ts` — full Stitch token map, new radius/spacing
- `autoapply/apps/web/app/layout.tsx` — add Material Symbols font link, force-dark hydration script
- `autoapply/apps/web/components/providers/ThemeProvider.tsx` — default state 'dark'
- `autoapply/apps/web/components/layout/Sidebar.tsx` — 220px, Material Symbols, new active state, CTA
- `autoapply/apps/web/app/(dashboard)/layout.tsx` — add TopHeader, new shell div structure
- `autoapply/apps/web/app/(dashboard)/page.tsx` — 4-stat row, 8/4 grid, activity log
- `autoapply/apps/web/app/(dashboard)/jobs/page.tsx` — masonry columns, FAB
- `autoapply/apps/web/components/jobs/JobCard.tsx` — Stitch card style, border-glow-hover
- `autoapply/apps/web/app/(dashboard)/applications/page.tsx` — Stitch tokens throughout
- `autoapply/apps/web/components/applications/ApplicationKanban.tsx` — Stitch token classNames
- `autoapply/apps/web/app/(dashboard)/calendar/page.tsx` — real 7-col CSS grid calendar
- `autoapply/apps/web/app/(dashboard)/insights/page.tsx` — Stitch token classNames
- `autoapply/apps/web/app/(dashboard)/profile/page.tsx` — Stitch card classNames
- `autoapply/apps/web/app/(dashboard)/profiles/page.tsx` — border-beam on active cards
- `autoapply/apps/web/components/profiles/ProfileCard.tsx` — border-beam active state
- `autoapply/apps/web/app/(auth)/login/page.tsx` — reskin with new tokens

**Created:**
- `autoapply/apps/web/components/layout/TopHeader.tsx` — sticky header: search, sync, theme toggle, avatar
- `autoapply/apps/web/components/ui/mat-icon.tsx` — thin wrapper: `<span className="material-symbols-outlined">`

---

## Task 1: Token Foundation — globals.css + tailwind.config.ts

**Files:**
- Modify: `autoapply/apps/web/app/globals.css`
- Modify: `autoapply/apps/web/tailwind.config.ts`

- [ ] **Step 1: Replace globals.css**

Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ── Dark tokens (default — no selector needed) ── */
  :root {
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

    --primary:                   #a4c8ff;
    --primary-container:         #4d9fff;
    --primary-fixed:             #d4e3ff;
    --primary-fixed-dim:         #a4c8ff;
    --on-primary:                #00315d;
    --on-primary-container:      #003564;
    --inverse-primary:           #005fad;

    --electric-indigo:           #6366f1;
    --deep-violet:               #a855f7;

    --secondary:                 #c0c1ff;
    --secondary-container:       #3131c0;
    --on-secondary:              #1000a9;
    --on-secondary-container:    #b0b2ff;

    --tertiary:                  #ddb7ff;
    --tertiary-container:        #c07fff;
    --on-tertiary:               #490080;

    --on-surface:                #dee3ea;
    --on-surface-variant:        #c0c7d4;
    --outline:                   #8b919e;
    --outline-variant:           #414752;

    --success-vibrant:           #22c55e;
    --error-vibrant:             #ef4444;
    --warning-vibrant:           #f59e0b;
    --error:                     #ffb4ab;

    --inverse-surface:           #dee3ea;
    --inverse-on-surface:        #2c3136;

    --border-glow:               rgba(99, 102, 241, 0.4);
    --border-whisper:            rgba(255, 255, 255, 0.05);

    --shadow-card: 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15);

    /* backward-compat aliases consumed by old components */
    --surface:                   var(--background);
    --surface-container-highest-old: var(--surface-container-highest);
    --on-surface-muted:          var(--on-surface-variant);
    --primary-dim:               var(--primary-container);
    --success:                   var(--success-vibrant);
    --border-subtle:             var(--border-whisper);
    --font-display:              var(--font-geist-sans);
  }

  /* ── Light tokens ── */
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

    /* backward-compat aliases */
    --surface:                   var(--background);
    --on-surface-muted:          var(--on-surface-variant);
    --primary-dim:               var(--primary-container);
    --success:                   var(--success-vibrant);
    --border-subtle:             var(--border-whisper);
  }

  body {
    font-family: var(--font-body);
    background-color: var(--background);
    color: var(--on-surface);
    font-size: 0.875rem;
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  * { border-color: transparent; }
  h1, h2, h3 { font-family: var(--font-geist-sans, var(--font-display, inherit)); }
}

@layer utilities {
  .text-balance { text-wrap: balance; }

  .label-sm {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Glass morphism */
  .glass {
    background: rgba(30, 39, 46, 0.7);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  [data-theme="light"] .glass {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(42, 52, 57, 0.1);
  }

  /* Mesh gradient overlays */
  .mesh-gradient {
    background-image: radial-gradient(at top right, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
  }
  .mesh-gradient-card {
    background-image: radial-gradient(at top right, rgba(99, 102, 241, 0.02) 0%, transparent 60%);
  }

  /* Border glow on hover */
  .border-glow-hover:hover {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.5) !important;
  }

  /* Ambient shadow */
  .shadow-ambient { box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2); }
  [data-theme="light"] .shadow-ambient { box-shadow: 0 12px 40px rgba(42, 52, 57, 0.06); }

  /* Gradient primary */
  .gradient-primary { background: linear-gradient(135deg, var(--primary-container), var(--electric-indigo)); }
}

/* Border beam animation (active/featured cards) */
@keyframes beam {
  0%   { background-position: -100% 0; }
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
[data-theme="light"] ::-webkit-scrollbar-thumb { background: #c3c6d7; }

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
html { scroll-behavior: smooth; }
```

- [ ] **Step 2: Replace tailwind.config.ts**

Replace the entire file with:

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
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface-container)',
          abyss: 'var(--surface-abyss)',
          card: 'var(--surface-card)',
          variant: 'var(--surface-variant)',
          bright: 'var(--surface-bright)',
          container: 'var(--surface-container)',
          'container-low': 'var(--surface-container-low)',
          'container-high': 'var(--surface-container-high)',
          'container-highest': 'var(--surface-container-highest)',
          'container-lowest': 'var(--surface-container-lowest)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: 'var(--primary-fixed)',
          'fixed-dim': 'var(--primary-fixed-dim)',
          dim: 'var(--primary-container)',
        },
        'electric-indigo': 'var(--electric-indigo)',
        'deep-violet': 'var(--deep-violet)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
          muted: 'var(--on-surface-variant)',
        },
        'on-primary': 'var(--on-primary)',
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        'success-vibrant': 'var(--success-vibrant)',
        'error-vibrant': 'var(--error-vibrant)',
        'warning-vibrant': 'var(--warning-vibrant)',
        // backward-compat aliases
        success: 'var(--success-vibrant)',
        error: 'var(--error-vibrant)',
        'border-glow': 'var(--border-glow)',
        'border-subtle': 'var(--border-whisper)',
        'border-whisper': 'var(--border-whisper)',
      },
      fontFamily: {
        display: ['var(--font-geist-sans)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',     // 8px — cards
        '2xl': '0.75rem', // 12px — pills
        card: '0.5rem',   // alias for xl
        full: '9999px',
      },
      spacing: {
        'sidebar': '220px',
      },
      boxShadow: {
        ambient: '0 12px 40px rgba(0,0,0,0.2)',
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

- [ ] **Step 3: Commit**

```bash
cd /Users/divyaanshseth/Downloads/AutoApply_Test
git add autoapply/apps/web/app/globals.css autoapply/apps/web/tailwind.config.ts
git commit -m "feat(03): token foundation — dark-default CSS vars, Stitch Tailwind config"
```

---

## Task 2: Root Layout — Material Symbols Font + Dark Default

**Files:**
- Modify: `autoapply/apps/web/app/layout.tsx`
- Create: `autoapply/apps/web/components/ui/mat-icon.tsx`

- [ ] **Step 1: Update app/layout.tsx**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'AutoApply',
  description: 'Your job application operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${inter.variable}`}>
      <head>
        {/* Force dark by default; respect stored preference */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()` }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create components/ui/mat-icon.tsx**

```tsx
import { cn } from '@/lib/utils'

interface Props {
  children: string
  className?: string
  filled?: boolean
  size?: number
}

export function MatIcon({ children, className, filled = false, size = 20 }: Props) {
  return (
    <span
      className={cn('material-symbols-outlined select-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/app/layout.tsx autoapply/apps/web/components/ui/mat-icon.tsx
git commit -m "feat(03): root layout — Material Symbols font, dark-default hydration script"
```

---

## Task 3: ThemeProvider — Default to Dark

**Files:**
- Modify: `autoapply/apps/web/components/providers/ThemeProvider.tsx`

- [ ] **Step 1: Update default state to 'dark'**

Replace the entire file with:

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const resolved = stored ?? 'dark'
    setThemeState(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/components/providers/ThemeProvider.tsx
git commit -m "feat(03): ThemeProvider defaults to dark"
```

---

## Task 4: Sidebar Redesign

**Files:**
- Modify: `autoapply/apps/web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace Sidebar.tsx**

Replace the entire file with:

```tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { MatIcon } from '@/components/ui/mat-icon'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: 'dashboard'      },
  { href: '/jobs',         label: 'Jobs',         icon: 'work'           },
  { href: '/applications', label: 'Applications', icon: 'send'           },
  { href: '/calendar',     label: 'Calendar',     icon: 'calendar_today' },
  { href: '/insights',     label: 'Insights',     icon: 'insights'       },
  { href: '/profile',      label: 'Profile',      icon: 'person'         },
  { href: '/profiles',     label: 'App Profiles', icon: 'folder_special' },
]

interface Props {
  userEmail?: string | null
}

export function Sidebar({ userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed h-screen w-[220px] left-0 top-0 bg-surface-container-low flex flex-col py-6 px-4 border-r border-white/5 z-50">
      {/* Logo */}
      <div className="px-3 mb-8">
        <h1 className="text-lg font-bold font-display text-electric-indigo tracking-tight">
          AutoApply OS
        </h1>
        <p className="text-[10px] text-outline uppercase tracking-widest mt-0.5">Precision Workflow</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <div key={item.href} className="relative">
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-electric-indigo"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'text-primary bg-primary-container/10 font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <MatIcon size={20}>{item.icon}</MatIcon>
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        {/* New Application CTA */}
        <Link
          href="/applications/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <MatIcon size={16}>add</MatIcon>
          New Application
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-outline hover:text-error-vibrant transition-colors rounded-lg"
        >
          <MatIcon size={16}>logout</MatIcon>
          {userEmail ? <span className="truncate text-xs">{userEmail}</span> : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/components/layout/Sidebar.tsx
git commit -m "feat(03): sidebar — 220px, Material Symbols, Electric Indigo active, CTA button"
```

---

## Task 5: TopHeader Component (New)

**Files:**
- Create: `autoapply/apps/web/components/layout/TopHeader.tsx`

- [ ] **Step 1: Create TopHeader.tsx**

```tsx
'use client'

import { MatIcon } from '@/components/ui/mat-icon'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
}

export function TopHeader({ title }: Props) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 bg-background/70 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5 flex items-center px-8 gap-4">
      {title && (
        <h2 className="text-sm font-semibold text-on-surface font-display shrink-0">{title}</h2>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <MatIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
        >
          search
        </MatIcon>
        <input
          type="text"
          placeholder="Search..."
          className={cn(
            'w-full bg-surface-container-high border-none rounded-lg py-1.5 pl-9 pr-4',
            'text-sm text-on-surface placeholder:text-outline',
            'focus:outline-none focus:ring-1 focus:ring-electric-indigo/40',
            'transition-colors'
          )}
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Sync indicator */}
        <span className="relative flex h-2 w-2" title="Sync active">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-vibrant opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-vibrant" />
        </span>

        {/* Notification bell */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Notifications"
        >
          <MatIcon size={18}>notifications</MatIcon>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <MatIcon size={18}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</MatIcon>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-electric-indigo flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/components/layout/TopHeader.tsx
git commit -m "feat(03): TopHeader — search, sync indicator, theme toggle, avatar"
```

---

## Task 6: Dashboard Shell Layout

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace the entire file with:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopHeader } from '@/components/layout/TopHeader'
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
      <div className="flex min-h-screen bg-background mesh-gradient">
        <Sidebar userEmail={user?.email} />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
          <TopHeader />
          <main className="flex-1 overflow-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/layout.tsx
git commit -m "feat(03): dashboard shell — sidebar + TopHeader + PageTransition"
```

---

## Task 7: Dashboard Page

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/page.tsx`

This page keeps all existing Supabase queries. Only the JSX/classNames change.

- [ ] **Step 1: Replace dashboard page JSX**

Replace the entire file with:

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { StaggerFeed } from '@/components/dashboard/StaggerFeed'
import { MatIcon } from '@/components/ui/mat-icon'
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
  const total = BASE_FIELDS.length + 1
  return Math.round(((filled + (hasRegional ? 1 : 0)) / total) * 100)
}

const ACTIVITY_LOG = [
  { icon: 'check_circle', color: 'bg-success-vibrant', label: 'Applied to Stripe', time: '2h ago' },
  { icon: 'mail', color: 'bg-primary-container', label: 'OA invite from Rippling', time: '5h ago' },
  { icon: 'videocam', color: 'bg-tertiary-container', label: 'Interview scheduled', time: '1d ago' },
  { icon: 'star', color: 'bg-warning-vibrant', label: 'Profile updated', time: '2d ago' },
  { icon: 'sync', color: 'bg-outline', label: 'Feed synced — 24 new jobs', time: '3d ago' },
]

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
  const recentApps = applications.slice(0, 8)

  return (
    <div className="p-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={total}
          icon={<MatIcon size={18}>work</MatIcon>}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Applied This Week"
          value={thisWeek}
          icon={<MatIcon size={18}>schedule</MatIcon>}
          iconClassName="bg-warning-vibrant/10 text-warning-vibrant"
        />
        <StatCard
          label="Progressed Rate"
          value={total > 0 ? `${successRate}%` : '—'}
          icon={<MatIcon size={18}>emoji_events</MatIcon>}
          iconClassName="bg-success-vibrant/10 text-success-vibrant"
        />
        <StatCard
          label="Profile Readiness"
          value={`${readinessPct}%`}
          icon={<MatIcon size={18}>person</MatIcon>}
          iconClassName="bg-tertiary/10 text-tertiary"
        />
      </div>

      {/* Main grid: 12 cols */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Applications — 8 cols */}
        <div className="col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-display text-on-surface">Recent Applications</h2>
            <Link href="/applications" className="text-xs text-primary hover:underline">View all</Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="bg-surface-card rounded-xl border border-outline-variant p-10 text-center">
              <p className="text-on-surface-variant text-sm">No applications yet. Use the extension to auto-fill your first one.</p>
            </div>
          ) : (
            <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card divide-y divide-outline-variant/30 overflow-hidden">
              <StaggerFeed>
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-semibold text-on-surface-variant shrink-0">
                      {((app.job as { company?: string } | null)?.company ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {(app.job as { company?: string } | null)?.company ?? 'Unknown Company'}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {(app.job as { title?: string } | null)?.title ?? 'Unknown Role'}
                      </p>
                    </div>
                    <Badge status={app.status}>{app.status}</Badge>
                    <span className="text-xs text-outline shrink-0 w-16 text-right">
                      {app.applied_at ? timeAgo(app.applied_at) : '—'}
                    </span>
                    <MatIcon size={14} className="text-outline/40 group-hover:text-outline transition-colors shrink-0">chevron_right</MatIcon>
                  </Link>
                ))}
              </StaggerFeed>
            </div>
          )}
        </div>

        {/* Activity Log — 4 cols */}
        <div className="col-span-4 space-y-3">
          <h2 className="text-base font-semibold font-display text-on-surface">Activity</h2>
          <div className="bg-surface-card rounded-xl border border-outline-variant p-5">
            <div className="relative space-y-0">
              {/* Vertical connector */}
              <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-outline-variant/40" />

              {ACTIVITY_LOG.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3 py-3">
                  <div className={`relative z-10 w-5 h-5 rounded-full ${item.color} flex items-center justify-center shrink-0 border-2 border-surface-card`}>
                    <MatIcon size={11} className="text-white">{item.icon}</MatIcon>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-on-surface leading-snug">{item.label}</p>
                    <p className="text-xs text-outline mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/page.tsx
git commit -m "feat(03): dashboard page — stat cards, 8/4 grid, activity log"
```

---

## Task 8: Jobs Page + JobCard

**Files:**
- Modify: `autoapply/apps/web/components/jobs/JobCard.tsx`
- Modify: `autoapply/apps/web/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Replace JobCard.tsx**

Replace the entire file with:

```tsx
'use client'

import { useState } from 'react'
import { MatIcon } from '@/components/ui/mat-icon'
import { Badge } from '@/components/ui/badge'
import { cn, stripHtml, extractCompanyDomain } from '@/lib/utils'
import type { JobWithScore } from '@/lib/types'

function formatLocation(raw: string): string {
  const stripped = stripHtml(raw)
  const commaCount = (stripped.match(/,/g) || []).length
  if (commaCount >= 3 || stripped.toLowerCase().includes('location')) return 'Multiple Locations'
  return stripped.length > 60 ? stripped.slice(0, 60) + '…' : stripped
}

interface Props {
  job: JobWithScore
  featured?: boolean
}

export function JobCard({ job, featured }: Props) {
  const [hidden, setHidden] = useState(false)
  const [applied, setApplied] = useState(false)
  const [pendingApply, setPendingApply] = useState(false)
  const score = job.job_scores?.[0]?.score

  const logoUrl = job.company_logo_url
    || (job.company_domain ? `https://www.google.com/s2/favicons?domain=${job.company_domain}&sz=64` : null)
    || (job.company.includes('↳') ? null : `https://www.google.com/s2/favicons?domain=${extractCompanyDomain(job.apply_url, job.company)}&sz=64`)
  const [logoFailed, setLogoFailed] = useState(false)

  if (hidden) return null

  async function handleHide() {
    await fetch('/api/jobs/' + job.id + '/hide', { method: 'PATCH' })
    setHidden(true)
  }

  function handleApplyClick() {
    if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    setPendingApply(true)
  }

  async function handleMarkApplied() {
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, status: 'applied', applied_at: new Date().toISOString(), source: 'manual' }),
      })
      setApplied(true)
      setPendingApply(false)
      setTimeout(() => { setApplied(false); setHidden(true) }, 1500)
    } catch { setPendingApply(false) }
  }

  return (
    <div className={cn(
      'break-inside-avoid bg-surface-card rounded-xl border border-outline-variant p-5',
      'transition-all hover:scale-[1.01] border-glow-hover flex flex-col gap-4 mesh-gradient-card',
      featured && 'border-beam-active'
    )}>
      {/* Header: logo + badges + hide */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center text-sm font-semibold text-on-surface-variant shrink-0 p-2">
          {logoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={job.company} className="w-full h-full object-contain" onError={() => setLogoFailed(true)} />
          ) : (
            <span>{job.company.includes('↳') ? '?' : job.company.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-on-surface leading-snug">{job.title}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {job.company.includes('↳') ? 'Company N/A' : job.company}
          </p>
          {job.location && (
            <p className="text-xs text-outline mt-0.5">{formatLocation(job.location)}</p>
          )}
        </div>
        <button
          onClick={handleHide}
          title="Hide job"
          className="text-outline/40 hover:text-error-vibrant transition-colors text-sm leading-none shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {featured && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            FEATURED
          </span>
        )}
        {score != null && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-success-vibrant/10 text-success-vibrant">
            {score}% match
          </span>
        )}
        {job.job_type && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {job.job_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Salary / footer */}
      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 mt-auto">
        <div>
          {job.salary_min && job.salary_max ? (
            <span className="text-xs text-on-surface-variant">
              ${Math.round(job.salary_min / 1000)}k – ${Math.round(job.salary_max / 1000)}k
            </span>
          ) : (
            <span className="text-xs text-outline">Salary N/A</span>
          )}
        </div>

        {job.apply_url ? (
          <div className="flex items-center gap-1">
            {applied ? (
              <span className="h-7 px-3 bg-success-vibrant text-white text-xs font-medium rounded-full inline-flex items-center gap-1">
                <MatIcon size={12}>check</MatIcon> Applied
              </span>
            ) : pendingApply ? (
              <>
                <button
                  onClick={handleMarkApplied}
                  className="h-7 px-3 bg-success-vibrant text-white text-xs font-medium rounded-full inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  <MatIcon size={12}>check</MatIcon> Mark Applied
                </button>
                <button onClick={() => setPendingApply(false)} className="text-outline/40 hover:text-outline transition-colors ml-1 text-xs">×</button>
              </>
            ) : (
              <button
                onClick={handleApplyClick}
                className={cn(
                  'h-7 px-3 text-white text-xs font-medium rounded-full inline-flex items-center gap-1.5 transition-all',
                  'bg-gradient-to-br from-primary-container to-electric-indigo hover:opacity-90'
                )}
              >
                Apply <MatIcon size={12}>arrow_outward</MatIcon>
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-outline/50">No link</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update jobs page — masonry layout + FAB**

Replace the `return (...)` block in `autoapply/apps/web/app/(dashboard)/jobs/page.tsx` (lines 110–142) with:

```tsx
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Job Feed</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {list.length} opportunities matching your profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FilterDropdowns />
          <SortControl />
        </div>
      </div>

      <JobFiltersClient active={(type as JobType) ?? 'all'} />

      {/* Masonry grid */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
        {curatorsPick && <JobCard job={curatorsPick} featured />}
        {rest.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
        {list.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <p className="text-5xl font-light text-on-surface-variant/30 tracking-tight">No jobs yet</p>
            <p className="text-sm text-on-surface-variant mt-3">Sync will populate this feed automatically every 6 hours.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <a
        href="/applications/new"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary-container to-electric-indigo shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-white z-50"
        title="New Application"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
      </a>
    </div>
  )
```

Also update the import block at the top of `jobs/page.tsx` — remove the lucide import if there is one. The file currently doesn't import lucide so no change needed.

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/components/jobs/JobCard.tsx autoapply/apps/web/app/(dashboard)/jobs/page.tsx
git commit -m "feat(03): jobs page — masonry grid, Stitch JobCard, border-glow, FAB"
```

---

## Task 9: Applications Page

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/applications/page.tsx`
- Modify: `autoapply/apps/web/components/applications/ApplicationKanban.tsx`

- [ ] **Step 1: Read ApplicationKanban.tsx**

Read the file to see what token classNames need updating:
`autoapply/apps/web/components/applications/ApplicationKanban.tsx`

- [ ] **Step 2: Update applications/page.tsx header**

In `autoapply/apps/web/app/(dashboard)/applications/page.tsx`, replace the `return (...)` block with:

```tsx
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Applications</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {applications.length} tracked application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {applications.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl font-light text-on-surface-variant/30 tracking-tight">No applications yet</p>
          <p className="text-sm text-on-surface-variant mt-3">Apply to jobs from the Job Feed to start tracking.</p>
        </div>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
```

- [ ] **Step 3: Update ApplicationKanban token classNames**

In `autoapply/apps/web/components/applications/ApplicationKanban.tsx`, replace all old token classNames:
- Every `bg-surface-card` → keep (same token, new value)
- Every `border-border-subtle` → `border-outline-variant`
- Every `shadow-card` → `shadow-card` (keep)
- Every `rounded-card` → `rounded-xl`
- Every `text-on-surface-muted` → `text-on-surface-variant`
- Every `hover:bg-surface-container-highest` → `hover:bg-surface-container-high`

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/applications/page.tsx autoapply/apps/web/components/applications/ApplicationKanban.tsx
git commit -m "feat(03): applications page — Stitch token classNames"
```

---

## Task 10: Calendar Page

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Replace calendar page with CSS grid calendar**

Replace the entire file with:

```tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MatIcon } from '@/components/ui/mat-icon'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-1">Interview schedules and deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <MatIcon size={18}>chevron_left</MatIcon>
          </button>
          <span className="text-sm font-semibold text-on-surface min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <MatIcon size={18}>chevron_right</MatIcon>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface-card rounded-xl border border-outline-variant overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-medium text-outline uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7" style={{ gap: '1px', backgroundColor: 'var(--outline-variant)' }}>
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[120px] p-2 flex flex-col',
                  day ? 'bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors' : 'bg-surface-abyss',
                  isToday && 'bg-primary-container/5 border border-electric-indigo/30'
                )}
              >
                {day && (
                  <span className={cn(
                    'text-sm w-7 h-7 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-electric-indigo text-white font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}>
                    {day}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-outline text-center">
        Connect Gmail to auto-populate interview schedules and OA deadlines.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/calendar/page.tsx
git commit -m "feat(03): calendar page — 7-col CSS grid, month navigation"
```

---

## Task 11: Insights Page

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/insights/page.tsx`

All business logic (Supabase queries, calculations) stays identical. Only classNames change.

- [ ] **Step 1: Update token classNames in insights/page.tsx**

Replace the `return (...)` block (starting at line 52) with:

```tsx
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-on-surface">Insights</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {total === 0 ? 'Start applying to jobs to see your stats here.' : `Based on ${total} application${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-surface-card rounded-xl p-5 shadow-card border border-outline-variant flex flex-col gap-3 mesh-gradient-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
        <h2 className="text-base font-semibold text-on-surface mb-5">Application Funnel</h2>
        <div className="space-y-3">
          {funnel.map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-sm text-on-surface-variant w-24 shrink-0">{f.label}</span>
              <div className="flex-1 h-6 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full ${f.color} rounded-full transition-all`}
                  style={{ width: `${(f.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-on-surface w-8 text-right">{f.count}</span>
            </div>
          ))}
        </div>
        {total === 0 && (
          <p className="text-sm text-outline/50 text-center mt-4">Apply to jobs to populate this funnel</p>
        )}
      </div>

      {/* Status breakdown */}
      {total > 0 && (
        <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
          <h2 className="text-base font-semibold text-on-surface mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['saved', 'applied', 'oa', 'interviewing', 'offer', 'rejected', 'ghosted'] as const).map(status => {
              const count = all.filter(a => a.status === status).length
              if (count === 0) return null
              return (
                <div key={status} className="text-center">
                  <p className="text-xl font-bold text-on-surface">{count}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{status}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {latestInsight && (
        <div className="bg-surface-card rounded-xl p-6 shadow-card border border-outline-variant">
          <h2 className="text-base font-semibold text-on-surface mb-4">AI Insights</h2>
          <div className="space-y-3">
            {(latestInsight.insights as InsightItem[]).map((insight: InsightItem, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  insight.type === 'stat' ? 'bg-primary' :
                  insight.type === 'recommendation' ? 'bg-warning-vibrant' : 'bg-error-vibrant'
                }`} />
                <p className="text-sm text-on-surface">{insight.message}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-outline/50 mt-3">
            Week of {new Date(latestInsight.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
```

Also update the import block — replace lucide imports with MatIcon where used, or leave lucide for the stat card icons since they're still valid (stat cards use `s.icon` which is a lucide component). No change needed to imports for this page.

- [ ] **Step 2: Update funnel colors to new tokens**

In `insights/page.tsx`, find the `funnel` array definition and update the color values:

```tsx
  const funnel = [
    { label: 'Applied',      count: applied,       color: 'bg-primary-container'   },
    { label: 'OA',           count: all.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length, color: 'bg-warning-vibrant'     },
    { label: 'Interviewing', count: interviewing,   color: 'bg-deep-violet'          },
    { label: 'Offer',        count: offers,         color: 'bg-success-vibrant'      },
  ]
```

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/insights/page.tsx
git commit -m "feat(03): insights page — Stitch token classNames, new funnel colors"
```

---

## Task 12: Profile Page

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Update card and banner classNames**

Replace the entire file with the same logic but new classNames:

```tsx
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { BaseIdentityForm } from '@/components/profile/BaseIdentityForm'
import { RegionalIdentityList } from '@/components/profile/RegionalIdentityList'
import { redirect } from 'next/navigation'
import { MatIcon } from '@/components/ui/mat-icon'

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
        <div className="flex items-center gap-3 rounded-xl border border-success-vibrant/20 bg-success-vibrant/10 px-4 py-3">
          <MatIcon size={16} className="text-success-vibrant shrink-0">check_circle</MatIcon>
          <p className="text-sm text-success-vibrant font-medium">
            Profile complete — the extension can auto-fill applications.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-warning-vibrant/20 bg-warning-vibrant/10 px-4 py-3">
          <MatIcon size={16} className="text-warning-vibrant shrink-0 mt-0.5">warning</MatIcon>
          <div>
            <p className="text-sm font-medium text-warning-vibrant">Profile incomplete</p>
            <p className="text-xs text-warning-vibrant/80 mt-0.5">
              Add {missingItems.join(' and ')} to enable auto-fill.
            </p>
          </div>
        </div>
      )}

      {/* Base Identity */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Base Identity</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Personal details, online presence, and logistics</p>
        </div>
        <div className="p-6">
          <BaseIdentityForm initial={baseIdentity} />
        </div>
      </div>

      {/* Regional Identities */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Regional Identities</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Country-specific contact, work authorization, and compensation</p>
        </div>
        <div className="p-6">
          <RegionalIdentityList initial={regional} />
        </div>
      </div>

      {/* Fill Preferences */}
      <div className="bg-surface-card rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-base font-semibold font-display text-on-surface">Fill Preferences</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">EEO, background check, and other application defaults</p>
        </div>
        <div className="p-6">
          <ProfileForm initialProfile={profileRes.data ?? {}} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/profile/page.tsx
git commit -m "feat(03): profile page — Stitch card tokens, MatIcon banners"
```

---

## Task 13: App Profiles Page + ProfileCard

**Files:**
- Modify: `autoapply/apps/web/app/(dashboard)/profiles/page.tsx`
- Modify: `autoapply/apps/web/components/profiles/ProfileCard.tsx`

- [ ] **Step 1: Read ProfileCard.tsx**

Read `autoapply/apps/web/components/profiles/ProfileCard.tsx` to see existing classNames.

- [ ] **Step 2: Update profiles/page.tsx**

Replace the entire file with:

```tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileListClient } from '@/components/profiles/ProfileListClient'
import type { ApplicationProfile } from '@/lib/types'
import { MatIcon } from '@/components/ui/mat-icon'

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Application Profiles</h1>
          <p className="text-sm text-on-surface-variant mt-1">Role-specific profiles for auto-filling ATS applications.</p>
        </div>
        <Link
          href="/profiles/new"
          className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <MatIcon size={16}>add</MatIcon>
          New Profile
        </Link>
      </div>

      {profileList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center mb-4">
            <MatIcon size={20} className="text-outline">add</MatIcon>
          </div>
          <h2 className="text-lg font-semibold font-display text-on-surface mb-2">No profiles yet</h2>
          <p className="text-sm text-on-surface-variant max-w-sm mb-6">
            Create your first application profile to start auto-filling. Upload a resume to get started.
          </p>
          <Link
            href="/profiles/new"
            className="flex items-center gap-2 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <ProfileListClient profiles={profileList} />
          <Link
            href="/profiles/new"
            className="rounded-xl border-2 border-dashed border-outline-variant hover:border-electric-indigo/40 hover:bg-electric-indigo/5 transition-colors p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-outline group-hover:border-electric-indigo/40 flex items-center justify-center transition-colors">
              <MatIcon size={18} className="text-outline group-hover:text-electric-indigo/60 transition-colors">add</MatIcon>
            </div>
            <span className="text-sm font-medium text-outline group-hover:text-on-surface transition-colors">New Profile</span>
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update ProfileCard.tsx — add border-beam for active cards**

After reading ProfileCard.tsx in Step 1, update the outer card div classNames:
- Find the outer card div and add `border-beam-active` class when `profile.is_default` is true
- Replace `border-border-subtle` with `border-outline-variant`
- Replace `rounded-card` with `rounded-xl`
- Replace `text-on-surface-muted` with `text-on-surface-variant`

The exact edits depend on what the file contains (read it first in Step 1). Pattern to apply:

```tsx
// Card wrapper — change from:
<div className="bg-surface-card rounded-card border border-border-subtle shadow-card p-5 ...">
// to:
<div className={cn(
  'bg-surface-card rounded-xl border border-outline-variant shadow-card p-5 transition-all',
  profile.is_default && 'border-beam-active border-electric-indigo/40'
)}>
```

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/app/(dashboard)/profiles/page.tsx autoapply/apps/web/components/profiles/ProfileCard.tsx
git commit -m "feat(03): profiles page — border-beam active cards, Stitch tokens"
```

---

## Task 14: Login Page Reskin

**Files:**
- Modify: `autoapply/apps/web/app/(auth)/login/page.tsx`

The 60/40 layout is preserved. Only token classNames change.

- [ ] **Step 1: Replace login/page.tsx**

Replace the entire file with:

```tsx
import { MatIcon } from '@/components/ui/mat-icon'
import { SignInButton } from '@/components/auth/SignInButton'

const VALUE_PROPS = [
  'Auto-fill any ATS form in one click',
  'Track every application in one dashboard',
  'AI-powered interview prep and insights',
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — 60% */}
      <div className="hidden lg:flex w-3/5 flex-col bg-surface-container-low min-h-screen px-12 py-10 relative overflow-hidden mesh-gradient">
        <div className="text-xl font-bold font-display text-electric-indigo">
          AutoApply OS
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-[48px] font-bold font-display text-on-surface leading-[1.1] mb-8 text-balance">
            Apply once.<br />Apply everywhere.
          </h1>
          <ul className="space-y-4">
            {VALUE_PROPS.map(item => (
              <li key={item} className="flex items-center gap-3">
                <MatIcon size={18} className="text-success-vibrant shrink-0">check_circle</MatIcon>
                <span className="text-sm text-on-surface-variant">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative glow */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-electric-indigo/5 blur-3xl pointer-events-none" />
      </div>

      {/* Right panel — 40% */}
      <div className="flex-1 flex items-center justify-center bg-surface-card px-8 min-h-screen">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-xl font-bold font-display text-electric-indigo">
            AutoApply OS
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-on-surface">Sign in</h2>
            <p className="text-sm text-on-surface-variant mt-1">Continue to AutoApply OS</p>
          </div>

          <SignInButton />

          <p className="text-xs text-outline text-center leading-relaxed">
            We read your Gmail to detect OA invites, interviews, and rejections.
            We never send emails on your behalf.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/app/(auth)/login/page.tsx
git commit -m "feat(03): login — Stitch token reskin, keep 60/40 layout"
```

---

## Task 15: UX Enhancement Layer — Motion + Stat Card Polish

**Files:**
- Modify: `autoapply/apps/web/components/ui/stat-card.tsx`
- Modify: `autoapply/apps/web/components/dashboard/StaggerFeed.tsx`

- [ ] **Step 1: Read stat-card.tsx and StaggerFeed.tsx**

Read both files to see their current implementation.

- [ ] **Step 2: Update stat-card.tsx with new tokens**

After reading, update `stat-card.tsx` classNames:
- Replace `bg-surface-card` → keep (same)
- Replace `rounded-card` → `rounded-xl`
- Replace `border-border-subtle` → `border-outline-variant`
- Replace `shadow-card` → `shadow-card` (keep)
- Replace `text-on-surface-muted` → `text-on-surface-variant`
- Add hover state: `hover:border-electric-indigo/30 transition-all group mesh-gradient-card`

The stat card outer div should be:
```tsx
<div className="bg-surface-card rounded-xl border border-outline-variant shadow-card p-5 flex flex-col gap-3 hover:border-electric-indigo/30 transition-all mesh-gradient-card">
```

- [ ] **Step 3: Verify StaggerFeed uses Framer Motion stagger**

StaggerFeed should already use Framer Motion for stagger animation. If it only uses CSS or simpler animation, update to use `motion.div` with stagger:

```tsx
'use client'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}
const item = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

export function StaggerFeed({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>{child}</motion.div>
          ))
        : children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/components/ui/stat-card.tsx autoapply/apps/web/components/dashboard/StaggerFeed.tsx
git commit -m "feat(03): UX layer — stat card hover tokens, StaggerFeed Framer Motion stagger"
```

---

## Self-Review Checklist

After all tasks are committed:

**Spec coverage:**
- [x] Token system — Task 1
- [x] Root layout + Material Symbols — Task 2
- [x] ThemeProvider dark default — Task 3
- [x] Sidebar 220px, Material Symbols, active state, CTA — Task 4
- [x] TopHeader (search, sync, theme toggle, avatar) — Task 5
- [x] Dashboard shell layout — Task 6
- [x] Dashboard page (4 stats, 8/4 grid, activity log) — Task 7
- [x] Jobs masonry + JobCard border-glow + FAB — Task 8
- [x] Applications Stitch tokens — Task 9
- [x] Calendar 7-col grid — Task 10
- [x] Insights Stitch tokens — Task 11
- [x] Profile Stitch cards — Task 12
- [x] App Profiles border-beam active — Task 13
- [x] Login reskin — Task 14
- [x] Stat card hover + StaggerFeed motion — Task 15

**Not covered (out of scope per spec §8):**
- ApplicationDetail page — uses old tokens but is secondary; update in follow-up
- ProfileCard inner components (BaseIdentityForm, RegionalIdentityForm inputs) — update in follow-up
- FilterDropdowns / SortControl / JobFiltersClient — minor, update in follow-up
