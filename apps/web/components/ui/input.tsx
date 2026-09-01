import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block label-sm text-on-surface-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-[10px]',
          'border border-border-subtle',
          'outline-none focus:ring-2 focus:ring-primary/30',
          'placeholder:text-on-surface-muted/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'
