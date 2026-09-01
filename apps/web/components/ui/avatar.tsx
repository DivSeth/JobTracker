import { cn } from '@/lib/utils'

interface AvatarProps {
  email?: string | null
  fullName?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(email?: string | null, fullName?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function Avatar({ email, fullName, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0 select-none',
        SIZE_CLASSES[size],
        className
      )}
    >
      {getInitials(email, fullName)}
    </div>
  )
}
