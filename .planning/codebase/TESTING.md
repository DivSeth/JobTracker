# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Runner:**
- Vitest 4.1.0 (unit and integration tests)
- Playwright 1.58.2 (end-to-end tests)
- Config: `vitest.config.ts`, `playwright.config.ts`

**Assertion Library:**
- `@testing-library/jest-dom` 6.9.1 (provides DOM matchers)
- `@testing-library/react` 16.3.2 (for React component testing)
- Standard Vitest/Jest `expect()` assertions

**Run Commands:**
```bash
npm test              # Run all unit/integration tests with Vitest
npm run test:watch   # Watch mode for Vitest
npm run test:e2e     # Run Playwright E2E tests
```

## Test File Organization

**Location:**
- Separate directory structure: `__tests__/` parallel to source code
- Layout mirrors `/components/` and `/lib/` structure
- Example: Component `components/jobs/JobCard.tsx` has test at `__tests__/components/jobs/JobCard.test.tsx`

**Naming:**
- Pattern: `[ComponentOrModule].test.tsx` for React components
- Pattern: `[Module].test.ts` for utility modules
- Tests files collocated by feature area (jobs, dashboard, profile, etc.)

**Structure:**
```
__tests__/
├── components/
│   ├── dashboard/
│   │   ├── StatsBar.test.tsx
│   │   └── PipelineKanban.test.tsx
│   ├── jobs/
│   │   ├── JobCard.test.tsx
│   │   └── JobFilters.test.tsx
│   ├── profile/
│   │   ├── ProfileForm.test.tsx
│   │   └── ...
│   └── applications/
│       ├── ApplicationKanban.test.tsx
│       └── ApplicationDetail.test.tsx
└── lib/
    ├── types.test.ts
    └── ats/
        ├── smartrecruiters.test.ts
        └── remoteok.test.ts
```

## Test Structure

**Suite Organization:**
- No explicit `describe()` blocks observed - tests use top-level `it()` calls
- Each test is independent and self-contained
- Tests are organized by feature file, not by suite grouping
- Pattern:
```typescript
import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'

it('renders company and title', () => {
  // Arrange
  render(<JobCard job={baseJob} />)

  // Act & Assert
  expect(screen.getByText('Google')).toBeInTheDocument()
})

it('renders location', () => {
  render(<JobCard job={baseJob} />)
  expect(screen.getByText('Mountain View, CA')).toBeInTheDocument()
})
```

**Patterns:**
- **Setup:** Arrange-Act-Assert pattern
  - Arrange: Create test data and render component
  - Act: User interactions (click, type, etc.)
  - Assert: Verify expected outcomes

- **Test data:** Base fixture objects created at top of test file
  ```typescript
  const baseJob: JobWithScore = {
    id: '1', source_id: 's1', source_url: 'https://...',
    title: 'Software Engineer', company: 'Google',
    // ... all required fields
  }
  ```

- **Teardown:** Implicit via Vitest/React Testing Library cleanup

## Mocking

**Framework:** Vitest's native `vi` for spies and mocks

**Patterns:**
```typescript
// Mock global fetch
const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

// Later restore
fetchSpy.mockRestore()
```

**What to Mock:**
- Network requests (fetch, API calls)
- Browser APIs (window.open, etc.)
- External services (fetch spy example in ProfileForm.test.tsx)

**What NOT to Mock:**
- Component internals (test through user interactions)
- Rendering behavior (test what the DOM shows)
- React Testing Library utilities

## Fixtures and Factories

**Test Data:**
- Inline object literals for simple fixtures
- Base object created once, spread for variations
```typescript
const emptyProfile: Partial<Profile> = {}

const baseJob: JobWithScore = {
  id: '1', source_id: 's1', source_url: 'https://...',
  // ... all required fields with realistic defaults
}

// Variation with job_scores
const job: JobWithScore = {
  ...baseJob,
  job_scores: [{
    id: '1', job_id: '1', user_id: 'u', score: 87,
    tier: 'claude_scored', matching_skills: ['Python'],
    // ... other fields
  }],
}
```

