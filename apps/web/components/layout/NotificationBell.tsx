'use client'

import { useState } from 'react'

export interface NotificationAlert {
  id: string
  message: string
  created_at?: string | null
}

export function NotificationBell({ alerts }: { alerts: NotificationAlert[] }) {
  const [open, setOpen] = useState(false)
  const count = alerts.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative text-white/50 hover:text-white transition-all p-1.5 focus:outline-none"
        aria-label={`Notifications${count ? `: ${count} open networking alert${count === 1 ? '' : 's'}` : ''}`}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-3 h-3 px-0.5 bg-white text-black rounded-full text-[8px] leading-3 text-center font-bold">
            {count}
          </span>
        )}
      </button>

      {open && count > 0 && (
        <div className="absolute right-0 top-9 w-80 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <p className="text-xs font-semibold text-white">
              {count} networking alert{count === 1 ? '' : 's'}
            </p>
            <span className="text-[10px] uppercase tracking-widest text-white/35">Open</span>
          </div>
          <div className="mt-2 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <p className="text-xs leading-relaxed text-white/75">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
