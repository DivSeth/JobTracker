import { describe, test, vi } from 'vitest'

// Mock chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
  },
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
}

vi.stubGlobal('chrome', mockChrome)

describe('Profile sync (EXT-05)', () => {
  test.todo('fetches all profiles from Supabase on sync')
  test.todo('strips encrypted PII fields before storing in chrome.storage.local')
  test.todo('stores profiles with lastSync timestamp in local storage')
  test.todo('sends PROFILES_SYNCED message after successful sync')
  test.todo('handles sync failure gracefully (returns success: false)')
  test.todo('creates syncProfiles alarm with 15 minute interval')
})
