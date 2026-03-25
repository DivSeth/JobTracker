# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `JobCard.tsx`, `ProfileForm.tsx`)
- Utilities and services: camelCase (e.g., `utils.ts`, `filters.ts`, `client.ts`)
- Type files: `types.ts` for shared types
- API routes: lowercase kebab-case in `/app/api/` directories
- Tests: match component/module name with `.test.tsx` or `.test.ts` suffix
- UI components (shadcn): PascalCase export (e.g., `Badge`, `Card`, `Tabs`)

**Functions:**
- Exported components: PascalCase (e.g., `export function JobCard()`)
- Internal/helper functions: camelCase (e.g., `function formatLocation()`, `function addTag()`)
- Async handlers: camelCase with `handle` prefix (e.g., `handleHide()`, `handleApplyClick()`, `handleMarkApplied()`)
- Data transformation: camelCase (e.g., `sanitizeLocation()`, `extractCompanyDomain()`, `stripHtml()`)

**Variables:**
- State variables: camelCase (e.g., `hidden`, `applied`, `pendingApply`, `logoFailed`)
- Constants (within module scope): UPPER_SNAKE_CASE (e.g., `JOB_BOARD_DOMAINS`, `SKILL_SUGGESTIONS`, `STATUS_STYLES`)
- Props interfaces: `Props` naming convention with specific export

**Types:**
- Union types: PascalCase (e.g., `ApplicationStatus`, `ATSPlatform`, `SourcePlatform`)
- Interfaces: PascalCase (e.g., `JobWithScore`, `ApplicationWithJob`, `Profile`)
- Type aliases: PascalCase (e.g., `JobType`, `EducationEntry`, `ExperienceEntry`)

## Code Style

**Formatting:**
- Tool: Next.js ESLint configuration (built-in Next.js lint)
- Default Next.js formatting with Prettier (configured via Next.js)
- No explicit .prettierrc file - uses Next.js defaults
- Line length: No strict limit observed, pragmatic based on readability

**Linting:**
- Tool: ESLint (`eslint-config-next`)
- Config: `.eslintrc.json` extends `"next/core-web-vitals"` and `"next/typescript"`
- Key rules enforced:
  - Next.js best practices (`next/core-web-vitals`)
  - Full TypeScript type checking
  - Example: img elements must use `next/image` (see `@next/next/no-img-element` comment in `JobCard.tsx`)

**TypeScript:**
- Version: TypeScript 5
- Strict mode: Enforced via Next.js config
- Type annotations required for function parameters and return values
- Imports: Use explicit type imports where possible (e.g., `import type { JobWithScore } from '@/lib/types'`)

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `import { useState }`, `import type NextRequest`)
2. Third-party libraries (e.g., `from '@supabase/ssr'`, `from 'lucide-react'`)
3. Internal utilities and components (e.g., `from '@/lib/utils'`, `from '@/components/ui/badge'`)
4. Type imports (e.g., `import type { JobWithScore }`)

**Path Aliases:**
- Configured in `vitest.config.ts`: `'@': path.resolve(__dirname, '.')`
- Use `@/` for absolute imports to app root
- Example: `@/lib/types`, `@/components/`, `@/lib/utils`
- No relative imports observed; consistently use absolute paths

## Client/Server Boundary

**'use client' Directive:**
- Used explicitly in client-side components (e.g., `JobCard.tsx`, `ProfileForm.tsx`, `TagInput.tsx`)
- Indicates interactive React components with hooks (useState, etc.)
- Components in `/components/ui/` are client components for interactive behavior

**Server Components:**
- Middleware and API routes use server-side logic
- `middleware.ts`: Supabase server client initialization
- API routes in `/app/api/`: Server-side request handling

## Error Handling

**Patterns:**
- Try-catch blocks with silent failures when appropriate:
  ```typescript
  try {
    const hostname = new URL(applyUrl).hostname.replace('www.', '')
  } catch { /* invalid URL */ }
  ```
- Optional chaining for null checks (e.g., `job.job_scores?.[0]?.score`)
- Null coalescing pattern:
  ```typescript
  const logoUrl = job.company_logo_url || (job.company_domain ? `...` : null)
  ```
- Async errors: `.catch()` with fallback state updates
  ```typescript
  catch { setPendingApply(false) }
  ```

**Validation:**
- Input validation done at API boundaries (middleware in `middleware.ts`)
- Type safety via TypeScript interfaces prevents runtime errors

## Logging

**Framework:** `console` methods (no structured logging library used)

**Patterns:**
- Used minimally - no logging observed in components or main logic
- Debugging via React DevTools and browser console
- No error logging middleware detected

## Comments

**When to Comment:**
- JSDoc-style comments for utility functions with logic explanation
- Inline comments for non-obvious behavior (rare, code is mostly self-documenting)
- Example: `/* invalid URL */` for empty catch blocks
- Example: `/* Strip HTML tags and markdown bold from a string */` for utility functions

**JSDoc/TSDoc:**
- Used for exported utility functions (e.g., `/** Strip HTML tags and markdown bold from a string */`)
- Provides documentation for complex logic
- Type annotations replace need for extensive docs in most cases

## Component Props

**Props Pattern:**
- Interface named `Props` defined locally in component file
- Interface lists all optional and required props with types
- Example:
  ```typescript
  interface Props {
    job: JobWithScore
    featured?: boolean
  }

  export function JobCard({ job, featured }: Props) {
    // ...
  }
  ```

## Function Design

**Size:**
- Functions are concise and focused (10-50 lines typical)
- Helper functions extracted for reusability
- Event handlers kept separate from logic

**Parameters:**
- Destructuring used for component props
- Async functions return Promises
- No function overloading observed

**Return Values:**
- Components return JSX/ReactNode
- Utilities return typed values (string, boolean, etc.)
- Implicit returns in conditional logic (e.g., `if (hidden) return null`)

## Module Design

**Exports:**
- Named exports preferred (e.g., `export function JobCard()`, `export const Badge`)
- Type exports use `export type` (e.g., `export type JobType = 'internship' | 'new_grad' | 'fulltime'`)
- Default exports rare

**Barrel Files:**
- `/components/ui/` index files export multiple UI components
- Allows cleaner imports: `from '@/components/ui/badge'`

## Styling

**CSS Framework:** Tailwind CSS 3.4.1

**Patterns:**
- Utility-first approach with Tailwind class names
- `cn()` utility function for conditional class merging:
  ```typescript
  cn('flex gap-1 p-1 bg-surface-container rounded-xl', className)
  ```
- Custom color design tokens (e.g., `bg-surface-card`, `text-on-surface`, `text-primary`)
- Responsive design classes (e.g., `hover:shadow-[...]`, `data-[state=active]:bg-...`)

## Dependencies

**UI Components:** shadcn/ui 4.1.0 for Radix UI primitives
**Icons:** lucide-react 0.577.0 for icon components
**Database:** Supabase (v2.99.3) with SSR support
**Framework:** Next.js 14.2.35

---

*Convention analysis: 2026-03-24*
