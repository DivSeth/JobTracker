'use client'

import { useState } from 'react'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function CalendarPage() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Month')
  const [outlookConnected, setOutlookConnected] = useState(false)
  const [year] = useState(today.getFullYear())
  const [month] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfWeek(year, month)

  const calendarCells: { day: number; currentMonth: boolean }[] = [
    ...Array.from({ length: firstDayOffset }, (_, i) => {
      const prevMonthDays = getDaysInMonth(year, month - 1)
      return { day: prevMonthDays - firstDayOffset + i + 1, currentMonth: false }
    }),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, currentMonth: true })),
  ]
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ day: calendarCells.length - daysInMonth - firstDayOffset + 1, currentMonth: false })
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-3.5rem-4rem)] overflow-hidden -m-8 p-8">
      {/* Calendar Primary Workspace */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
              Interview Schedule
            </h1>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">
              {MONTH_NAMES[month]} {year} — Active loops and milestones
            </p>
          </div>

          <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-white/5">
            {(['Day', 'Week', 'Month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/45 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 flex flex-col overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-white/5 bg-[#121212]/50 text-center font-semibold text-[9px] uppercase tracking-widest py-3 text-white/40">
            {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar cells */}
          <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridTemplateRows: `repeat(${calendarCells.length / 7}, minmax(70px, 1fr))` }}>
            {calendarCells.map(({ day, currentMonth }, index) => {
              const isToday = currentMonth && day === today.getDate()
              const isSelected = selectedDay === day && currentMonth

              return (
                <div
                  key={index}
                  onClick={() => currentMonth && setSelectedDay(day)}
                  className={`min-h-[70px] p-2 border-r border-b border-white/5 flex flex-col transition-all cursor-pointer ${
                    !currentMonth ? 'opacity-15' : 'hover:bg-white/[0.02]'
                  } ${isSelected ? 'bg-white/[0.03] border-white/20' : ''}`}
                >
                  <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-white text-black font-bold text-[11px]'
                      : !currentMonth
                        ? 'text-white/20'
                        : isSelected ? 'text-white font-bold' : 'text-white/60'
                  }`}>
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto">
        {/* Live Synchronization */}
        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Live Synchronization</h3>
            <span className="material-symbols-outlined text-white/60 text-[18px]">sync_saved_locally</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#151515] rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-white">calendar_month</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Google Calendar</p>
                  <p className="text-[10px] text-white/50">Channel Active</p>
                </div>
              </div>
              <button className="p-1 text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[16px] cursor-pointer">sync</span>
              </button>
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5 ${!outlookConnected ? 'opacity-55' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#151515] rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-white/50">mail</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Outlook 365</p>
                  <p className="text-[10px] text-white/40">{outlookConnected ? 'Connected' : 'Offline'}</p>
                </div>
              </div>
              <button
                onClick={() => setOutlookConnected(!outlookConnected)}
                className="text-white text-[10px] font-bold uppercase tracking-wider hover:underline"
              >
                {outlookConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

        {/* Day Agenda */}
        <div className="flex-1 bg-[#0a0a0a] border border-white/5 p-5 rounded-xl flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-white">
              {selectedDay ? `Day ${selectedDay} Agenda` : 'Upcoming Events'}
            </h3>
            <span className="text-[9px] font-semibold text-white/50 cursor-pointer uppercase tracking-widest hover:text-white transition-all">
              View All
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <p className="text-xs text-white/30 italic text-center py-8">
              No active appointments scheduled for this day. Connect Gmail to auto-populate.
            </p>

            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="flex items-start gap-3 p-3 bg-[#121212]/50 rounded-lg border border-dashed border-white/10">
                <span className="material-symbols-outlined text-white/40 text-[18px]">info</span>
                <p className="text-[10px] text-white/45 leading-relaxed mt-0.5">
                  Secure synchronization runs globally in background threads. Connect Gmail to auto-populate interview schedules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
