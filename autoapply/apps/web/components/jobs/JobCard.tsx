'use client'

import { useState } from 'react'
import { MatIcon } from '@/components/ui/mat-icon'
import { cn, stripHtml, extractCompanyDomain } from '@/lib/utils'
import type { JobWithScore } from '@/lib/types'

function formatLocation(raw: string): string {
  const stripped = stripHtml(raw)
  const commaCount = (stripped.match(/,/g) || []).length
  if (commaCount >= 3 || stripped.toLowerCase().includes('location')) return 'Multiple Locations'
  return stripped.length > 60 ? stripped.slice(0, 60) + '…' : stripped
}

interface Props {
  job: JobWithScore
  featured?: boolean
}

export function JobCard({ job, featured }: Props) {
  const [hidden, setHidden] = useState(false)
  const [applied, setApplied] = useState(false)
  const [pendingApply, setPendingApply] = useState(false)
  const score = job.job_scores?.[0]?.score

  const logoUrl = job.company_logo_url
    || (job.company_domain ? `https://www.google.com/s2/favicons?domain=${job.company_domain}&sz=64` : null)
    || (job.company.includes('↳') ? null : `https://www.google.com/s2/favicons?domain=${extractCompanyDomain(job.apply_url, job.company)}&sz=64`)
  const [logoFailed, setLogoFailed] = useState(false)

  if (hidden) return null

  async function handleHide() {
    await fetch('/api/jobs/' + job.id + '/hide', { method: 'PATCH' })
    setHidden(true)
  }

  function handleApplyClick() {
    if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    setPendingApply(true)
  }

  async function handleMarkApplied() {
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, status: 'applied', applied_at: new Date().toISOString(), source: 'manual' }),
      })
      setApplied(true)
      setPendingApply(false)
      setTimeout(() => { setApplied(false); setHidden(true) }, 1500)
    } catch { setPendingApply(false) }
  }

  return (
    <div className={cn(
      'break-inside-avoid bg-surface-card rounded-xl border border-outline-variant p-5',
      'transition-all hover:scale-[1.01] border-glow-hover flex flex-col gap-4 mesh-gradient-card',
      featured && 'border-beam-active'
    )}>
      {/* Header: logo + title + hide */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center text-sm font-semibold text-on-surface-variant shrink-0 p-2">
          {logoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={job.company} className="w-full h-full object-contain" onError={() => setLogoFailed(true)} />
          ) : (
            <span>{job.company.includes('↳') ? '?' : job.company.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-on-surface leading-snug">{job.title}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {job.company.includes('↳') ? 'Company N/A' : job.company}
          </p>
          {job.location && (
            <p className="text-xs text-outline mt-0.5">{formatLocation(job.location)}</p>
          )}
        </div>
        <button
          onClick={handleHide}
          title="Hide job"
          className="text-outline/40 hover:text-error-vibrant transition-colors text-sm leading-none shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {featured && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            FEATURED
          </span>
        )}
        {score != null && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-success-vibrant/10 text-success-vibrant">
            {score}% match
          </span>
        )}
        {job.job_type && (
          <span className="label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {job.job_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Salary / apply footer */}
      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 mt-auto">
        <div>
          {job.salary_min && job.salary_max ? (
            <span className="text-xs text-on-surface-variant">
              ${Math.round(job.salary_min / 1000)}k – ${Math.round(job.salary_max / 1000)}k
            </span>
          ) : (
            <span className="text-xs text-outline">Salary N/A</span>
          )}
        </div>

        {job.apply_url ? (
          <div className="flex items-center gap-1">
            {applied ? (
              <span className="h-7 px-3 bg-success-vibrant text-white text-xs font-medium rounded-full inline-flex items-center gap-1">
                <MatIcon size={12}>check</MatIcon> Applied
              </span>
            ) : pendingApply ? (
              <>
                <button
                  onClick={handleMarkApplied}
                  className="h-7 px-3 bg-success-vibrant text-white text-xs font-medium rounded-full inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  <MatIcon size={12}>check</MatIcon> Mark Applied
                </button>
                <button onClick={() => setPendingApply(false)} className="text-outline/40 hover:text-outline transition-colors ml-1 text-xs">×</button>
              </>
            ) : (
              <button
                onClick={handleApplyClick}
                className={cn(
                  'h-7 px-3 text-white text-xs font-medium rounded-full inline-flex items-center gap-1.5 transition-all',
                  'bg-gradient-to-br from-primary-container to-electric-indigo hover:opacity-90'
                )}
              >
                Apply <MatIcon size={12}>arrow_outward</MatIcon>
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-outline/50">No link</span>
        )}
      </div>
    </div>
  )
}
