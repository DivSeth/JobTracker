import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const VARIANT_STYLES = {
  default:  'bg-surface-container text-on-surface-muted',
  success:  'bg-success/15 text-success',
  warning:  'bg-amber-500/15 text-amber-600',
  error:    'bg-error/15 text-error',
  muted:    'bg-on-surface-muted/10 text-on-surface-muted',
  primary:  'bg-primary/15 text-primary',
} as const

const STATUS_VARIANT: Record<string, keyof typeof VARIANT_STYLES> = {
  saved:        'muted',
  applied:      'primary',
  oa:           'primary',
  interviewing: 'primary',
  offer:        'success',
  rejected:     'error',
  internship:   'primary',
  new_grad:     'primary',
  full_time:    'success',
}

interface BadgeProps {
  children: ReactNode
  status?: string
  variant?: keyof typeof VARIANT_STYLES
  className?: string
}

export function Badge({ children, status, variant, className }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? (STATUS_VARIANT[status] ?? 'muted') : 'default')
  return (
    <span className={cn('label-sm px-2 py-0.5 rounded-full', VARIANT_STYLES[resolvedVariant], className)}>
      {children}
    </span>
  )
}
