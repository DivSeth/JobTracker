'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard'     },
  { href: '/jobs',          label: 'Jobs'          },
  { href: '/applications',  label: 'Applications'  },
  { href: '/calendar',      label: 'Calendar'      },
  { href: '/insights',      label: 'Insights'      },
  { href: '/profile',       label: 'Profile'       },
]

interface Props {
  userEmail?: string | null
}

export function Sidebar({ userEmail }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-surface-container min-h-screen px-3 py-5 gap-1">
      {/* Logo */}
      <div className="px-3 mb-6">
        <span className="text-base font-semibold text-on-surface tracking-tight">Job OS</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-xl text-sm transition-colors',
                active
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container-highest/50'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user + CTA */}
      <div className="space-y-2 pt-2">
        <Link
          href="/applications/new"
          className="w-full h-9 gradient-primary text-white text-sm font-medium rounded-xl inline-flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          New Application
        </Link>
        {userEmail && (
          <p className="text-xs text-on-surface-muted px-3 truncate">{userEmail}</p>
        )}
      </div>
    </aside>
  )
}
