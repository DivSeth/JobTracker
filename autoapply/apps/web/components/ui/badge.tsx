import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  saved:        'bg-on-surface-muted/15 text-on-surface-muted',
  applied:      'bg-primary/15 text-primary',
  oa:           'bg-primary/15 text-primary',
  interviewing: 'bg-primary/10 text-primary',
  offer:        'bg-success/15 text-success',
  rejected:     'bg-error/15 text-error',
  internship:   'bg-primary/15 text-primary',
  new_grad:     'bg-primary/10 text-primary',
  full_time:    'bg-success/15 text-success',
}

interface BadgeProps {
  children: ReactNode
  status?: string
  className?: string
}

export function Badge({ children, status, className }: BadgeProps) {
  const style = status ? STATUS_STYLES[status] ?? 'bg-on-surface/10 text-on-surface' : 'bg-surface-container text-on-surface-muted'
  return (
    <span className={cn('label-sm px-2 py-0.5 rounded-lg', style, className)}>
      {children}
    </span>
  )
}
