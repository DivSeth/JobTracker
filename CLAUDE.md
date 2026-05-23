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

## Technology Stack

### Languages
- TypeScript 5 (strict mode)
- CSS via Tailwind utility-first

### Runtime
- Node.js 20+
- npm workspaces
- Lockfile: `package-lock.json`

### Frameworks
- Next.js 14.2.35 — SSR, API routes, middleware
- React 18
- Tailwind CSS 3.4.1
- shadcn 4.1.0
- Radix UI primitives
- lucide-react icons
- `class-variance-authority`, `tailwind-merge`, `clsx`, `tw-animate-css`
- Vitest 4.1.0 (unit), Playwright 1.58.2 (E2E), Testing Library React, Jest DOM, jsdom

### Key Dependencies
- `@supabase/supabase-js` 2.99.3
- `@supabase/ssr` 0.9.0
- `supabase` CLI 2.83.0 (dev)

### Platform
- Node.js 20+, npm workspaces, Supabase local dev, Vercel deploy, PostgreSQL via Supabase.

## Conventions

### Naming
- React components: PascalCase (`JobCard.tsx`)
- Utilities/services: camelCase (`utils.ts`, `filters.ts`)
- Type files: `types.ts`
- API routes: kebab-case under `/app/api/`
- Tests: `.test.tsx` / `.test.ts` alongside the module
- Functions: camelCase; event handlers prefixed `handle*`
- Constants: UPPER_SNAKE_CASE at module scope
- Interfaces / unions / type aliases: PascalCase (`JobWithScore`, `ApplicationStatus`)
- Props interface: named `Props` local to the component file

### Code style
- ESLint: `eslint-config-next` extending `next/core-web-vitals` + `next/typescript`
- Prefer explicit type imports (`import type { ... }`)
- Absolute imports via `@/` (maps to repo root, see `tsconfig.json` + `vitest.config.ts`)
- Named exports preferred; default exports rare
- `'use client'` only on interactive components that use hooks

### Error handling
- Try/catch with narrow silent failures where appropriate
- Optional chaining + null coalescing for safe traversal
- Validate at API boundaries (middleware) — trust internal code
- Rely on TypeScript interfaces for runtime safety

### Styling
- Tailwind utility-first + `cn()` for conditional merging
- Custom design tokens (e.g. `bg-surface-card`, `text-on-surface`, `text-primary`)
- Responsive + state-variant classes (`hover:`, `data-[state=active]:`)

## Architecture

### Pattern
- Server-centric async React Server Components
- Auth-protected via Supabase middleware
- RESTful API routes for mutations
- Supabase as single source of truth
- Modular `lib/` utilities by domain (ATS, AI, Gmail)

### Layers
- **Pages/components** — `app/(auth)`, `app/(dashboard)`, `components/`
- **API routes** — `app/api/*/route.ts` (35+ endpoints)
- **Data access** — `lib/supabase/{server,client}.ts`
- **Business logic** — `lib/` by domain
- **External integrations** — `lib/ats/`, `lib/ai/`, `lib/gmail/`

### Key abstractions
- **ATS adapters** — `lib/ats/{greenhouse,lever,ashby,smartrecruiters,remoteok}.ts` — normalized fetch/parse
- **Scorers** — `lib/scoring/{gemini,rule}-scorer.ts` — standardized score objects
- **AI extractors** — `lib/ai/{email-classifier,entity-extractor,deadline-extractor,gemini}.ts` — Gemini-backed structured output
- **Gmail clients** — `lib/gmail/{client,vault,refresh}.ts`

### Entry points
- `app/layout.tsx` — root layout
- `app/(auth)/login/page.tsx` + `app/api/auth/callback/route.ts` — OAuth
- `app/(dashboard)/layout.tsx` — authed shell
- `middleware.ts` — session management, public/protected routing

### Error handling
- Auth errors → 401
- Server errors → 500 `{ error: message }`
- Validation handled per-route
- Supabase errors logged and returned

---

## Workflow

This project uses **Claude Code + superpowers** as the primary driver, **OpenAI Codex plugin** as a second-opinion reviewer / rescue agent, and a stack of **design MCPs** for UI work. No GSD, no file-bridge handoff.

### Planning → Implementation

Use superpowers skills directly, in order:

1. **Brainstorm** — `superpowers:brainstorming` for anything non-trivial. Produces a design doc.
2. **Write plan** — `superpowers:writing-plans` turns the design into a staged plan with verifiable checkpoints.
3. **Execute** — `superpowers:executing-plans` (or `superpowers:subagent-driven-development` for bigger chunks) carries out the plan with atomic commits.
4. **TDD** — `superpowers:test-driven-development` is the default for anything testable.
5. **Debug** — `superpowers:systematic-debugging` when something's broken.
6. **Ship** — `superpowers:finishing-a-development-branch` when ready for PR.

### Cross-AI review loop (Codex as tester)

After a chunk of work is implemented, invoke Codex manually to get a second-model pass:

- **`/codex:review`** — standard read-only code review. Run after each meaningful feature / PR.
- **`/codex:adversarial-review`** — Codex pressure-tests decisions, questions tradeoffs. Use when confidence is low or stakes are high (security, data migrations, auth).
- **`/codex:rescue`** — hand the problem to Codex as a subagent. It investigates + attempts fixes. Use when Claude is stuck or a bug is nontrivial.
- **`/codex:status` / `/codex:result` / `/codex:cancel`** — manage background Codex jobs.

The loop: Claude implements → `/codex:review` → Claude addresses findings → commit. If blocked, `/codex:rescue`.

### UI / design pipeline

The design toolkit (all MCPs except the first):

- **`frontend-design` skill** (already installed) — aesthetic direction, typography, motion, spatial composition. Invoke before starting visual work.
- **Stitch MCP** — Google Stitch at `stitch.withgoogle.com`. Design in the browser, pipe the design into this session via MCP. Exports to Figma or code.
- **Figma MCP** — read Figma frames → code, or push live UI → Figma. Closes the Stitch → Figma → code loop.
- **21st.dev Magic MCP** — `/ui` command generates production-ready polished React+Tailwind components from a prompt. The highest-ROI tool for "make this look gorgeous fast."
- **Motion AI Kit MCP** — live Motion / Framer Motion docs. Prevents hallucinated animation APIs.
- **claudedesignskills** — Three.js / WebGL / mouse-reactive interactions / 3D skills for next-level stuff.

Rule of thumb:
- Static, structured layouts → Stitch → Figma MCP → implement
- Isolated component (button, card, modal, form) → `/ui <prompt>` via Magic MCP
- Scroll-driven / animated → Framer Motion + Motion AI Kit MCP for docs
- Mouse-reactive / 3D / WebGL → claudedesignskills

### What NOT to do

- Don't fall back to GSD commands (`/gsd:*`) — they're uninstalled.
- Don't create `control/` or `.planning/phases/` work-tracking files. TodoWrite tracks in-session work.
- Don't read `.planning/` unless you're specifically consulting the PROJECT/REQUIREMENTS/ROADMAP docs at its root.
- Don't auto-invoke Codex. Manual slash commands only.
