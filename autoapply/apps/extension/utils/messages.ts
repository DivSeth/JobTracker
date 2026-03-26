export type ExtensionMessage =
  | { action: 'signIn' }
  | { action: 'signOut' }
  | { action: 'getAuthStatus' }
  | { action: 'syncProfiles' }
  | { type: 'ATS_PAGE_DETECTED'; payload: { platform: 'workday' | 'greenhouse'; url: string } }
  | { type: 'AUTH_STATE_CHANGED'; payload: { connected: boolean } }
  | { type: 'PROFILES_SYNCED'; payload: { count: number } }

export type AuthStatus = {
  connected: boolean
  userId: string | null
}
