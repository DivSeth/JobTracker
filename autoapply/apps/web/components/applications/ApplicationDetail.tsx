'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

const ALL_STATUSES: { id: ApplicationStatus; label: string }[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'oa', label: 'OA' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'ghosted', label: 'Ghosted' },
]

interface Props { application: ApplicationWithJob }

export function ApplicationDetail({ application: initial }: Props) {
  const router = useRouter()
  const [app, setApp] = useState(initial)
  const [notes, setNotes] = useState(app.notes ?? '')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  const displayCompany = app.job?.company?.includes('↳')
    ? 'Unknown'
    : (app.job?.company ?? 'Unknown')

  const appliedDate = app.applied_at
    ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : 'Unknown'

  async function updateField(updates: Record<string, unknown>) {
    setSaving(true)
    const res = await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, ...updates }),
    })
    const data = await res.json()
    if (data.id) setApp({ ...app, ...data })
    setSaving(false)
  }

  async function handleStatusChange(newStatus: ApplicationStatus) {
    await updateField({ status: newStatus })
    setShowStatusMenu(false)
  }

  async function saveNotes() {
    await updateField({ notes })
  }

  async function handleDelete() {
    if (!confirm('Remove this application? This cannot be undone.')) return
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id }),
    })
    router.push('/applications')
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Back link */}
      <button
        onClick={() => router.push('/applications')}
        className="flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface transition-colors"
      >
        <ArrowLeft size={14} /> Back to applications
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-lg font-semibold text-on-surface-muted">
            {displayCompany.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Badge status={app.status}>{app.status.replace('_', ' ').toUpperCase()}</Badge>
              {saving && <span className="text-xs text-on-surface-muted/50">Saving...</span>}
            </div>
            <h1 className="text-2xl font-semibold text-on-surface mt-1">
              {app.job?.title ?? 'Manual Entry'}
            </h1>
            <p className="text-sm font-medium text-on-surface-muted">{displayCompany}</p>
            {app.job?.location && (
              <p className="text-sm text-on-surface-muted/70">{app.job.location}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0 relative">
          {app.job?.apply_url && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(app.job!.apply_url!, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={13} className="mr-1.5" /> Open Listing
            </Button>
          )}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              Update Status
            </Button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-surface-card rounded-xl shadow-lg border border-on-surface/5 py-1 min-w-[160px]">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleStatusChange(s.id)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-container transition-colors ${
                      app.status === s.id ? 'text-primary font-medium' : 'text-on-surface'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-on-surface-muted/50 hover:text-red-400"
            title="Delete application"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Status Timeline */}
        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-4">Status Timeline</h2>
            <div className="relative pl-6 space-y-4">
              {/* Rail */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-outline-variant/20" />
              {/* Status entry */}
              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-card" />
                <p className="text-sm text-on-surface">
                  <span className="font-medium capitalize">{app.status.replace('_', ' ')}</span>
                  <span className="text-on-surface-muted/60 ml-2">{appliedDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Communications placeholder */}
          <div>
            <h2 className="text-sm font-semibold text-on-surface mb-3">Communications</h2>
            <div className="bg-surface-container rounded-xl p-6 text-center">
              <p className="text-sm text-on-surface-muted">
                Connect Gmail to see emails · Coming soon
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
              className="w-full h-36 bg-surface-card rounded-xl p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-on-surface-muted/50"
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
