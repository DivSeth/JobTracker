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
        {/* Sync status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success-vibrant/10 text-success-vibrant">
          <span className="w-1.5 h-1.5 rounded-full bg-success-vibrant animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Sync Active</span>
        </div>

        <div className="w-px h-5 bg-outline-variant" />

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Notifications"
        >
          <MatIcon size={18}>notifications</MatIcon>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-error-vibrant" />
        </button>

        {/* Keyboard shortcut */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Command menu"
        >
          <MatIcon size={18}>keyboard_command_key</MatIcon>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <MatIcon size={18}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</MatIcon>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-electric-indigo flex items-center justify-center text-white text-xs font-semibold cursor-pointer select-none border border-electric-indigo/30">
          A
        </div>
      </div>
    </header>
  )
}
