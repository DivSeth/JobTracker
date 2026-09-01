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
    { id: 'rejected'     as ApplicationStatus, label: 'Rejected' },
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
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function CompanyLogo({ applyUrl, company }: { applyUrl?: string | null, company: string }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = getLogoUrl(applyUrl, company)
  return (
    <div className="w-8 h-8 rounded bg-[#151515] border border-white/5 flex items-center justify-center text-xs font-bold text-white/50 overflow-hidden shrink-0">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={company} className="w-full h-full object-contain p-1 grayscale" onError={() => setFailed(true)} />
      ) : (
        <span>{company.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}

interface Props {
  applications: ApplicationWithJob[]
  onStatusChange: (id: string, newStatus: ApplicationStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ApplicationKanban({ applications, onStatusChange, onDelete }: Props) {
  const columns = getStatusColumns()

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const cards = applications.filter(a =>
          col.id === 'rejected' ? (a.status === 'rejected' || a.status === 'ghosted') : a.status === col.id
        )
        return (
          <div key={col.id} className="flex-shrink-0 w-80">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <h3 className="font-medium text-xs text-white uppercase tracking-widest">{col.label}</h3>
              <span className="ml-auto text-[9px] font-bold text-white/40 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.map(app => {
                const next = STATUS_TRANSITIONS[app.status]
                const job = app.job as { title?: string; company?: string; apply_url?: string | null; location?: string | null } | null
                const company = job?.company?.includes('↳') ? 'Unknown' : (job?.company ?? 'Unknown')
                return (
                  <div key={app.id} className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl hover:border-white/15 transition-all group">
                    {/* Logo + company + delete */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <CompanyLogo applyUrl={job?.apply_url} company={company} />
                      <Link href={`/applications/${app.id}`} className="text-[11px] text-white/60 truncate font-medium hover:text-white flex-1 transition-colors">
                        {company}
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Remove this application?')) onDelete(app.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 transition-all text-lg leading-none"
                        title="Remove application"
                      >
                        ×
                      </button>
                    </div>

                    {/* Title */}
                    <Link href={`/applications/${app.id}`}>
                      <p className="text-xs font-semibold text-white line-clamp-2 leading-snug mb-1 hover:text-white/70 transition-colors">
                        {job?.title ?? 'Manual Entry'}
                      </p>
                    </Link>

                    {/* Location + Date */}
                    {job?.location && (
                      <p className="text-[11px] text-white/40 mb-1 truncate">{job.location}</p>
                    )}
                    {app.applied_at && (
                      <p className="text-[10px] text-white/30 mb-3 font-mono">
                        {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1.5">
                      {next && (
                        <button
                          onClick={() => onStatusChange(app.id, next)}
                          className="flex-1 text-[10px] py-1.5 rounded bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/15 text-white/50 hover:text-white transition-all text-center font-medium uppercase tracking-widest"
                        >
                          {next.replace('_', ' ')} →
                        </button>
                      )}
                      {app.status !== 'rejected' && app.status !== 'ghosted' && (
                        <button
                          onClick={() => onStatusChange(app.id, 'rejected')}
                          className="text-[10px] py-1.5 px-2.5 rounded bg-[#141414] hover:bg-white/5 border border-white/5 text-white/30 hover:text-white/60 transition-all"
                          title="Mark as rejected"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {cards.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-[10px] text-white/25 uppercase tracking-widest">
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
