interface Props {
  profileCount: number
  lastSync: number | null
}

export function StatsRow({ profileCount, lastSync }: Props) {
  const syncText = lastSync
    ? `Synced ${formatRelativeTime(lastSync)}`
    : 'Not synced yet'

  return (
    <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
      <span className="text-xs text-on-surface-muted">
        {profileCount} profile{profileCount !== 1 ? 's' : ''}
      </span>
      <span className="text-xs text-on-surface-muted">{syncText}</span>
    </div>
  )
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
