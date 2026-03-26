import { useState, useEffect } from 'react'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(['accessToken'], (result) => {
      setConnected(!!result.accessToken)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="w-[360px] p-4 bg-surface font-body">
        <p className="text-on-surface-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="w-[360px] p-4 bg-surface font-body">
        <h1 className="text-xl font-semibold font-display text-on-surface mb-2">AutoApply</h1>
        <p className="text-sm text-on-surface-muted mb-4">
          Connect to your account to start auto-filling applications.
        </p>
        <button
          onClick={() => chrome.runtime.sendMessage({ action: 'signIn' })}
          className="w-full py-2.5 px-4 rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
        >
          Connect Account
        </button>
      </div>
    )
  }

  return (
    <div className="w-[360px] p-4 bg-surface font-body">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold font-display text-on-surface">AutoApply</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-on-surface-muted">Connected</span>
        </div>
      </div>
      <p className="text-sm text-on-surface-muted">Profile sync and ATS detection coming soon.</p>
    </div>
  )
}
