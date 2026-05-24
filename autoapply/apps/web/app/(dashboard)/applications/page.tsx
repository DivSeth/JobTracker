'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ApplicationKanban } from '@/components/applications/ApplicationKanban'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)

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
  const interviews = applications.filter(a => ['interviewing'].includes(a.status)).length
  const offers = applications.filter(a => a.status === 'offer').length

  return (
    <div className="p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant uppercase tracking-widest font-semibold mb-1">
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Application Pipeline</span>
          </div>
          <h1 className="text-[24px] font-bold text-on-surface">Application Pipeline</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
            <button className="px-3 py-1.5 text-[12px] font-medium bg-surface-container-high text-primary shadow-sm rounded-md transition-colors">
              Kanban
            </button>
            <button className="px-3 py-1.5 text-[12px] font-medium text-on-surface-variant hover:text-primary rounded-md transition-colors">
              Table
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-[12px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-[12px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Kanban / empty state */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-on-surface-variant text-sm animate-pulse">Loading pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[48px] font-light text-on-surface-variant/30 tracking-tight">No applications yet</p>
          <p className="text-sm text-on-surface-variant mt-3">Apply to jobs from the Job Feed to start tracking.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gradient-to-br from-primary-container to-electric-indigo text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">work</span>
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

      {/* Floating info bar */}
      {applications.length > 0 && (
        <div
          className="fixed bottom-6 right-6 glass border border-outline-variant px-6 py-3 rounded-2xl flex justify-between items-center z-30 gap-8"
          style={{ left: 'calc(220px + 1.5rem)' }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">Active Apps</span>
              <span className="text-[18px] font-bold text-on-surface">{String(active).padStart(2, '0')}</span>
            </div>
            <div className="w-px h-4 bg-outline-variant" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">Interviews</span>
              <span className="text-[18px] font-bold text-on-surface">{String(interviews).padStart(2, '0')}</span>
            </div>
            <div className="w-px h-4 bg-outline-variant" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">Offers</span>
              <span className="text-[18px] font-bold text-success-vibrant">{String(offers).padStart(2, '0')}</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-electric-indigo/10 border border-electric-indigo/30 text-electric-indigo text-[12px] font-bold hover:bg-electric-indigo/20 transition-colors">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            System Intelligence ON
          </button>
        </div>
      )}
    </div>
  )
}
