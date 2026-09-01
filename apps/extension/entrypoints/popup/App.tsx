import { useState, useEffect } from 'react'
import { ConnectionStatus } from '../../components/ConnectionStatus'
import { ProfileSelector } from '../../components/ProfileSelector'
import { AtsDetectionBanner } from '../../components/AtsDetectionBanner'
import { StatsRow } from '../../components/StatsRow'

interface StoredProfile {
  id: string
  name: string
  is_default: boolean
}

interface StoredRegionalIdentity {
  id: string
  label: string
  countryCodes: string[]
  isDefault: boolean
  defaultProfileId: string | null
}

interface AtsDetection {
  platform: 'workday' | 'greenhouse'
  url: string
}

interface PopupStorageState {
  accessToken?: string
  profiles?: StoredProfile[]
  activeProfileId?: string
  activeRegionalId?: string
  regionalIdentities?: StoredRegionalIdentity[]
  atsDetected?: AtsDetection
  lastSync?: number
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<StoredProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [regionalIdentities, setRegionalIdentities] = useState<StoredRegionalIdentity[]>([])
  const [activeRegionalId, setActiveRegionalId] = useState<string | null>(null)
  const [atsDetected, setAtsDetected] = useState<AtsDetection | null>(null)
  const [lastSync, setLastSync] = useState<number | null>(null)

