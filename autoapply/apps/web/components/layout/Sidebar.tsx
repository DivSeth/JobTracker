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
