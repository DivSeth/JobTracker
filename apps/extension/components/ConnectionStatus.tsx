interface Props {
  connected: boolean
  onSignOut: () => void
}

export function ConnectionStatus({ connected, onSignOut }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'}`} />
        <span className="text-xs text-on-surface-muted">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {connected && (
        <button
          onClick={onSignOut}
          className="text-xs text-on-surface-muted hover:text-on-surface cursor-pointer transition-colors"
        >
          Sign out
        </button>
      )}
    </div>
  )
}
