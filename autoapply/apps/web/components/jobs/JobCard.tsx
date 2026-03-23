'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { JobWithScore } from '@/lib/types'

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
}

function getCompanyDomain(applyUrl: string | null, company: string): string | null {
  if (applyUrl) {
    try {
      return new URL(applyUrl).hostname.replace('www.', '')
    } catch { /* invalid URL */ }
  }
  return null
}

interface Props {
  job: JobWithScore
  featured?: boolean
}

export function JobCard({ job, featured }: Props) {
  const [hidden, setHidden] = useState(false)
  const [applied, setApplied] = useState(false)
  const score = job.job_scores?.[0]?.score

  const domain = getCompanyDomain(job.apply_url, job.company)
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null
  const [logoFailed, setLogoFailed] = useState(false)

  if (hidden) return null

  async function handleHide() {
    await fetch('/api/jobs/' + job.id + '/hide', { method: 'PATCH' })
    setHidden(true)
  }

  async function handleApply() {
    if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          status: 'applied',
          applied_at: new Date().toISOString(),
          source: 'manual',
        }),
      })
      setApplied(true)
      setTimeout(() => setApplied(false), 2000)
    } catch { /* silent — URL already opened */ }
  }

  return (
    <div className="bg-surface-card rounded-xl shadow-ambient p-5 flex flex-col gap-4 hover:shadow-[0_16px_48px_rgba(42,52,57,0.10)] transition-all border-t-2 border-transparent hover:border-[#0053db]/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Company logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0053db]/20 to-[#6366f1]/20 flex items-center justify-center text-sm font-semibold text-[#0053db] shrink-0 overflow-hidden">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={job.company}
              className="w-full h-full object-contain p-1.5"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span>{job.company.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {featured && (
            <span className="label-sm px-2 py-0.5 rounded-lg bg-[#0053db]/10 text-[#0053db]">
              FEATURED
            </span>
          )}
          {score != null && (
            <span className="label-sm px-2 py-0.5 rounded-lg bg-green-500/10 text-green-700">
              {score}%
            </span>
          )}
          <button
            onClick={handleHide}
            title="Hide job"
            className="text-on-surface-muted/30 hover:text-red-400 transition-colors text-xs leading-none ml-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* Title + company */}
      <div className="space-y-0.5 flex-1">
        <h3 className="text-sm font-semibold text-on-surface leading-snug">{job.title}</h3>
        <p className="text-sm text-on-surface-muted">{job.company}</p>
        {job.location && (() => {
          const loc = stripHtml(job.location)
          return <p className="text-xs text-on-surface-muted/70">{loc.length > 60 ? loc.slice(0, 60) + '…' : loc}</p>
        })()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {job.job_type && (
            <Badge className="label-sm">
              {job.job_type.replace('_', ' ')}
            </Badge>
          )}
        </div>
        {job.apply_url ? (
          <button
            onClick={handleApply}
            className={cn(
              'h-8 px-4 text-white text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-all',
              applied ? 'bg-green-500' : 'gradient-primary hover:opacity-90'
            )}
          >
            {applied ? '✓ Applied' : (<>Apply <ArrowUpRight size={13} /></>)}
          </button>
        ) : (
          <span className="text-xs text-on-surface-muted/50">No link</span>
        )}
      </div>
    </div>
  )
}
