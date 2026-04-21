import type { TrackApplicationPayload, UserIdentity } from '@/lib/greenhouse/types'

export type ExtensionMessage =
  | { action: 'signIn' }
  | { action: 'signOut' }
  | { action: 'getAuthStatus' }
  | { action: 'syncProfiles' }
  | {
      action: 'startFill'
      payload: { profileId?: string | null; platform?: 'greenhouse' | 'workday'; url?: string }
    }
  | { action: 'getProfileForFill'; payload?: { profileId?: string | null } }
  | { action: 'getFieldMappings'; payload: { platform: 'greenhouse' | 'workday' } }
  | { action: 'trackApplication'; payload: TrackApplicationPayload }
  | { action: 'updateApplicationStatus'; payload: { id: string; status: string } }
  | { action: 'checkDuplicateApplication'; payload: { applyUrl: string } }
  | { type: 'FILL_STARTED'; payload: { profileId?: string | null; platform?: 'greenhouse' | 'workday' } }
  | { type: 'ATS_PAGE_DETECTED'; payload: { platform: 'workday' | 'greenhouse'; url: string } }
  | { type: 'AUTH_STATE_CHANGED'; payload: { connected: boolean } }
  | { type: 'PROFILES_SYNCED'; payload: { count: number } }

export type AuthStatus = {
  connected: boolean
  userId: string | null
}

export interface StoredUserIdentity extends UserIdentity {
  userId: string
}
