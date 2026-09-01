'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: 'dashboard'      },
  { href: '/jobs',         label: 'Jobs',         icon: 'work'           },
  { href: '/applications', label: 'Applications', icon: 'description'    },
  { href: '/calendar',     label: 'Calendar',     icon: 'calendar_today' },
  { href: '/insights',     label: 'Insights',     icon: 'analytics'      },
  { href: '/knowledge',    label: 'Knowledge',    icon: 'hub'            },
  { href: '/profile',      label: 'Profile',      icon: 'account_circle' },
  { href: '/profiles',     label: 'App Profiles', icon: 'apps'           },
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
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0a0a0a] border-r border-white/5 flex flex-col py-6 px-3 z-50">
      {/* Logo */}
      <div className="px-4 mb-7">
        <h1 className="font-serif-lux text-2xl font-light italic text-white tracking-wide">AutoApply OS</h1>
        <p className="text-[9px] text-white/40 uppercase tracking-[0.25em] font-medium mt-0.5">Clinical Precision</p>
      </div>

      {/* New Application CTA */}
      <div className="px-2 mb-6">
        <Link
          href="/applications/new"
          className="w-full bg-[#141414] hover:bg-[#1a1a1a] text-white py-2.5 px-4 rounded-lg font-medium text-xs border border-white/10 hover:border-white/20 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px] text-white/70">add</span>
          <span>New Application</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg transition-all duration-200 ${
                active
                  ? 'text-white font-medium border-l-2 border-white bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${active ? 'text-white' : 'text-white/50'}`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="pt-4 border-t border-white/5 space-y-1 px-1">
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[18px] text-white/50">settings</span>
          <span>Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[18px] text-white/50">logout</span>
          <span className="truncate flex-1 text-left">{userEmail ?? 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}
