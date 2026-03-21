import type { Application, ApplicationStatus } from '@/lib/types'

const STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'applied',      label: 'Applied' },
  { status: 'oa',           label: 'OA' },
  { status: 'interviewing', label: 'Interviewing' },
  { status: 'offer',        label: 'Offer' },
  { status: 'rejected',     label: 'Rejected' },
]

interface Props { applications: Application[] }

export function ApplicationFunnel({ applications }: Props) {
  const counts = STAGES.reduce((acc, { status }) => {
    acc[status] = applications.filter(a => a.status === status).length
    return acc
  }, {} as Record<ApplicationStatus, number>)

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Pipeline
      </h2>
      {STAGES.map(({ status, label }) => (
        <div key={status} className="flex items-center justify-between py-1">
          <span className="text-sm">{label}</span>
          <span className="text-sm font-medium tabular-nums">{counts[status] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}
