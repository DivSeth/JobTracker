import { Badge } from '@/components/ui/badge'
import type { JobWithScore } from '@/lib/types'

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
}

interface Props {
  job: JobWithScore
  featured?: boolean
}

export function JobCard({ job, featured }: Props) {
  const score = job.job_scores?.[0]?.score

  return (
    <div className="bg-surface-card rounded-xl shadow-ambient p-5 flex flex-col gap-4 hover:shadow-[0_16px_48px_rgba(42,52,57,0.10)] transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Company logo placeholder */}
        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-sm font-semibold text-on-surface-muted shrink-0">
          {job.company.slice(0, 2).toUpperCase()}
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
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-4 gradient-primary text-white text-xs font-medium rounded-xl inline-flex items-center hover:opacity-90 transition-opacity"
          >
            Apply ↗
          </a>
        ) : (
          <span className="text-xs text-on-surface-muted/50">No link</span>
        )}
      </div>
    </div>
  )
}
