'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MatIcon } from '@/components/ui/mat-icon'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-on-surface">Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-1">Interview schedules and deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <MatIcon size={18}>chevron_left</MatIcon>
          </button>
          <span className="text-sm font-semibold text-on-surface min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <MatIcon size={18}>chevron_right</MatIcon>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface-card rounded-xl border border-outline-variant overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-medium text-outline uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7" style={{ gap: '1px', backgroundColor: 'var(--outline-variant)' }}>
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[120px] p-2 flex flex-col',
                  day ? 'bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors' : 'bg-surface-abyss',
                  isToday && 'bg-primary-container/5 border border-electric-indigo/30'
                )}
              >
                {day && (
                  <span className={cn(
                    'text-sm w-7 h-7 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-electric-indigo text-white font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}>
                    {day}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-outline text-center">
        Connect Gmail to auto-populate interview schedules and OA deadlines.
      </p>
    </div>
  )
}
