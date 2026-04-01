# Active Context

## What We're Building Right Now
Tracking sync + submission toast (Wave 4 / 02-05). This is the final plan of Phase 02 — wires application tracking so fills create dashboard entries and submission detection updates status.

## Architecture Snapshot — Post Wave 3

```
extension/lib/greenhouse/
  types.ts          ✓ all type contracts
  scanner.ts        ✓ scanGreenhouseForm(): GreenhouseField[]
  mapper.ts         ✓ mapProfileToFields() — phone_number matching fixed
  filler.ts         ✓ fillForm(MappedField[], FillOptions): Promise<FillResult>
  detector.ts       ✓ watchForSubmissionConfirmation(onConfirmed): SubmissionWatcher
                      cancelSubmissionWatch(): void

extension/lib/form-fill/
  events.ts         ✓ fillTextField/fillSelectField/fillCheckbox — focus dispatch fixed
  file-upload.ts    ✓ uploadFileToInput()

extension/entrypoints/
  greenhouse.content/          ← SINGLE entrypoint (old .ts file deleted 2026-04-01)
    index.tsx         ✓ Shadow DOM entry, ATS detection + FILL_STARTED listener
    App.tsx           ✓ PreviewPanel: preview|filling|complete states
    style.css         ✓ Tailwind + fonts for Shadow DOM
    MappingRow.tsx    ✓ mapped field row (label → value, status icon)
    UnmappedRow.tsx   ✓ unmapped row (label, "No match", amber warning)
    FillProgressBar.tsx   ✓ "Filling N of M fields..." + progress bar
    FillResultBanner.tsx  ✓ post-fill counts + Close Panel button
    SubmissionToast.tsx   ← TASK-01: "Application tracked!" toast (4s auto-dismiss)
    App.test.tsx          ✓ PreviewPanel state tests
    components.test.tsx   ✓ subcomponent unit tests

  popup/App.tsx     ✓ handleFill → startFill message wired
  components/
    AtsDetectionBanner.tsx ✓ CTA = "Fill Application"

extension/utils/
  messages.ts       ✓ full ExtensionMessage union incl. fill types
  storage.ts        ✓ getUserIdentity/setUserIdentity

web/app/api/extension/
  field-mappings/   ✓ GET ?platform=greenhouse
  track-application/ ✓ GET + POST + PATCH
```

## Full Pipeline (Complete)

```
Popup "Fill Application" button
  → chrome.runtime.sendMessage({ action: 'startFill', payload: { profileId } })
  → background.ts routes to content script via chrome.tabs.sendMessage({ type: 'FILL_STARTED' })
  → greenhouse.content/index.tsx receives FILL_STARTED
  → scans form (scanGreenhouseForm), maps fields (mapProfileToFields)
  → mounts Shadow DOM PreviewPanel
  → user reviews mappings (MappingRow / UnmappedRow), sees duplicate warning if applicable
  → user clicks "Confirm Fill"
  → fillForm() executes → FillProgressBar updates
  → FillResultBanner shows filled/skipped/errors
  → trackApplication message → background.ts → POST /api/extension/track-application
  → SubmissionToast: "Application tracked!" (4s auto-dismiss)   ← TASK-01
  → watchForSubmissionConfirmation() polls for confirmation page
  → on detection: updateApplicationStatus → PATCH /api/extension/track-application
```

## Key Decisions for Wave 4

**WXT entrypoint conflict RESOLVED:** `greenhouse.content.ts` deleted. Detection logic lives in `greenhouse.content/index.tsx` `isGreenhouseApplicationPage()` function. Single entrypoint.

**trackApplication message (D-10):** Fired after fill completes in App.tsx `handleConfirmFill`. Payload: `{ applyUrl, jobTitle, companyName, profileId, source: 'extension_autofill' }`. Job title scraped from `h1.app-title` or first `<h1>`. Company from `.company-name` or page title.

**watchForSubmissionConfirmation (D-11):** Imported in App.tsx. Called after fill. On detection: sends `updateApplicationStatus` with `{ applyUrl, status: 'applied' }`. Store `watcher.stop` for cleanup on unmount.

**SubmissionToast spec:**
- Fixed bottom-6 right-6
- `border-l-4 border-l-[#22c55e]` left accent
- `box-shadow: 0 4px 12px rgba(0,0,0,0.1)`
- `role="status"` + `aria-live="polite"`
- Auto-dismiss: 4000ms total, fade-out starts at 3800ms

**EEO masking (D-02):** When `MappedField.isMasked === true` → Lock icon + "[protected]", never actual value.

**Duplicate warning (D-05):** When `duplicateInfo.exists === true` → amber banner in PreviewPanel.

**02-05 is a checkpoint plan:** Requires human E2E verification before Phase 02 is marked complete. Codex runs build + tests, then human loads extension in Chrome and tests on a live Greenhouse page.

## Test Approach for Wave 4
- SubmissionToast tests go in `components.test.tsx` (add to existing file)
- Run: `node ../../node_modules/vitest/vitest.mjs run --reporter=verbose`
  from `autoapply/apps/extension/`
