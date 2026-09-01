'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { NotificationBell, type NotificationAlert } from '@/components/layout/NotificationBell'

export function TopHeader({ alerts = [] }: { alerts?: NotificationAlert[] }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="fixed top-0 right-0 left-[220px] h-14 backdrop-blur-xl bg-[#050505]/85 border-b border-white/5 flex justify-between items-center px-6 z-40">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[16px]">
            search
          </span>
          <input
            type="text"
            className="w-full bg-[#0d0d0d] border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:border-white/20 outline-none transition-all text-white placeholder:text-white/30"
            placeholder="Search applications, roles, or companies..."
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Sync status */}
        <button className="flex items-center gap-2 bg-white/5 text-white/80 border border-white/10 px-3 py-1 rounded-full text-[9px] font-medium tracking-wider hover:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-[13px] text-white/60 animate-pulse">check_circle</span>
          <span>GOOGLE CALENDAR SYNCED</span>
        </button>

        <div className="flex items-center gap-3 border-l border-white/5 pl-4">
          <NotificationBell alerts={alerts} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-white/50 hover:text-white transition-all p-1.5 focus:outline-none"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[19px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {/* Avatar */}
          <div className="h-7 w-7 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-all cursor-pointer bg-[#1a1a1a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] text-white/60">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}
