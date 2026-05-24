'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Returns 0=Mon, 1=Tue, ..., 6=Sun
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfWeek(year, month)
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear()

  return (
    <main className="p-6 h-[calc(100vh-3.5rem)] overflow-hidden flex gap-6">
      {/* Left: Calendar */}
      <section className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-on-surface">Interview Schedule</h1>
            <p className="text-on-surface-variant text-[14px] mt-0.5">Your calendar for interviews and deadlines</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
              <button className="px-4 py-1.5 text-[12px] font-medium text-on-surface-variant hover:text-primary rounded-md transition-colors">Day</button>
              <button className="px-4 py-1.5 text-[12px] font-medium text-on-surface-variant hover:text-primary rounded-md transition-colors">Week</button>
              <button className="px-4 py-1.5 text-[12px] font-medium bg-surface-container-high text-primary shadow-sm rounded-md transition-colors">Month</button>
            </div>
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-[14px] font-semibold text-on-surface min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar container */}
        <div className="flex-1 bg-surface-container rounded-xl border border-outline-variant flex flex-col overflow-hidden shadow-lg mesh-gradient min-h-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-high/50 shrink-0">
            {DAYS_SHORT.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'py-3 text-center text-[10px] font-semibold uppercase tracking-widest',
                  i < 6 ? 'border-r border-outline-variant/30' : '',
                  isCurrentMonth && new Date().getDay() === (i === 6 ? 0 : i + 1)
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-y-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--outline-variant)' }}>
            {cells.map((day, i) => {
              const isToday = day !== null && isCurrentMonth && day === today.getDate()
              const isPast = day === null
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] p-2 flex flex-col',
                    isPast ? 'opacity-30' : 'cursor-pointer hover:bg-surface-container-high transition-colors',
                    isToday ? 'bg-surface-container-high/40' : 'bg-surface-container'
                  )}
                >
                  {day !== null && (
                    <span className={cn(
                      'text-[12px] w-6 h-6 flex items-center justify-center rounded-full',
                      isToday
                        ? 'bg-electric-indigo text-white font-bold text-[11px]'
                        : 'text-on-surface-variant'
                    )}>
                      {day}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-80 flex flex-col gap-6 shrink-0">
        {/* Connections card */}
        <div className="glass border border-outline-variant p-4 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-on-surface">Connections</h3>
            <span className="material-symbols-outlined text-primary text-[20px]">sync_saved_locally</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container/50 border border-outline-variant/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-container-highest rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface">Google Calendar</p>
                  <p className="text-[10px] text-success-vibrant">Live Syncing</p>
                </div>
              </div>
              <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </button>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container/50 border border-outline-variant/50 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-container-highest rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface">Outlook 365</p>
                  <p className="text-[10px] text-on-surface-variant">Disconnected</p>
                </div>
              </div>
              <button className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">Connect</button>
            </div>
          </div>
        </div>

        {/* Upcoming this week */}
        <div className="flex-1 glass border border-outline-variant p-5 rounded-xl flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[18px] font-semibold text-on-surface">Upcoming This Week</h3>
            <span className="text-primary text-[10px] cursor-pointer hover:underline font-bold uppercase tracking-widest">VIEW ALL</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="relative pl-4 border-l-2 border-primary group cursor-pointer">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Today · Connect Gmail</p>
              <h4 className="text-[14px] font-bold text-on-surface group-hover:text-primary transition-colors">Sync your Gmail account</h4>
              <p className="text-[12px] text-on-surface-variant">Auto-detect interview invites</p>
              <div className="flex gap-2 mt-2">
                <div className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/20">Setup</div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-outline-variant/20">
              <div className="flex items-center gap-3 p-3 bg-surface-container-high/40 rounded-lg border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Connect Gmail to auto-populate interview schedules and OA deadlines here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}
