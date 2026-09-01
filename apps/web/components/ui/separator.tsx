import { cn } from '@/lib/utils'

interface SeparatorProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ className, orientation = 'horizontal' }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'bg-border-subtle',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className
      )}
    />
  )
}
