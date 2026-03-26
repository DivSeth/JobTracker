export interface StoredAuth {
  accessToken: string
  refreshToken: string
  userId: string
}

export interface StoredData {
  accessToken?: string
  refreshToken?: string
  userId?: string
  profiles?: unknown[]
  lastSync?: number
  activeProfileId?: string
}

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(['accessToken', 'refreshToken', 'userId'])
  if (result.accessToken && result.refreshToken) {
    return result as StoredAuth
  }
  return null
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await chrome.storage.local.set(auth)
}

export async function clearStoredAuth(): Promise<void> {
  await chrome.storage.local.remove([
    'accessToken',
    'refreshToken',
    'userId',
    'profiles',
    'lastSync',
    'activeProfileId',
  ])
}

export async function getStoredProfiles(): Promise<unknown[]> {
  const result = await chrome.storage.local.get(['profiles'])
  return result.profiles || []
}

export async function setStoredProfiles(profiles: unknown[]): Promise<void> {
  await chrome.storage.local.set({ profiles, lastSync: Date.now() })
}
