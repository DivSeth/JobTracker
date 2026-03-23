import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all rounded-xl',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'gradient-primary text-white hover:opacity-90',
        variant === 'secondary' && 'bg-surface-container text-on-surface hover:bg-surface-container-highest',
        variant === 'ghost' && 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-9 px-4 text-sm',
        size === 'lg' && 'h-11 px-6 text-sm',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
