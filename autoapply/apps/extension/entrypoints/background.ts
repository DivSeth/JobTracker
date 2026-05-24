import {
  clearStoredAuth,
  getStoredAuth,
  getStoredProfiles,
  getUserIdentity,
  setStoredAuth,
  setUserIdentity,
  setBaseIdentity,
  setRegionalIdentities,
  clearLegacyUserIdentity,
  setApplicationProfiles,
  type StoredApplicationProfile,
} from '../utils/storage'
import { fromApiBase, fromApiRegional } from '../utils/identity'
import { createExtensionClient } from '../utils/supabase'
import type { AuthStatus, ExtensionMessage, StoredUserIdentity } from '../utils/messages'

export default defineBackground(() => {
  const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || 'http://localhost:3000'

  function readAuthTokens(urlString: string): { accessToken: string; refreshToken: string } | null {
    try {
      const url = new URL(urlString)
      const hashParams = new URLSearchParams(url.hash.substring(1))
      const accessToken =
        hashParams.get('access_token') || url.searchParams.get('access_token')
      const refreshToken =
        hashParams.get('refresh_token') || url.searchParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        return null
      }

      return { accessToken, refreshToken }
    } catch {
      return null
    }
  }

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

          case 'getProfileForFill':
            getProfileForFill(message.payload?.profileId ?? null).then(sendResponse)
            return true

          case 'getFieldMappings':
            fetchFieldMappings(message.payload.platform).then(sendResponse)
            return true

          case 'trackApplication':
            trackApplication(message.payload).then(sendResponse)
            return true

          case 'updateApplicationStatus':
            updateApplicationStatus(message.payload.id, message.payload.status).then(sendResponse)
            return true

          case 'checkDuplicateApplication':
            checkDuplicateApplication(message.payload.applyUrl).then(sendResponse)
            return true

          case 'getResumeSignedUrl':
            getResumeSignedUrl(message.payload.storagePath).then(sendResponse)
            return true

          case 'startFill':
            startFill(message.payload?.profileId ?? null, message.payload?.regionalId ?? null, message.payload?.platform ?? 'greenhouse').then(sendResponse)
            return true
        }
      }

      if ('type' in message && message.type === 'ATS_PAGE_DETECTED') {
        // Store the detected ATS page info so popup can read it
        chrome.storage.local.set({
          atsDetected: message.payload,
        })
        // Also store in session for badge update
        chrome.action.setBadgeText({ text: 'ATS' })
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' })
      }
    }
  )

  // Clear ATS detection when navigating away
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      // Clear ATS detection on page navigation
      chrome.storage.local.remove(['atsDetected'])
      chrome.action.setBadgeText({ text: '' })
    }
  })

  // Token relay auth: open web app tab, intercept tokens from redirect
  async function handleSignIn(): Promise<{ success: boolean; error?: string }> {
    try {
      const tab = await chrome.tabs.create({
        url: `${WEBAPP_URL}/login?source=extension`,
        active: true,
      })

      return new Promise((resolve) => {
        let settled = false
        let pollTimer: ReturnType<typeof setInterval> | null = null
        let timeoutTimer: ReturnType<typeof setTimeout> | null = null

        const cleanup = () => {
          if (pollTimer) clearInterval(pollTimer)
          if (timeoutTimer) clearTimeout(timeoutTimer)
          chrome.tabs.onUpdated.removeListener(listener)
        }

        const finalize = async (accessToken: string, refreshToken: string, tabId: number) => {
          if (settled) return
          settled = true
          cleanup()

          await setStoredAuth({
            accessToken,
            refreshToken,
            userId: '', // Will be populated on first Supabase call
          })

          // Get actual user ID
          const client = await createExtensionClient()
          const {
            data: { user },
          } = await client.auth.getUser()
          if (user) {
            await setStoredAuth({ accessToken, refreshToken, userId: user.id })
          }

          chrome.tabs.remove(tabId).catch(() => {})

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
        }

        const tryHandleUrl = async (urlString?: string | null, tabId?: number) => {
          if (settled || !urlString || !tabId) return

          // SEC-01: exchange code flow — tokens never in URL
          try {
            const url = new URL(urlString)
            const exchangeCode = url.searchParams.get('exchange_code')
            if (exchangeCode) {
              const resp = await fetch(`${WEBAPP_URL}/api/auth/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: exchangeCode }),
              })
              if (resp.ok) {
                const { access_token, refresh_token } = await resp.json()
                await finalize(access_token, refresh_token, tabId)
              }
              return
            }
          } catch {
            // malformed URL — fall through
          }

          // Legacy fallback: tokens in URL hash/query (pre-SEC-01)
          const tokens = readAuthTokens(urlString)
          if (!tokens) return
          await finalize(tokens.accessToken, tokens.refreshToken, tabId)
        }

        const listener = (
          tabId: number,
          changeInfo: chrome.tabs.TabChangeInfo,
          updatedTab: chrome.tabs.Tab
        ) => {
          if (tabId !== tab.id) return

          void tryHandleUrl(changeInfo.url ?? updatedTab.url ?? null, tabId)
        }

        chrome.tabs.onUpdated.addListener(listener)

        pollTimer = setInterval(async () => {
          if (settled || !tab.id) return
          try {
            const currentTab = await chrome.tabs.get(tab.id)
            await tryHandleUrl(currentTab.url ?? null, tab.id)
          } catch {
            // Ignore polling errors while auth tab is navigating.
          }
        }, 500)

        // Timeout after 5 minutes
        timeoutTimer = setTimeout(() => {
          if (settled) return
          settled = true
          cleanup()
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
        .select('*')
        .order('is_default', { ascending: false })

      if (profiles) {
        const userIdentity: StoredUserIdentity = {
          userId: user.id,
          email: user.email ?? '',
          fullName: user.user_metadata?.full_name ?? null,
          phone: null,
          portfolioUrl: null,
          location: null,
        }

        const appProfilesForStorage: StoredApplicationProfile[] = profiles.map((p) => {
          const profile = p as Record<string, unknown>
          return {
            id: profile.id as string,
            name: (profile.name as string) ?? '',
            is_default: Boolean(profile.is_default),
            resume_path: (profile.resume_path as string | null) ?? null,
            cover_letter_path: (profile.cover_letter_path as string | null) ?? null,
            experience: (profile.experience as unknown[]) ?? [],
            education: (profile.education as unknown[]) ?? [],
            skills: (profile.skills as string[]) ?? [],
            certifications: (profile.certifications as unknown[]) ?? [],
            languages: (profile.languages as unknown[]) ?? [],
          }
        })
        await setUserIdentity(userIdentity)
        await setApplicationProfiles(appProfilesForStorage)
        await chrome.storage.local.set({
          profiles: appProfilesForStorage,
          userIdentity,
          lastSync: Date.now(),
        })

        // Phase 02-07: sync base + regional identity directly via Supabase (avoids CORS)
        try {
          const [{ data: baseRaw }, { data: regionalRaw }] = await Promise.all([
            client.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
            client
              .from('user_regional_identities')
              .select('*')
              .eq('user_id', user.id)
              .order('is_default', { ascending: false }),
          ])
          const base = fromApiBase(baseRaw as Record<string, unknown> | null)
          const regional = (regionalRaw ?? []).map((r) =>
            fromApiRegional(r as Record<string, unknown>)
          )
          await setBaseIdentity(base)
          await setRegionalIdentities(regional)
          await clearLegacyUserIdentity()
        } catch {
          // leave previously-cached data in place
        }
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

  async function getProfileForFill(profileId?: string | null): Promise<{
    profile: unknown | null
    userIdentity: StoredUserIdentity | null
  }> {
    const [profiles, userIdentity, storageState] = await Promise.all([
      getStoredProfiles(),
      getUserIdentity(),
      chrome.storage.local.get(['activeProfileId']),
    ])

    const selectedProfileId =
      profileId ?? (storageState.activeProfileId as string | undefined) ?? null
    const profile =
      (profiles as Array<{ id?: string }>).find((item) => item.id === selectedProfileId) ?? null

    return { profile, userIdentity }
  }

  async function fetchFieldMappings(platform: 'greenhouse' | 'workday') {
    return fetchFromWebApi(`/api/extension/field-mappings?platform=${encodeURIComponent(platform)}`)
  }

  async function startFill(profileId?: string | null, regionalId?: string | null, platform: 'greenhouse' | 'workday' = 'greenhouse') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        return { success: false, error: 'No active tab found' }
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_STARTED',
        payload: {
          profileId: profileId ?? null,
          regionalId: regionalId ?? null,
          platform,
        },
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start fill',
      }
    }
  }

  async function trackApplication(payload: unknown) {
    return fetchFromWebApi('/api/extension/track-application', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function updateApplicationStatus(id: string, status: string) {
    return fetchFromWebApi('/api/extension/track-application', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    })
  }

  async function checkDuplicateApplication(applyUrl: string) {
    return fetchFromWebApi(
      `/api/extension/track-application?applyUrl=${encodeURIComponent(applyUrl)}`
    )
  }

  async function getResumeSignedUrl(storagePath: string): Promise<{ url: string | null }> {
    try {
      const client = await createExtensionClient()
      const { data } = await client.storage
        .from('profile-documents')
        .createSignedUrl(storagePath, 60)
      return { url: data?.signedUrl ?? null }
    } catch {
      return { url: null }
    }
  }

  async function fetchFromWebApi(path: string, init?: RequestInit) {
    try {
      const response = await fetch(`${WEBAPP_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error ?? 'Request failed', status: response.status }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
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
