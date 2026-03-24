'use client'
import { useState, useEffect, useCallback } from 'react'
import { ApplicationKanban } from '@/components/applications/ApplicationKanban'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])

  const fetchApplications = useCallback(async () => {
    const r = await fetch('/api/applications')
    const data = await r.json()
    setApplications(Array.isArray(data) ? data : [])
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Applications</h1>
        <p className="text-sm text-on-surface-muted mt-1">
          {applications.length} tracked application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>
      {applications.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl font-light text-on-surface-muted/30 tracking-tight">No applications yet</p>
          <p className="text-sm text-on-surface-muted mt-3">Apply to jobs from the Job Feed to start tracking.</p>
        </div>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
