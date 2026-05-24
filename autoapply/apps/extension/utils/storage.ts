import type { StoredUserIdentity } from './messages'
import type { StoredBaseIdentity, StoredRegionalIdentity } from './identity'

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
  userIdentity?: StoredUserIdentity
}

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(['accessToken', 'refreshToken', 'userId'])
  if (result.accessToken && result.refreshToken) {
    return result as unknown as StoredAuth
  }
  return null
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await chrome.storage.local.set(auth)
}

export interface StoredApplicationProfile {
  id: string
  name: string
  is_default: boolean
  resume_path: string | null
  cover_letter_path: string | null
  experience: unknown[]
  education: unknown[]
  skills: string[]
  certifications: unknown[]
  languages: unknown[]
}

export async function getApplicationProfiles(): Promise<StoredApplicationProfile[]> {
  const r = await chrome.storage.local.get(['applicationProfiles'])
  return (r.applicationProfiles as StoredApplicationProfile[] | undefined) ?? []
}

export async function setApplicationProfiles(profiles: StoredApplicationProfile[]): Promise<void> {
  await chrome.storage.local.set({ applicationProfiles: profiles })
}

export async function clearStoredAuth(): Promise<void> {
  await chrome.storage.local.remove([
    'accessToken',
    'refreshToken',
    'userId',
    'profiles',
    'lastSync',
    'activeProfileId',
    'userIdentity',
    'baseIdentity',
    'regionalIdentities',
    'applicationProfiles',
  ])
}

export async function getStoredProfiles(): Promise<unknown[]> {
  const result = await chrome.storage.local.get(['profiles'])
  return (result.profiles as unknown[]) || []
}

export async function setStoredProfiles(profiles: unknown[]): Promise<void> {
  await chrome.storage.local.set({ profiles, lastSync: Date.now() })
}

export async function getUserIdentity(): Promise<StoredUserIdentity | null> {
  const result = await chrome.storage.local.get(['userIdentity'])
  return (result.userIdentity as StoredUserIdentity | undefined) ?? null
}

export async function setUserIdentity(userIdentity: StoredUserIdentity): Promise<void> {
  await chrome.storage.local.set({ userIdentity })
}

export async function getBaseIdentity(): Promise<StoredBaseIdentity | null> {
  const r = await chrome.storage.local.get(['baseIdentity'])
  return (r.baseIdentity as StoredBaseIdentity | undefined) ?? null
}

export async function setBaseIdentity(base: StoredBaseIdentity): Promise<void> {
  await chrome.storage.local.set({ baseIdentity: base })
}

export async function getRegionalIdentities(): Promise<StoredRegionalIdentity[]> {
  const r = await chrome.storage.local.get(['regionalIdentities'])
  return (r.regionalIdentities as StoredRegionalIdentity[] | undefined) ?? []
}

export async function setRegionalIdentities(
  list: StoredRegionalIdentity[]
): Promise<void> {
  await chrome.storage.local.set({ regionalIdentities: list })
}

export async function clearLegacyUserIdentity(): Promise<void> {
  await chrome.storage.local.remove(['userIdentity'])
}