- Factory function pattern (example from PipelineKanban.test.tsx):
```typescript
const makeApp = (status: string): ApplicationWithJob => ({
  id: 'a', user_id: 'u', job_id: 'j',
  status, applied_at: '2026-01-01T00:00:00Z',
  last_activity_at: '2026-01-01T00:00:00Z', notes: null, source: 'manual',
  job: { id: 'j', source_id: 's', source_url: null, title: 'SWE', company: 'Acme',
    // ... all required job fields
  },
})
```

**Location:**
- Test data defined in the test file itself
- No shared fixture files or factories library
- Each test file is self-contained

## Coverage

**Requirements:** No coverage enforcement detected (no coverage thresholds in vitest.config.ts)

**View Coverage:**
- Coverage tool available via Vitest CLI but not configured in scripts
- Run manually: `vitest run --coverage`

## Test Types

**Unit Tests:**
- Scope: Individual components and utility functions
- Approach: Testing through React Testing Library (user-centric)
- Examples:
  - `JobCard.test.tsx`: Rendering, props handling, button interactions
  - `types.test.ts`: Type validation and structure verification
  - `ProfileForm.test.tsx`: Form rendering and submission

**Integration Tests:**
- Scope: API calls and form submissions
- Approach: Mock fetch, verify POST request structure
- Example in ProfileForm.test.tsx:
  ```typescript
  it('calls POST /api/profile on submit', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)
    render(<ProfileForm initialProfile={emptyProfile} />)
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' }))
    })
  })
  ```

**E2E Tests:**
- Framework: Playwright 1.58.2
- Config: `playwright.config.ts` with Chromium only
- Location: `/e2e` directory
- Approach: Tests require `next dev` running separately (no webServer block in config)
- Full user workflows across multiple pages

## Common Patterns

**Component Rendering:**
```typescript
import { render, screen } from '@testing-library/react'

// Render component
render(<StatsBar applications={[]} jobCount={42} />)

// Query by text
expect(screen.getByText('OA RATE')).toBeInTheDocument()

// Query by role
const link = screen.getByRole('link', { name: /apply/i })
expect(link).toHaveAttribute('href', 'https://...')

// Query by label
expect(screen.getByLabelText(/skills/i)).toBeInTheDocument()
```

**User Interactions:**
```typescript
import { fireEvent, waitFor } from '@testing-library/react'

// Click events
fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

// Wait for async operations
await waitFor(() => {
  expect(fetchSpy).toHaveBeenCalled()
})

// Timeout optional (default 1000ms)
```

**Async Testing:**
```typescript
it('calls POST /api/profile on submit', async () => {
  render(<ProfileForm initialProfile={emptyProfile} />)
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

  // Wait for async state updates and fetch call
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' }))
  })

  // Cleanup
  fetchSpy.mockRestore()
})
```

**Error Testing:**
- Silent error handling tested via state verification
- Example: Form submission with error caught, then state reset
  ```typescript
  catch { setPendingApply(false) }
  // In test: verify pendingApply state is false after error
  ```

## Setup and Configuration

**Vitest Setup File:** `vitest.setup.ts`
- Single line: `import '@testing-library/jest-dom'`
- Imports Jest DOM matchers for use in all tests

**Vitest Configuration:** `vitest.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',           // DOM environment for React Testing Library
    globals: true,                   // Global test functions (it, expect, etc.)
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],  // Exclude E2E tests
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },  // Path alias support
  },
})
```

**Playwright Configuration:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,  // Fail if .only() left in CI
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',  // Capture trace on retry
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Note: No webServer block - tests require separate `next dev`
})
```

## Test Best Practices Observed

1. **User-centric queries:** Uses `getByRole`, `getByLabelText`, `getByText` (user perspectives)
2. **Minimal mocking:** Only mocks fetch/network, not components
3. **Test independence:** Each test has full data setup, can run in any order
4. **Descriptive test names:** Clear `it()` descriptions ("renders company and title", "shows 0% OA rate")
5. **Type safety:** Tests use proper TypeScript types for test data
6. **Fixtures over factories:** Simple, readable test data objects
7. **No test utilities library:** Each file self-contained for clarity

---

*Testing analysis: 2026-03-24*
