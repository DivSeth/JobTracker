'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  iconClassName?: string
  delta?: string
  deltaPositive?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  delta,
  deltaPositive,
  className,
}: StatCardProps) {
  const numValue = typeof value === 'number' ? value : null
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (numValue === null || !ref.current) return
    const controls = animate(0, numValue, {
      duration: 0.8,
      type: 'spring',
      stiffness: 60,
      damping: 20,
      onUpdate(val) {
        if (ref.current) ref.current.textContent = String(Math.round(val))
      },
    })
    return controls.stop
  }, [numValue])

  return (
    <div
      className={cn(
        'bg-surface-card rounded-card shadow-card border border-border-subtle p-5 flex flex-col gap-3',
        className
      )}
    >
      {icon && (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconClassName ?? 'bg-primary/10 text-primary')}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold font-display text-on-surface">
          {numValue !== null ? <span ref={ref}>0</span> : value}
        </p>
        <p className="text-xs text-on-surface-muted mt-0.5">{label}</p>
      </div>
      {delta && (
        <p className={cn('text-xs font-medium', deltaPositive ? 'text-success' : 'text-error')}>
          {delta}
        </p>
      )}
    </div>
  )
}
