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
          aria-label="Search"
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
          aria-label="Notifications"
        >
          <MatIcon size={18}>notifications</MatIcon>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
