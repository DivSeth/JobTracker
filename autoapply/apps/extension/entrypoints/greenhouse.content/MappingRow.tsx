import { CheckCircle2, ChevronRight, Circle, Lock, XCircle } from 'lucide-react'
import type { FillStatus, GreenhouseField } from '@/lib/greenhouse/types'

interface Props {
  field: GreenhouseField
  profileValue: string
  isMasked: boolean
  status: FillStatus
}

function StatusIcon({ status }: { status: FillStatus }) {
  if (status === 'filled') {
    return <CheckCircle2 data-testid="status-filled" className="h-4 w-4 text-success" />
  }

  if (status === 'error') {
    return <XCircle data-testid="status-error" className="h-4 w-4 text-error" />
  }

  return <Circle data-testid="status-pending" className="h-4 w-4 text-on-surface-muted" />
}

export function MappingRow({ field, profileValue, isMasked, status }: Props) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-outline-variant/70 bg-surface-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-on-surface-muted">{field.label}</p>
        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-on-surface">
          <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-muted" />
          {isMasked ? (
            <span data-testid="masked-value" className="flex items-center gap-1.5">
              <Lock data-testid="masked-lock-icon" className="h-3.5 w-3.5 text-on-surface-muted" />
              [protected]
            </span>
          ) : (
            <span className="truncate">{profileValue}</span>
          )}
        </div>
      </div>
      <StatusIcon status={status} />
    </div>
  )
}
