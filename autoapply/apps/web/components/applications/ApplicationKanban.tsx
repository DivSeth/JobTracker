'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { ApplicationWithJob, ApplicationStatus } from '@/lib/types'

export function getStatusColumns() {
  return [
    { id: 'saved'        as ApplicationStatus, label: 'Saved' },
    { id: 'applied'      as ApplicationStatus, label: 'Applied' },
    { id: 'oa'           as ApplicationStatus, label: 'OA' },
    { id: 'interviewing' as ApplicationStatus, label: 'Interviewing' },
    { id: 'offer'        as ApplicationStatus, label: 'Offer' },
  ]
}

export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus | null> = {
  saved:        'applied',
  applied:      'oa',
  oa:           'interviewing',
  interviewing: 'offer',
  offer:        null,
  rejected:     null,
  ghosted:      null,
}

const STATUS_ACCENT: Record<string, string> = {
  saved:        'border-gray-300',
  applied:      'border-primary',
  oa:           'border-amber-400',
  interviewing: 'border-purple-500',
  offer:        'border-green-500',
  rejected:     'border-red-400',
  ghosted:      'border-gray-200',
}

const STATUS_DOT: Record<string, string> = {
  saved:        'bg-gray-300',
  applied:      'bg-primary',
  oa:           'bg-amber-400',
  interviewing: 'bg-purple-500',
  offer:        'bg-green-500',
  rejected:     'bg-red-400',
  ghosted:      'bg-gray-200',
}

const JOB_BOARD_DOMAINS = new Set([
  'simplify.jobs', 'lever.co', 'greenhouse.io', 'workday.com',
  'myworkdayjobs.com', 'linkedin.com', 'indeed.com', 'glassdoor.com',
  'jobs.lever.co', 'boards.greenhouse.io', 'apply.workable.com',
  'smartrecruiters.com', 'icims.com', 'taleo.net', 'brassring.com',
])

function getLogoUrl(applyUrl: string | null | undefined, company: string): string {
  let domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  if (applyUrl) {
    try {
      const hostname = new URL(applyUrl).hostname.replace('www.', '')
      if (!JOB_BOARD_DOMAINS.has(hostname)) domain = hostname
    } catch { /* ignore */ }
  }
  return `https://logo.clearbit.com/${domain}`
}

function CompanyLogo({ applyUrl, company }: { applyUrl?: string | null, company: string }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = getLogoUrl(applyUrl, company)
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden shrink-0">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={company} className="w-full h-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <span>{company.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}

interface Props {
  applications: ApplicationWithJob[]
  onStatusChange: (id: string, newStatus: ApplicationStatus) => Promise<void>
}

export function ApplicationKanban({ applications, onStatusChange }: Props) {
  const columns = getStatusColumns()

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const cards = applications.filter(a => a.status === col.id)
        return (
          <div key={col.id} className="min-w-[240px] w-[240px] shrink-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[col.id]}`} />
              <h3 className="font-semibold text-sm text-on-surface">{col.label}</h3>
              <span className="ml-auto text-xs font-medium text-on-surface-muted bg-surface-container px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.map(app => {
                const next = STATUS_TRANSITIONS[app.status]
                const job = app.job as { title?: string; company?: string; apply_url?: string | null } | null
                return (
                  <Link href={`/applications/${app.id}`} key={app.id}>
                    <div className={`bg-surface-card rounded-2xl p-4 shadow-ambient hover:shadow-[0_8px_24px_rgba(42,52,57,0.10)] transition-all cursor-pointer border-l-4 ${STATUS_ACCENT[app.status]} mb-2`}>
                      {/* Logo + company row */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <CompanyLogo applyUrl={job?.apply_url} company={job?.company ?? 'Unknown'} />
                        <span className="text-xs text-on-surface-muted truncate font-medium">
                          {job?.company ?? '—'}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-semibold text-on-surface line-clamp-2 leading-snug mb-2">
                        {job?.title ?? 'Manual Entry'}
                      </p>

                      {/* Date */}
                      {app.applied_at && (
                        <p className="text-xs text-on-surface-muted/60 mb-3">
                          {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}

                      {/* Transition button */}
                      {next && (
                        <button
                          onClick={e => { e.preventDefault(); onStatusChange(app.id, next) }}
                          className="w-full text-xs py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-highest text-on-surface-muted hover:text-on-surface transition-colors text-center"
                        >
                          Move to {next.replace('_', ' ')} →
                        </button>
                      )}
                    </div>
                  </Link>
                )
              })}

              {cards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-on-surface/10 p-4 text-center text-xs text-on-surface-muted/40">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
