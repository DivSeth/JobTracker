'use client'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'applied',      label: 'APPLIED',      color: '#2563eb' },
  { id: 'oa',           label: 'OA',           color: '#7c3aed' },
  { id: 'interviewing', label: 'INTERVIEWING', color: '#0891b2' },
  { id: 'offer',        label: 'OFFER',        color: '#16a34a' },
  { id: 'rejected',     label: 'REJECTED',     color: '#dc2626' },
]

interface Props { applications: ApplicationWithJob[] }

export function PipelineKanban({ applications }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map(col => {
        const cards = applications.filter(a => a.status === col.id)
        return (
          <div key={col.id} className="min-w-[180px] flex-1 flex-shrink-0 space-y-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <span className="label-sm text-on-surface-muted">{col.label}</span>
              <span className="label-sm text-on-surface bg-surface-container px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.map(app => (
                <div
                  key={app.id}
                  className="bg-surface-card rounded-xl p-3 shadow-ambient space-y-1"
                  style={{ borderLeft: `4px solid ${col.color}` }}
                >
                  <p className="text-sm font-medium text-on-surface truncate">
                    {app.job?.company ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-on-surface-muted truncate">
                    {app.job?.title ?? 'Manual Entry'}
                  </p>
                  <p className="text-[0.6875rem] text-on-surface-muted/60">
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : new Date(app.last_activity_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
              {/* Empty state */}
              {cards.length === 0 && (
                <div className="h-16 rounded-xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                  <span className="label-sm text-on-surface-muted/40">Empty</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
