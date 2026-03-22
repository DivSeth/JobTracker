import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  saved:        'bg-slate-500/15 text-slate-700',
  applied:      'bg-blue-600/15 text-blue-700',
  oa:           'bg-violet-600/15 text-violet-700',
  interviewing: 'bg-cyan-600/15 text-cyan-700',
  offer:        'bg-green-600/15 text-green-700',
  rejected:     'bg-red-600/15 text-red-700',
  internship:   'bg-violet-500/15 text-violet-700',
  new_grad:     'bg-blue-500/15 text-blue-700',
  full_time:    'bg-emerald-500/15 text-emerald-700',
}

interface BadgeProps {
  children: React.ReactNode
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
