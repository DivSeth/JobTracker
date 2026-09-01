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
}

vi.stubGlobal('chrome', mockChrome)

describe('Workday ATS page detection (EXT-03)', () => {
  test.todo('detects Workday application page by data-automation-id="jobPostingPage" selector')
  test.todo('detects Workday application page by data-automation-id="applyButton" selector')
  test.todo('detects Workday application page by /apply URL path')
  test.todo('sends ATS_PAGE_DETECTED message with platform "workday" and current URL')
  test.todo('uses MutationObserver for SPA navigation detection')
})

describe('Greenhouse ATS page detection (EXT-03)', () => {
  test.todo('detects Greenhouse application page by #application_form selector')
  test.todo('detects Greenhouse application page by #main_fields selector')
  test.todo('detects Greenhouse application page by /apply URL path')
  test.todo('sends ATS_PAGE_DETECTED message with platform "greenhouse" and current URL')
})
