'use client'

import { useState } from 'react'
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
      'break-inside-avoid bg-[#0a0a0a] rounded-xl border border-white/5 p-5',
      'transition-all hover:border-white/20 flex flex-col gap-4 group',
      featured && 'border-white/15'
    )}>
      {/* Header: logo + title + hide */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#151515] border border-white/5 overflow-hidden flex items-center justify-center text-xs font-bold text-white/50 shrink-0">
          {logoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={job.company}
              className="w-full h-full object-contain p-1.5 grayscale group-hover:grayscale-0 transition-all"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span>{job.company.includes('↳') ? '?' : job.company.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-white leading-snug">{job.title}</h3>
          <p className="text-[11px] text-white/70 mt-0.5">
            {job.company.includes('↳') ? 'Company N/A' : job.company}
          </p>
          {job.location && (
            <p className="text-[11px] text-white/40 mt-0.5">{formatLocation(job.location)}</p>
          )}
        </div>
        <button
          onClick={handleHide}
          title="Hide job"
          className="text-white/20 hover:text-white/60 transition-colors text-lg leading-none shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {featured && (
          <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white text-black">
            FEATURED
          </span>
        )}
        {score != null && (
          <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
            {score}% MATCH
          </span>
        )}
        {job.job_type && (
          <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
            {job.job_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Salary / apply footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
        <div>
          {job.salary_min && job.salary_max ? (
            <span className="text-[11px] text-white/60 font-mono">
              ${Math.round(job.salary_min / 1000)}k – ${Math.round(job.salary_max / 1000)}k
            </span>
          ) : (
            <span className="text-[11px] text-white/30">Salary N/A</span>
          )}
        </div>

        {job.apply_url ? (
          <div className="flex items-center gap-1">
            {applied ? (
              <span className="h-7 px-3 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded inline-flex items-center gap-1">
                ✓ Applied
              </span>
            ) : pendingApply ? (
              <>
                <button
                  onClick={handleMarkApplied}
                  className="h-7 px-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded inline-flex items-center gap-1 hover:bg-neutral-200 transition-all"
                >
                  ✓ Mark Applied
                </button>
                <button onClick={() => setPendingApply(false)} className="text-white/20 hover:text-white/50 transition-colors ml-1 text-lg">×</button>
              </>
            ) : (
              <button
                onClick={handleApplyClick}
                className="h-7 px-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded inline-flex items-center gap-1.5 hover:bg-neutral-200 transition-all"
              >
                Apply
                <span className="material-symbols-outlined text-[12px]">arrow_outward</span>
              </button>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-white/20">No link</span>
        )}
      </div>
    </div>
  )
}
