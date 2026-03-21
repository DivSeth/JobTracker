'use client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
          <div key={col.id} className="min-w-[180px] space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
            </div>
            {cards.map(app => {
              const next = STATUS_TRANSITIONS[app.status]
              return (
                <Card key={app.id} className="p-3 space-y-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {app.job?.company ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {app.job?.title ?? 'Manual Entry'}
                  </p>
                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={() => onStatusChange(app.id, next)}
                    >
                      → {next.replace('_', ' ')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
