import { cn } from '@/lib/utils'

interface Props {
  children: string
  className?: string
  filled?: boolean
  size?: number
}

export function MatIcon({ children, className, filled = false, size = 20 }: Props) {
  return (
    <span
      className={cn('material-symbols-outlined select-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {children}
    </span>
  )
}
