interface Props {
  platform: 'workday' | 'greenhouse'
  profileName: string
  onFill: () => void
}

export function AtsDetectionBanner({ platform, profileName, onFill }: Props) {
  const platformLabel = platform === 'workday' ? 'Workday' : 'Greenhouse'

  return (
    <div className="space-y-3 pt-3 border-t border-outline-variant">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
          {platformLabel} Detected
        </span>
      </div>
      <button
        onClick={onFill}
        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity min-h-[44px]"
      >
        Fill with {profileName}
      </button>
    </div>
  )
}
