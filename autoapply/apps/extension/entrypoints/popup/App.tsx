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

interface AtsDetection {
  platform: 'workday' | 'greenhouse'
  url: string
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [profiles, setProfiles] = useState<StoredProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [atsDetected, setAtsDetected] = useState<AtsDetection | null>(null)
  const [lastSync, setLastSync] = useState<number | null>(null)

  useEffect(() => {
    // Load initial state from storage
    chrome.storage.local.get(
      ['accessToken', 'profiles', 'activeProfileId', 'atsDetected', 'lastSync'],
      (result) => {
        setConnected(!!result.accessToken)
        setProfiles(result.profiles || [])
        setActiveProfileId(
          result.activeProfileId ||
          result.profiles?.find((p: StoredProfile) => p.is_default)?.id ||
          result.profiles?.[0]?.id ||
          null
        )
        setAtsDetected(result.atsDetected || null)
        setLastSync(result.lastSync || null)
        setLoading(false)
      }
    )

    // Listen for real-time updates from background
    const listener = (message: { type?: string; payload?: unknown }) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        const payload = message.payload as { connected: boolean }
        setConnected(payload.connected)
        if (payload.connected) {
          handleSync()
        }
      }
      if (message.type === 'PROFILES_SYNCED') {
        chrome.storage.local.get(['profiles', 'lastSync'], (result) => {
          setProfiles(result.profiles || [])
          setLastSync(result.lastSync || null)
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

  function handleSync() {
    setSyncing(true)
    chrome.runtime.sendMessage({ action: 'syncProfiles' })
  }

  function handleProfileSelect(id: string) {
    setActiveProfileId(id)
    chrome.storage.local.set({ activeProfileId: id })
  }

  function handleFill() {
    // Phase 2+ implementation — for now, show that the action is wired
    // Will send message to content script to begin auto-fill
    console.log('Fill triggered with profile:', activeProfileId, 'on:', atsDetected)
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

      <ProfileSelector
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={handleProfileSelect}
        disabled={syncing}
      />

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
