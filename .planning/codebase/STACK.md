# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- TypeScript 5 - All application code, strict mode enabled

**Secondary:**
- JavaScript (JSX/TSX) - React component syntax
- CSS - Tailwind utility-first styling

## Runtime

**Environment:**
- Node.js (v20 compatible based on @types/node)

**Package Manager:**
- npm (monorepo workspaces)
- Lockfile: `package-lock.json` (implied)

## Frameworks

**Core:**
- Next.js 14.2.35 - Server-side rendering, API routes, middleware
- React 18 - UI component framework
- Tailwind CSS 3.4.1 - Utility-first styling

**UI Components:**
- shadcn 4.1.0 - Pre-built component library
- Radix UI (react-tabs 1.1.13) - Accessible component primitives
- lucide-react 0.577.0 - Icon library
- class-variance-authority 0.7.1 - CSS class composition
- tailwind-merge 3.5.0 - Tailwind class deduplication
- clsx 2.1.1 - Conditional className utility
- tw-animate-css 1.4.0 - Animation utilities

**Testing:**
- Vitest 4.1.0 - Unit test runner (configured in `vitest.config.ts`)
- Playwright 1.58.2 - E2E test framework
- Testing Library React 16.3.2 - Component testing utilities
- Jest DOM 6.9.1 - Custom matchers
- jsdom 29.0.1 - DOM emulation

**Build/Dev:**
- PostCSS 8 - CSS processing
- ESLint 8 with next config - Code linting
- TypeScript strict mode - Type checking

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.99.3 - PostgreSQL database client and authentication
- `@supabase/ssr` 0.9.0 - Server-side rendering support for Supabase auth

**Infrastructure:**
- `supabase` 2.83.0 (dev) - CLI for local development and migrations

## Configuration

**Environment:**
- Supabase credentials via environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Published to client
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Published to client
  - `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- Google OAuth credentials:
  - `GOOGLE_CLIENT_ID` - Public client identifier
  - `GOOGLE_CLIENT_SECRET` - Server-side only
- AI API keys:
  - `GEMINI_API_KEY` - Server-side only
- GitHub integration:
  - `GITHUB_TOKEN` - Server-side only

**Build:**
- `tsconfig.json` - TypeScript compiler options with path aliasing (`@/*` maps to root)
- `next.config.mjs` - Minimal Next.js config (using defaults)
- `tailwind.config.ts` - Custom theme extensions for Material Design colors
- `.eslintrc.json` - ESLint configuration extending next
- `vitest.config.ts` - Unit test runner configuration
- `playwright.config.ts` - E2E test framework configuration
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Platform Requirements

**Development:**
- Node.js 20+
- npm workspaces support
- Supabase local development environment (via `npx supabase start`)
- TypeScript 5.x

**Production:**
- Vercel (detected via `.vercel/` directory and `vercel.json`)
- Next.js server deployment
- PostgreSQL database (via Supabase)

---

*Stack analysis: 2026-03-24*
