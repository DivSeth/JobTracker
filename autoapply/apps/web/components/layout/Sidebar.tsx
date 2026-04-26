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
