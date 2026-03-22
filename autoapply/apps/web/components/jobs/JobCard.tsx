import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { JobWithScore } from '@/lib/types'

interface Props {
  job: JobWithScore
  onSave?: (jobId: string) => void
}

export function JobCard({ job, onSave }: Props) {
  const topScore = job.job_scores?.[0]
  const score = topScore?.score
  const matchingSkills = topScore?.matching_skills ?? []
  const skillGaps = topScore?.skill_gaps ?? []

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {score != null && (
              <span className="text-sm font-semibold text-primary tabular-nums">{score}%</span>
            )}
            <h3 className="font-semibold truncate">{job.title}</h3>
          </div>
          <p className="text-on-surface-muted text-sm">{job.company}</p>
          {job.location && (
            <p className="text-xs text-on-surface-muted">{job.location}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Apply ↗
            </a>
          )}
          {onSave && (
            <Button size="sm" variant="secondary" onClick={() => onSave(job.id)}>
              Save
            </Button>
          )}
        </div>
      </div>

      {(matchingSkills.length > 0 || skillGaps.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {matchingSkills.map(s => (
            <Badge key={s} className="text-xs">✓ {s}</Badge>
          ))}
          {skillGaps.map(s => (
            <Badge key={s} className="text-xs text-amber-600">⚠ {s}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-on-surface-muted">
        {job.job_type && (
          <Badge status={job.job_type}>{job.job_type.replace('_', ' ')}</Badge>
        )}
        {job.source_url && (
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {job.source_url.split('/').slice(-2).join('/')}
          </a>
        )}
      </div>
    </Card>
  )
}
