---
phase: 01-application-profiles-extension-shell
plan: "05"
subsystem: extension
tags: [chrome-extension, ats-detection, popup-ui, content-scripts, profile-sync]
dependency_graph:
  requires: ["01-02", "01-03"]
  provides: ["workday-content-script", "greenhouse-content-script", "extension-popup-ui", "ats-badge-detection"]
  affects: ["autoapply/apps/extension"]
tech_stack:
  added: []
  patterns: ["WXT defineContentScript", "MutationObserver for SPA detection", "chrome.storage.local state", "chrome.action badge API"]
key_files:
  created:
    - autoapply/apps/extension/entrypoints/workday.content.ts
    - autoapply/apps/extension/entrypoints/greenhouse.content.ts
    - autoapply/apps/extension/components/ConnectionStatus.tsx
    - autoapply/apps/extension/components/ProfileSelector.tsx
    - autoapply/apps/extension/components/AtsDetectionBanner.tsx
    - autoapply/apps/extension/components/StatsRow.tsx
  modified:
    - autoapply/apps/extension/entrypoints/background.ts
    - autoapply/apps/extension/entrypoints/popup/App.tsx
decisions:
  - "syncProfiles fetches select('*') and strips encrypted PII fields (eeo_gender, eeo_race, eeo_veteran_status, eeo_disability_status, work_authorization) before storing in chrome.storage.local"
  - "ATS badge clears on chrome.tabs.onUpdated loading status to avoid stale detection across navigations"
  - "handleFill in popup is a stub wired for Phase 2+ auto-fill implementation"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 3
  files_created: 6
  files_modified: 2
---

# Phase 01 Plan 05: ATS Page Detection and Extension Popup UI Summary

**One-liner:** Workday + Greenhouse content scripts with MutationObserver detection, plus full extension popup mini-dashboard (ConnectionStatus, ProfileSelector, AtsDetectionBanner, StatsRow components) and profile sync with PII stripping.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | ATS page detection content scripts and background worker updates | 4997253 | Done |
| 2 | Full extension popup UI with profile selector, ATS banner, and stats | 8f8018d | Done |
| 3 | Verify extension popup and ATS detection end-to-end | — | Checkpoint (human verify) |

## What Was Built

### Task 1: ATS Detection Content Scripts

**`autoapply/apps/extension/entrypoints/workday.content.ts`**
- Matches `*://*.myworkdayjobs.com/*`
- Detects application pages via `data-automation-id` selectors: `jobPostingPage`, `applyButton`, `navigationPanel`
- Falls back to URL path containing `/apply`
- Uses `MutationObserver` to handle Workday's SPA navigation — fires `ATS_PAGE_DETECTED` when applyButton appears after navigation

**`autoapply/apps/extension/entrypoints/greenhouse.content.ts`**
- Matches `boards.greenhouse.io/*/jobs/*`, `boards.greenhouse.io/*/apply/*`, `job-boards.greenhouse.io/*/jobs/*`
- Detects application pages via `#application_form`, `#main_fields`, `.application-form` selectors and `/apply` URL path

**`autoapply/apps/extension/entrypoints/background.ts` updates:**
- New `ATS_PAGE_DETECTED` message branch: stores `atsDetected` in `chrome.storage.local`, sets badge text to "ATS" with green background
- `chrome.tabs.onUpdated` listener: clears `atsDetected` and badge on page navigation (loading status)
- `syncProfiles` now fetches `select('*')` and strips 5 encrypted BYTEA PII fields before writing to storage

### Task 2: Extension Popup UI Components

**`autoapply/apps/extension/components/ConnectionStatus.tsx`**
- Green/red dot indicator for connection state
- Sign out button only shown when connected

**`autoapply/apps/extension/components/ProfileSelector.tsx`**
- Dropdown `<select>` with all synced profiles
- Empty state: "No profiles available" with guidance to create profile in web app
- Disabled during sync

**`autoapply/apps/extension/components/AtsDetectionBanner.tsx`**
- Shows platform badge ("Workday Detected" / "Greenhouse Detected") with success color
- "Fill with {profileName}" button with `min-h-[44px]` touch target, gradient styling

**`autoapply/apps/extension/components/StatsRow.tsx`**
- Profile count with pluralization
- Relative sync timestamp (just now / Xm ago / Xh ago / Xd ago)

**`autoapply/apps/extension/entrypoints/popup/App.tsx` (rewritten)**
- 3 states: loading, disconnected, connected
- Disconnected: logo, explanation, Connect Account button
- Connected: title + Sync button, ConnectionStatus, ProfileSelector, conditional AtsDetectionBanner, StatsRow
- Reads `atsDetected` from `chrome.storage.local` on mount
- Listens for `AUTH_STATE_CHANGED` and `PROFILES_SYNCED` background messages
- Profile selection persisted to `chrome.storage.local`

## Deviations from Plan

None — plan executed exactly as written. The `_tabId` parameter in `chrome.tabs.onUpdated.addListener` callback is unused per the plan's spec (only `changeInfo.status` is needed), which is correct.

## Known Stubs

**1. `handleFill` in popup/App.tsx (line ~82)**
- File: `autoapply/apps/extension/entrypoints/popup/App.tsx`
- Stub: `console.log('Fill triggered with profile:', activeProfileId, 'on:', atsDetected)`
- Reason: Auto-fill implementation is Phase 2+. The button is wired and the action handler exists; Phase 2 (Greenhouse Auto-fill) will implement `chrome.tabs.sendMessage` to the content script to begin DOM form-filling. This is intentional per plan — the extension shell is complete, auto-fill is the next phase.

## Self-Check

Files created/modified:
- FOUND: autoapply/apps/extension/entrypoints/workday.content.ts
- FOUND: autoapply/apps/extension/entrypoints/greenhouse.content.ts
- FOUND: autoapply/apps/extension/components/ConnectionStatus.tsx
- FOUND: autoapply/apps/extension/components/ProfileSelector.tsx
- FOUND: autoapply/apps/extension/components/AtsDetectionBanner.tsx
- FOUND: autoapply/apps/extension/components/StatsRow.tsx
- FOUND: commit 4997253 (Task 1)
- FOUND: commit 8f8018d (Task 2)

## Self-Check: PASSED
