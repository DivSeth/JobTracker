import type { ApplicationWithJob } from '@/lib/types'

interface Props { applications: ApplicationWithJob[]; jobCount: number }

export function StatsBar({ applications, jobCount }: Props) {
  const applied = applications.filter(a => a.status !== 'saved').length
  const oa = applications.filter(a => ['oa','interviewing','offer'].includes(a.status)).length
  const oaRate = applied > 0 ? Math.round((oa / applied) * 100) : 0

  return (
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">OA RATE</p>
        <p className="text-2xl font-semibold text-on-surface">{oaRate}%</p>
      </div>
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">VOLUME</p>
        <p className="text-2xl font-semibold text-on-surface">{applied} sent</p>
      </div>
      <div className="text-right">
        <p className="label-sm text-on-surface-muted">JOBS</p>
        <p className="text-2xl font-semibold text-on-surface">{jobCount}</p>
      </div>
    </div>
  )
}
