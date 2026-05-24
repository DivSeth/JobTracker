'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ApplicationKanban } from '@/components/applications/ApplicationKanban'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [intelligenceOn, setIntelligenceOn] = useState(true)

  const fetchApplications = useCallback(async () => {
    const r = await fetch('/api/applications')
    const data = await r.json()
    setApplications(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  async function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    await fetchApplications()
  }

  async function handleDelete(id: string) {
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchApplications()
  }

  const active = applications.filter(a => ['applied', 'oa', 'interviewing'].includes(a.status)).length
  const interviews = applications.filter(a => a.status === 'interviewing').length
  const offers = applications.filter(a => a.status === 'offer').length

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
            Application Pipeline
          </h2>
          <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
            {applications.length} total applications tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-white/5">
            <button className="px-3 py-1.5 text-[11px] font-semibold bg-white/10 text-white shadow-sm rounded-md transition-colors">
              Kanban
            </button>
            <button className="px-3 py-1.5 text-[11px] font-semibold text-white/45 hover:text-white rounded-md transition-colors">
              Table
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/5 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[15px]">tune</span>
            Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/5 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[15px]">checklist</span>
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Kanban / empty state */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-white/30 text-sm animate-pulse uppercase tracking-widest">Loading pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[48px] font-light font-serif-lux italic text-white/20 tracking-tight">No applications yet</p>
          <p className="text-xs text-white/35 mt-3 uppercase tracking-wider">Apply to jobs from the job feed to start tracking.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 mt-6 px-5 py-1.5 bg-white text-black rounded text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">work</span>
            Browse Jobs
          </Link>
        </div>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {/* Floating bottom bar */}
      {applications.length > 0 && (
        <div
          className="fixed bottom-6 right-6 bg-[#030303]/90 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md flex justify-between items-center z-30 gap-8"
          style={{ left: 'calc(220px + 1.5rem)' }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Active Apps</span>
              <span className="text-lg font-light font-serif-lux text-white">{String(active).padStart(2, '0')}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Interviews</span>
              <span className="text-lg font-light font-serif-lux text-white">{String(interviews).padStart(2, '0')}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Offers</span>
              <span className="text-lg font-light font-serif-lux text-white">{String(offers).padStart(2, '0')}</span>
            </div>
          </div>
          <button
            onClick={() => setIntelligenceOn(!intelligenceOn)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              intelligenceOn
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-[#151515] text-white/50 border border-white/10 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">smart_toy</span>
            System Intelligence {intelligenceOn ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </div>
  )
}
