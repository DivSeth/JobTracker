# Active Tasks

**Status:** Phase 02 Wave 4 — 02-05 Tracking sync + submission toast (final plan, checkpoint)

---

## TASK-01 — SubmissionToast.tsx + tracking wiring in App.tsx
**Files:**
- `autoapply/apps/extension/entrypoints/greenhouse.content/SubmissionToast.tsx` ← NEW
- `autoapply/apps/extension/entrypoints/greenhouse.content/App.tsx` ← UPDATE

**Read first:** `App.tsx`, `lib/greenhouse/detector.ts`, `lib/greenhouse/types.ts`, `active-context.md`

**SubmissionToast.tsx** — Create new component:
```tsx
import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  message: string
  duration?: number  // ms, default 4000
  onDismiss: () => void
}

export function SubmissionToast({ message, duration = 4000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), duration - 200)
    const dismissTimer = setTimeout(onDismiss, duration)
    return () => { clearTimeout(fadeTimer); clearTimeout(dismissTimer) }
  }, [duration, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-white rounded-lg border-l-4 border-l-[#22c55e] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', zIndex: 2147483647 }}
    >
      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
      <span className="text-sm font-medium text-[#2a3439]">{message}</span>
    </div>
  )
}
```

**App.tsx updates:**
1. Add `import { SubmissionToast } from './SubmissionToast'`
2. Add `import { watchForSubmissionConfirmation } from '@/lib/greenhouse/detector'`
3. Add state: `const [showToast, setShowToast] = useState(false)`
4. In `handleConfirmFill` (after `fillForm` resolves), add:
   ```typescript
   // Scrape job/company from page
   const jobTitle = document.querySelector('h1.app-title, .posting-headline h2, h1')?.textContent?.trim() ?? 'Unknown Position'
   const companyName = document.querySelector('.company-name, .posting-headline .company')?.textContent?.trim() ?? 'Unknown Company'

   // SYNC-01: track application
   chrome.runtime.sendMessage({
     action: 'trackApplication',
     payload: { applyUrl: window.location.href, jobTitle, companyName, profileId, source: 'extension_autofill' as const },
   })

   // Show toast
   setShowToast(true)

   // SYNC-02: watch for submission confirmation
   const watcher = watchForSubmissionConfirmation((_url) => {
     chrome.runtime.sendMessage({
       action: 'updateApplicationStatus',
       payload: { applyUrl: window.location.href, status: 'applied' },
     })
   })
   // cleanup on unmount via useEffect return or onDismiss
   ```
5. Render toast in JSX:
   ```tsx
   {showToast && (
     <SubmissionToast message="Application tracked!" onDismiss={() => setShowToast(false)} />
   )}
   ```
6. Ensure `profileId` prop is accepted and used (verify it's already threaded from index.tsx)

**Exports:** `SubmissionToast` (named export)

**Commit:** `feat(02-05): SubmissionToast and tracking sync wiring`

---

## TASK-02 — Add SubmissionToast tests to components.test.tsx
**Files:**
- `autoapply/apps/extension/entrypoints/greenhouse.content/components.test.tsx` ← UPDATE

**Read first:** `components.test.tsx`, `SubmissionToast.tsx`

Add to `components.test.tsx`:
```tsx
import { SubmissionToast } from './SubmissionToast'

describe('SubmissionToast', () => {
  it('renders message and icon', () => {
    render(<SubmissionToast message="Application tracked!" onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Application tracked!')).toBeInTheDocument()
  })

  it('calls onDismiss after duration', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<SubmissionToast message="Done" duration={1000} onDismiss={onDismiss} />)
    await vi.advanceTimersByTimeAsync(1000)
    expect(onDismiss).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
```

**Commit:** `test(02-05): SubmissionToast unit tests`

---

## TASK-03 — Run full test suite + build verification
**Files:** none (verification only)

```bash
# From autoapply/apps/extension:
/Users/divyaanshseth/.nvm/versions/node/v20.20.1/bin/node ../../node_modules/vitest/vitest.mjs run --reporter=verbose
```

Expected: ALL tests pass including new SubmissionToast tests. Zero failures.

Fix any failures before proceeding.

Then run build:
```bash
cd autoapply/apps/extension && npm run build
```

Expected: Build completes without errors. No WXT entrypoint conflicts (old .ts file was deleted).

**Commit (only if fixes needed):** `fix(02-05): test + build corrections`

When build and tests are green, write a summary to `control/state.md`:
- Mark 02-05 complete
- Note: "Phase 02 implementation complete — awaiting human E2E verification on live Greenhouse page"

---

**After TASK-03:** This is a checkpoint. Codex stops here.
Claude will update state and present the human E2E checklist (from 02-05-PLAN.md Task 2).
Phase 02 is NOT marked complete until the user verifies end-to-end on a real Greenhouse page.
