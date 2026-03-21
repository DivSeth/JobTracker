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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Applications</h1>
      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No applications yet. Save jobs from the Jobs page to start tracking.
        </p>
      ) : (
        <ApplicationKanban
          applications={applications}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
