import { getStoredAuth, setStoredAuth, clearStoredAuth } from '../utils/storage'
import { createExtensionClient } from '../utils/supabase'
import type { ExtensionMessage, AuthStatus } from '../utils/messages'

export default defineBackground(() => {
  const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || 'http://localhost:3000'

  // Handle messages from popup and content scripts
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      if ('action' in message) {
        switch (message.action) {
          case 'signIn':
            handleSignIn().then(sendResponse)
            return true // async response

          case 'signOut':
            handleSignOut().then(sendResponse)
            return true

          case 'getAuthStatus':
            getAuthStatus().then(sendResponse)
            return true

          case 'syncProfiles':
            syncProfiles().then(sendResponse)
            return true
        }
      }
    }
  )

  // Token relay auth: open web app tab, intercept tokens from redirect
  async function handleSignIn(): Promise<{ success: boolean; error?: string }> {
    try {
      const tab = await chrome.tabs.create({
        url: `${WEBAPP_URL}/login?source=extension`,
        active: true,
      })

      return new Promise((resolve) => {
        const listener = (
          tabId: number,
          changeInfo: chrome.tabs.TabChangeInfo,
          updatedTab: chrome.tabs.Tab
        ) => {
          if (tabId !== tab.id || changeInfo.status !== 'complete') return
          if (!updatedTab.url) return

          try {
            const url = new URL(updatedTab.url)

            // Check for tokens in URL hash (Supabase implicit flow)
            // or in query params (custom extension callback)
            const hashParams = new URLSearchParams(url.hash.substring(1))
            const accessToken =
              hashParams.get('access_token') || url.searchParams.get('access_token')
            const refreshToken =
              hashParams.get('refresh_token') || url.searchParams.get('refresh_token')

            if (accessToken && refreshToken) {
              // Store tokens
              setStoredAuth({
                accessToken,
                refreshToken,
                userId: '', // Will be populated on first Supabase call
              }).then(async () => {
                // Get actual user ID
                const client = await createExtensionClient()
                const {
                  data: { user },
                } = await client.auth.getUser()
                if (user) {
                  await setStoredAuth({ accessToken, refreshToken, userId: user.id })
                }

                chrome.tabs.remove(tabId)
                chrome.tabs.onUpdated.removeListener(listener)

                // Notify popup
                chrome.runtime
                  .sendMessage({
                    type: 'AUTH_STATE_CHANGED',
                    payload: { connected: true },
                  })
                  .catch(() => {}) // popup may be closed

                // Initial profile sync
                syncProfiles()

                resolve({ success: true })
              })
            }
          } catch {
            // URL parse error — ignore, keep listening
          }
        }

        chrome.tabs.onUpdated.addListener(listener)

        // Timeout after 5 minutes
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve({ success: false, error: 'Authentication timed out' })
        }, 5 * 60 * 1000)
      })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function handleSignOut(): Promise<{ success: boolean }> {
    await clearStoredAuth()
    chrome.runtime
      .sendMessage({
        type: 'AUTH_STATE_CHANGED',
        payload: { connected: false },
      })
      .catch(() => {})
    return { success: true }
  }

  async function getAuthStatus(): Promise<AuthStatus> {
    const auth = await getStoredAuth()
    return {
      connected: !!auth,
      userId: auth?.userId || null,
    }
  }

  async function syncProfiles(): Promise<{ success: boolean; count: number }> {
    try {
      const client = await createExtensionClient()
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) return { success: false, count: 0 }

      const { data: profiles } = await client
        .from('application_profiles')
        .select('id, name, is_default, skills, updated_at')
        .order('is_default', { ascending: false })

      if (profiles) {
        await chrome.storage.local.set({ profiles, lastSync: Date.now() })
        chrome.runtime
          .sendMessage({
            type: 'PROFILES_SYNCED',
            payload: { count: profiles.length },
          })
          .catch(() => {})
        return { success: true, count: profiles.length }
      }

      return { success: false, count: 0 }
    } catch {
      return { success: false, count: 0 }
    }
  }

  // Proactive session refresh every 5 minutes (Pitfall 1: Auth Desync)
  chrome.alarms.create('refreshSession', { periodInMinutes: 5 })
  // Profile sync every 15 minutes (Pattern 4)
  chrome.alarms.create('syncProfiles', { periodInMinutes: 15 })

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'refreshSession') {
      const auth = await getStoredAuth()
      if (!auth) return
      try {
        const client = await createExtensionClient()
        const { data, error } = await client.auth.refreshSession()
        if (data.session && !error) {
          await setStoredAuth({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            userId: auth.userId,
          })
        }
      } catch {
        // Silent failure — next alarm will retry
      }
    }
    if (alarm.name === 'syncProfiles') {
      await syncProfiles()
    }
  })
})
