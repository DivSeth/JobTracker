import { AlertTriangle } from 'lucide-react'
import type { GreenhouseField } from '@/lib/greenhouse/types'

interface Props {
  field: GreenhouseField
}

export function UnmappedRow({ field }: Props) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
      <p className="text-[14px] text-on-surface-muted">{field.label}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium text-warning">
        <AlertTriangle data-testid="unmapped-icon" className="h-4 w-4" />
        <span>No match</span>
      </div>
    </div>
  )
}