  useEffect(() => {
    // Load initial state from storage
    chrome.storage.local.get(
      ['accessToken', 'profiles', 'activeProfileId', 'activeRegionalId', 'regionalIdentities', 'atsDetected', 'lastSync'],
      (result) => {
        const state = result as PopupStorageState
        setConnected(!!state.accessToken)
        const profs = state.profiles ?? []
        setProfiles(profs)

        const regions = state.regionalIdentities ?? []
        setRegionalIdentities(regions)
        const storedRegionalId = state.activeRegionalId
        const defaultRegion = regions.find(r => r.isDefault) ?? regions[0] ?? null
        const resolvedRegionalId = storedRegionalId ?? defaultRegion?.id ?? null
        setActiveRegionalId(resolvedRegionalId)

        // Update profile resolution to consider regional default:
        const region = regions.find(r => r.id === resolvedRegionalId)
        const storedProfileId = state.activeProfileId
        const resolvedProfileId =
          storedProfileId ??
          (region?.defaultProfileId ? profs.find(p => p.id === region.defaultProfileId)?.id : null) ??
          profs.find(p => p.is_default)?.id ??
          profs[0]?.id ??
          null
        setActiveProfileId(resolvedProfileId ?? null)

        setAtsDetected(state.atsDetected ?? null)
        setLastSync(state.lastSync ?? null)
        setSyncError(null)
        setLoading(false)
      }
    )

    // Listen for real-time updates from background
    const listener = (message: { type?: string; payload?: unknown }) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        const payload = message.payload as { connected: boolean }
        setConnected(payload.connected)
        if (payload.connected) {
          void handleSync()
        }
      }
      if (message.type === 'PROFILES_SYNCED') {
        chrome.storage.local.get(['profiles', 'activeProfileId', 'activeRegionalId', 'regionalIdentities', 'lastSync'], (result) => {
          const state = result as PopupStorageState
          const profs = state.profiles ?? []
          setProfiles(profs)

          const regions = state.regionalIdentities ?? []
          setRegionalIdentities(regions)
          const storedRegionalId = state.activeRegionalId
          const defaultRegion = regions.find(r => r.isDefault) ?? regions[0] ?? null
          const resolvedRegionalId = storedRegionalId ?? defaultRegion?.id ?? null
          setActiveRegionalId(resolvedRegionalId)

          const region = regions.find(r => r.id === resolvedRegionalId)
          const storedProfileId = state.activeProfileId
          const resolvedProfileId =
            storedProfileId ??
            (region?.defaultProfileId ? profs.find(p => p.id === region.defaultProfileId)?.id : null) ??
            profs.find(p => p.is_default)?.id ??
            profs[0]?.id ??
            null
          setActiveProfileId(resolvedProfileId ?? null)

          setLastSync(state.lastSync ?? null)
          setSyncError(null)
          setSyncing(false)
        })
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  function handleSignIn() {
    chrome.runtime.sendMessage({ action: 'signIn' })
  }

  function handleSignOut() {
    chrome.runtime.sendMessage({ action: 'signOut' })
    setConnected(false)
    setProfiles([])
    setActiveProfileId(null)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'syncProfiles',
      }) as { success?: boolean; count?: number }

      if (!result?.success) {
        setSyncing(false)
        setSyncError('Profile sync failed. Create a profile in the web app or try syncing again.')
        return
      }

      chrome.storage.local.get(['profiles', 'activeProfileId', 'lastSync'], (storageResult) => {
        const state = storageResult as PopupStorageState
        const profs = state.profiles ?? []
        setProfiles(profs)
        setActiveProfileId(
          state.activeProfileId ||
          profs.find((p) => p.is_default)?.id ||
          profs[0]?.id ||
          null
        )
        setLastSync(state.lastSync ?? null)
        setSyncError(null)
        setSyncing(false)
      })
    } catch {
      setSyncing(false)
      setSyncError('Profile sync failed. Create a profile in the web app or try syncing again.')
    }
  }

  function handleProfileSelect(id: string) {
    setActiveProfileId(id)
    chrome.storage.local.set({ activeProfileId: id })
  }

  function handleRegionSelect(id: string) {
    setActiveRegionalId(id)
    chrome.storage.local.set({ activeRegionalId: id })

    // Auto-update profile to that region's default
    const region = regionalIdentities.find(r => r.id === id)
    if (region?.defaultProfileId) {
      const matchingProfile = profiles.find(p => p.id === region.defaultProfileId)
      if (matchingProfile) {
        setActiveProfileId(matchingProfile.id)
        chrome.storage.local.set({ activeProfileId: matchingProfile.id })
      }
    }
  }

  function handleFill() {
    if (!activeProfileId) return
    chrome.runtime.sendMessage({
      action: 'startFill',
      payload: { profileId: activeProfileId, regionalId: activeRegionalId },
    })
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  if (loading) {
    return (
      <div className="w-[360px] p-4 bg-surface font-body">
        <p className="text-sm text-on-surface-muted">Loading...</p>
      </div>
    )
  }

  // Disconnected state
  if (!connected) {
    return (
      <div className="w-[360px] p-4 bg-surface font-body space-y-4">
        <h1 className="text-xl font-semibold font-display text-on-surface">AutoApply</h1>
        <ConnectionStatus connected={false} onSignOut={() => {}} />
        <p className="text-sm text-on-surface-muted">
          Connect to your account to start auto-filling applications.
        </p>
        <button
          onClick={handleSignIn}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity min-h-[44px]"
        >
          Connect Account
        </button>
      </div>
    )
  }

  // Connected state (with or without ATS detection)
  return (
    <div className="w-[360px] p-4 bg-surface font-body space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold font-display text-on-surface">AutoApply</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs text-primary hover:text-primary-dim cursor-pointer transition-colors disabled:opacity-50"
          aria-label="Sync profiles"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <ConnectionStatus connected={true} onSignOut={handleSignOut} />

      {/* Region Selector */}
      <ProfileSelector
        label="Region"
        profiles={regionalIdentities.map(r => ({
          id: r.id,
          name: r.label,
          is_default: r.isDefault,
        }))}
        activeProfileId={activeRegionalId}
        onSelect={handleRegionSelect}
        disabled={syncing}
      />

      {/* Profile Selector */}
      <ProfileSelector
        label="Application Profile"
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={handleProfileSelect}
        disabled={syncing}
      />

      {syncError && (
        <p className="text-xs text-error">{syncError}</p>
      )}

      {atsDetected && activeProfile && (
        <AtsDetectionBanner
          platform={atsDetected.platform}
          profileName={activeProfile.name}
          onFill={handleFill}
        />
      )}

      <StatsRow profileCount={profiles.length} lastSync={lastSync} />
    </div>
  )
}
