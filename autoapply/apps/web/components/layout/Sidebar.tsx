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
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/providers/ThemeProvider'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/jobs',         label: 'Jobs',         icon: Briefcase       },
  { href: '/applications', label: 'Applications', icon: FileText        },
  { href: '/calendar',     label: 'Calendar',     icon: Calendar        },
  { href: '/insights',     label: 'Insights',     icon: BarChart2       },
  { href: '/profile',      label: 'Profile',      icon: User            },
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
    <aside className="w-52 shrink-0 flex flex-col bg-surface-container min-h-screen px-3 py-5 gap-1">
      {/* Logo */}
      <div className="px-3 mb-6 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full gradient-primary shrink-0" />
        <span className="text-lg font-bold text-on-surface tracking-tight">
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
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
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
      <div className="border-t border-on-surface/5 my-2" />

      {/* Bottom: user + CTA + theme + logout */}
      <div className="space-y-2 pt-2">
        <Link
          href="/applications/new"
          className="w-full h-9 gradient-primary text-white text-sm font-medium rounded-xl inline-flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          New Application
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-muted hover:text-on-surface transition-colors rounded-xl"
        >
          <span className="transition-transform duration-300" style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-muted hover:text-error transition-colors rounded-xl"
        >
          <LogOut size={14} />
          Sign out
        </button>
        {userEmail && (
          <p className="text-xs text-on-surface-muted px-3 truncate">{userEmail}</p>
        )}
      </div>
    </aside>
  )
}
