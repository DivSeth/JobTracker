<!-- GSD:project-start source:PROJECT.md -->
## Project

**AutoApply OS**

An AI-powered job application platform that automates the entire job search lifecycle — from discovering roles and auto-filling applications across ATS platforms, to tracking responses via Gmail intelligence, preparing for interviews, and connecting applicants with referrers at target companies. Built for college students grinding through the internship and new-grad application cycle.

**Core Value:** One-click application submission with full ATS form auto-fill powered by user-created role-specific profiles — eliminating the repetitive manual labor of filling out the same information hundreds of times.

### Constraints

- **Budget**: Zero infrastructure budget at launch — free tiers only (Gemini Flash, Supabase free, Vercel Hobby). Scale spending with traction.
- **ATS Complexity**: Workday forms are multi-page with dynamic fields. Extension must handle page navigation, dropdown population, file uploads.
- **Privacy**: PII encryption required from day 1. GDPR-ready data policies. Users trust us with resumes, work history, and auto-submission credentials.
- **Tech Stack**: Next.js 14 + Supabase + Gemini (established). Browser extension adds Chrome Extension Manifest V3.
- **Timeline**: Core auto-fill loop ASAP. Full platform (prep, analytics, referrals, outreach) by summer 2026.
- **Scalability**: Architecture must support multi-tenant (B2B) even if not built yet. No decisions that lock out org-level accounts.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - All application code, strict mode enabled
- JavaScript (JSX/TSX) - React component syntax
- CSS - Tailwind utility-first styling
## Runtime
- Node.js (v20 compatible based on @types/node)
- npm (monorepo workspaces)
- Lockfile: `package-lock.json` (implied)
## Frameworks
- Next.js 14.2.35 - Server-side rendering, API routes, middleware
- React 18 - UI component framework
- Tailwind CSS 3.4.1 - Utility-first styling
- shadcn 4.1.0 - Pre-built component library
- Radix UI (react-tabs 1.1.13) - Accessible component primitives
- lucide-react 0.577.0 - Icon library
- class-variance-authority 0.7.1 - CSS class composition
- tailwind-merge 3.5.0 - Tailwind class deduplication
- clsx 2.1.1 - Conditional className utility
- tw-animate-css 1.4.0 - Animation utilities
- Vitest 4.1.0 - Unit test runner (configured in `vitest.config.ts`)
- Playwright 1.58.2 - E2E test framework
- Testing Library React 16.3.2 - Component testing utilities
- Jest DOM 6.9.1 - Custom matchers
- jsdom 29.0.1 - DOM emulation
- PostCSS 8 - CSS processing
- ESLint 8 with next config - Code linting
- TypeScript strict mode - Type checking
## Key Dependencies
- `@supabase/supabase-js` 2.99.3 - PostgreSQL database client and authentication
- `@supabase/ssr` 0.9.0 - Server-side rendering support for Supabase auth
- `supabase` 2.83.0 (dev) - CLI for local development and migrations
## Configuration
- Supabase credentials via environment variables:
- Google OAuth credentials:
- AI API keys:
- GitHub integration:
- `tsconfig.json` - TypeScript compiler options with path aliasing (`@/*` maps to root)
- `next.config.mjs` - Minimal Next.js config (using defaults)
- `tailwind.config.ts` - Custom theme extensions for Material Design colors
- `.eslintrc.json` - ESLint configuration extending next
- `vitest.config.ts` - Unit test runner configuration
- `playwright.config.ts` - E2E test framework configuration
- `postcss.config.mjs` - PostCSS with Tailwind plugin
## Platform Requirements
- Node.js 20+
- npm workspaces support
- Supabase local development environment (via `npx supabase start`)
- TypeScript 5.x
- Vercel (detected via `.vercel/` directory and `vercel.json`)
- Next.js server deployment
- PostgreSQL database (via Supabase)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `JobCard.tsx`, `ProfileForm.tsx`)
- Utilities and services: camelCase (e.g., `utils.ts`, `filters.ts`, `client.ts`)
- Type files: `types.ts` for shared types
- API routes: lowercase kebab-case in `/app/api/` directories
- Tests: match component/module name with `.test.tsx` or `.test.ts` suffix
- UI components (shadcn): PascalCase export (e.g., `Badge`, `Card`, `Tabs`)
- Exported components: PascalCase (e.g., `export function JobCard()`)
- Internal/helper functions: camelCase (e.g., `function formatLocation()`, `function addTag()`)
- Async handlers: camelCase with `handle` prefix (e.g., `handleHide()`, `handleApplyClick()`, `handleMarkApplied()`)
- Data transformation: camelCase (e.g., `sanitizeLocation()`, `extractCompanyDomain()`, `stripHtml()`)
- State variables: camelCase (e.g., `hidden`, `applied`, `pendingApply`, `logoFailed`)
- Constants (within module scope): UPPER_SNAKE_CASE (e.g., `JOB_BOARD_DOMAINS`, `SKILL_SUGGESTIONS`, `STATUS_STYLES`)
- Props interfaces: `Props` naming convention with specific export
- Union types: PascalCase (e.g., `ApplicationStatus`, `ATSPlatform`, `SourcePlatform`)
- Interfaces: PascalCase (e.g., `JobWithScore`, `ApplicationWithJob`, `Profile`)
- Type aliases: PascalCase (e.g., `JobType`, `EducationEntry`, `ExperienceEntry`)
## Code Style
- Tool: Next.js ESLint configuration (built-in Next.js lint)
- Default Next.js formatting with Prettier (configured via Next.js)
- No explicit .prettierrc file - uses Next.js defaults
- Line length: No strict limit observed, pragmatic based on readability
- Tool: ESLint (`eslint-config-next`)
- Config: `.eslintrc.json` extends `"next/core-web-vitals"` and `"next/typescript"`
- Key rules enforced:
- Version: TypeScript 5
- Strict mode: Enforced via Next.js config
- Type annotations required for function parameters and return values
- Imports: Use explicit type imports where possible (e.g., `import type { JobWithScore } from '@/lib/types'`)
## Import Organization
- Configured in `vitest.config.ts`: `'@': path.resolve(__dirname, '.')`
- Use `@/` for absolute imports to app root
- Example: `@/lib/types`, `@/components/`, `@/lib/utils`
- No relative imports observed; consistently use absolute paths
## Client/Server Boundary
- Used explicitly in client-side components (e.g., `JobCard.tsx`, `ProfileForm.tsx`, `TagInput.tsx`)
- Indicates interactive React components with hooks (useState, etc.)
- Components in `/components/ui/` are client components for interactive behavior
- Middleware and API routes use server-side logic
- `middleware.ts`: Supabase server client initialization
- API routes in `/app/api/`: Server-side request handling
## Error Handling
- Try-catch blocks with silent failures when appropriate:
- Optional chaining for null checks (e.g., `job.job_scores?.[0]?.score`)
- Null coalescing pattern:
- Async errors: `.catch()` with fallback state updates
- Input validation done at API boundaries (middleware in `middleware.ts`)
- Type safety via TypeScript interfaces prevents runtime errors
## Logging
- Used minimally - no logging observed in components or main logic
- Debugging via React DevTools and browser console
- No error logging middleware detected
## Comments
- JSDoc-style comments for utility functions with logic explanation
- Inline comments for non-obvious behavior (rare, code is mostly self-documenting)
- Example: `/* invalid URL */` for empty catch blocks
- Example: `/* Strip HTML tags and markdown bold from a string */` for utility functions
- Used for exported utility functions (e.g., `/** Strip HTML tags and markdown bold from a string */`)
- Provides documentation for complex logic
- Type annotations replace need for extensive docs in most cases
## Component Props
- Interface named `Props` defined locally in component file
- Interface lists all optional and required props with types
- Example:
## Function Design
- Functions are concise and focused (10-50 lines typical)
- Helper functions extracted for reusability
- Event handlers kept separate from logic
- Destructuring used for component props
- Async functions return Promises
- No function overloading observed
- Components return JSX/ReactNode
- Utilities return typed values (string, boolean, etc.)
- Implicit returns in conditional logic (e.g., `if (hidden) return null`)
## Module Design
- Named exports preferred (e.g., `export function JobCard()`, `export const Badge`)
- Type exports use `export type` (e.g., `export type JobType = 'internship' | 'new_grad' | 'fulltime'`)
- Default exports rare
- `/components/ui/` index files export multiple UI components
- Allows cleaner imports: `from '@/components/ui/badge'`
## Styling
- Utility-first approach with Tailwind class names
- `cn()` utility function for conditional class merging:
- Custom color design tokens (e.g., `bg-surface-card`, `text-on-surface`, `text-primary`)
- Responsive design classes (e.g., `hover:shadow-[...]`, `data-[state=active]:bg-...`)
## Dependencies
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server-centric architecture using async React Server Components
- Auth-protected routes via middleware with Supabase
- RESTful API routes for application state mutations
- Supabase as single source of truth for data
- Modular lib utilities for cross-cutting concerns (ATS, AI, Gmail)
## Layers
- Purpose: User-facing React components and page templates
- Location: `app/(auth)`, `app/(dashboard)`
- Contains: Page components (.tsx), layout wrappers, UI components
- Depends on: Supabase client, lib utilities, dashboard components
- Used by: Next.js router
- Purpose: Handle HTTP requests, authenticate users, apply business logic
- Location: `app/api/`
- Contains: RESTful endpoints for jobs, applications, profiles, Gmail webhooks
- Depends on: Supabase server client, lib utilities (ATS, AI, Gmail)
- Used by: Frontend components, external services (webhooks)
- Purpose: Abstract Supabase client creation and queries
- Location: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Contains: Server/client Supabase client factories
- Depends on: Supabase SDK, Next.js cookies
- Used by: All API routes and server components
- Purpose: Application-specific logic isolated from routing
- Location: `lib/` (organized by domain)
- Contains: ATS platform handlers, AI scoring, Gmail integration, job filters
- Depends on: External APIs (Gemini, Gmail, ATS platforms)
- Used by: API routes, server components
- Purpose: Manage third-party service interactions
- Location: `lib/ats/`, `lib/ai/`, `lib/gmail/`
- Contains: Platform-specific adapters (Greenhouse, Lever, Ashby, SmartRecruiters), AI clients, Gmail API handlers
- Depends on: External APIs, HTTP clients
- Used by: Business logic layer
## Data Flow
## Key Abstractions
- Purpose: Unify different job board/ATS platform interactions
- Examples: `lib/ats/greenhouse.ts`, `lib/ats/lever.ts`, `lib/ats/ashby.ts`, `lib/ats/smartrecruiters.ts`, `lib/ats/remoteok.ts`
- Pattern: Each adapter exports fetch/parse functions returning normalized job data
- Purpose: Evaluate job match against user profile
- Examples: `lib/scoring/gemini-scorer.ts` (AI-based), `lib/scoring/rule-scorer.ts` (heuristic)
- Pattern: Scorer takes job + user profile, returns standardized score object
- Purpose: LLM-powered document/email analysis
- Examples: `lib/ai/email-classifier.ts`, `lib/ai/entity-extractor.ts`, `lib/ai/deadline-extractor.ts`, `lib/ai/gemini.ts`
- Pattern: Each module takes text input, returns structured typed output via Gemini
- Purpose: Manage Gmail API operations and webhook handling
- Examples: `lib/gmail/client.ts`, `lib/gmail/vault.ts`, `lib/gmail/refresh.ts`
- Pattern: Client wraps Gmail API, vault manages token refresh, webhooks trigger processing
## Entry Points
- Location: `app/layout.tsx`
- Triggers: Next.js server start
- Responsibilities: Root layout, font loading, theme script injection
- Location: `app/(auth)/login/page.tsx` + `app/api/auth/callback/route.ts`
- Triggers: User authentication via Supabase OAuth
- Responsibilities: Redirect to Supabase auth, handle callback, set auth cookies
- Location: `app/(dashboard)/layout.tsx`
- Triggers: Authenticated user navigation
- Responsibilities: Check auth via server Supabase client, render sidebar + main layout
- Location: `app/api/*/route.ts` (35+ endpoints)
- Triggers: Frontend fetch requests, external webhooks, cron jobs
- Responsibilities: Auth check, input validation, business logic execution, response formatting
- Location: `middleware.ts`
- Triggers: Every request
- Responsibilities: Auth session management, public/protected route routing, cookie sync
## Error Handling
- Auth errors → 401 Unauthorized
- Server errors → 500 with error.message
- Validation errors → Handled in individual routes (no global validator)
- Supabase query errors → Logged and returned as `{ error: message }`
## Cross-Cutting Concerns
- Public routes whitelisted in middleware.ts
- Protected routes redirect to /login
- User context passed via `supabase.auth.getUser()`
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
