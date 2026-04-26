import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block label-sm text-on-surface-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          'w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-xl',
          'border border-border-subtle',
          'outline-none focus:ring-2 focus:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'appearance-none',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
)
Select.displayName = 'Select'
