'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApplicationWithJob } from '@/lib/types'

interface Props { application: ApplicationWithJob }

export function ApplicationDetail({ application: app }: Props) {
  const [notes, setNotes] = useState(app.notes ?? '')

  const appliedDate = app.applied_at
    ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : 'Unknown'

  async function saveNotes() {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, notes }),
    })
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-lg font-semibold text-on-surface-muted">
            {(app.job?.company ?? 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Badge status={app.status}>{app.status.toUpperCase()}</Badge>
            </div>
            <h1 className="text-2xl font-semibold text-on-surface mt-1">
              {app.job?.title ?? 'Manual Entry'}
            </h1>
            {app.job?.company && (
              <p className="text-sm font-medium text-on-surface-muted">{app.job.company}</p>
            )}
            {app.job?.location && (
              <p className="text-sm text-on-surface-muted">{app.job.location}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm">Edit Details</Button>
          <Button variant="primary" size="sm">Update Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Status Timeline (Phase 2A: applied_at only) */}
        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-4">Status Timeline</h2>
            <div className="relative pl-6">
              {/* Rail */}
              <div className="absolute left-2 top-2 bottom-0 w-px bg-outline-variant/20" />
              {/* Current status dot */}
              <div className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-card" />
              <div className="space-y-1">
                <p className="text-xs text-on-surface-muted">Applied · {appliedDate}</p>
              </div>
            </div>
          </div>

          {/* Communications placeholder */}
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-3">Communications</h2>
            <div className="bg-surface-container rounded-xl p-6 text-center">
              <p className="text-sm text-on-surface-muted">
                Connect Gmail to see emails · Coming in Phase 2B
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notes + Deadlines */}
        <div className="space-y-5">
          {/* Deadlines stub */}
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Deadlines</h3>
              <button disabled className="label-sm text-on-surface-muted/50 cursor-not-allowed" title="Coming soon">
                + Add Reminder
              </button>
            </div>
            <p className="text-xs text-on-surface-muted/60 text-center py-2">No deadlines yet</p>
          </div>

          {/* Interview Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Interview Notes</h3>
            <textarea
              className="w-full h-36 bg-surface-card rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-[#0053db]/20 resize-none placeholder:text-on-surface-muted/50"
              placeholder="Interview notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
