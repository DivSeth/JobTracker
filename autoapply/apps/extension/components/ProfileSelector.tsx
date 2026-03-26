interface Profile {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  profiles: Profile[]
  activeProfileId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
}

export function ProfileSelector({ profiles, activeProfileId, onSelect, disabled }: Props) {
  if (profiles.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-on-surface-muted">No profiles available</p>
        <p className="text-xs text-on-surface-muted mt-1">
          Create a profile in the AutoApply web app to start filling applications.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-on-surface-muted font-normal">
        Active Profile
      </label>
      <select
        value={activeProfileId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.is_default ? '(Default)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
