# Codebase Structure

**Analysis Date:** 2026-03-24

## Directory Layout

```
autoapply/apps/web/
├── app/                           # Next.js 14 App Router
│   ├── api/                       # API routes
│   │   ├── auth/                  # Authentication endpoints
│   │   ├── applications/          # Application CRUD
│   │   ├── jobs/                  # Job search, scoring, sync
│   │   ├── profile/               # User profile endpoints
│   │   ├── companies/             # Company data seeding
│   │   ├── gmail/                 # Gmail webhook & processing
│   │   └── insights/              # Insights generation
│   ├── (auth)/                    # Auth group layout
│   │   └── login/                 # Login page
│   ├── (dashboard)/               # Protected dashboard layout
│   │   ├── layout.tsx             # Dashboard wrapper
│   │   ├── page.tsx               # Home/pipeline view
│   │   ├── jobs/                  # Jobs discovery
│   │   ├── applications/          # Applications list & detail
│   │   ├── profile/               # User profile
│   │   ├── insights/              # AI-generated insights
│   │   └── calendar/              # Interview calendar
│   ├── layout.tsx                 # Root layout
│   ├── fonts/                     # Custom font files
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── ui/                        # shadcn/ui primitive components
│   ├── layout/                    # Sidebar, header layout components
│   ├── providers/                 # Context providers (Theme, etc)
│   └── dashboard/                 # Dashboard-specific components
├── lib/                           # Business logic & utilities
│   ├── supabase/                  # Supabase clients
│   │   ├── server.ts              # Server-side client factory
│   │   └── client.ts              # Client-side client factory
│   ├── ats/                       # ATS platform adapters
│   │   ├── classify.ts            # Detect ATS platform type
│   │   ├── greenhouse.ts          # Greenhouse adapter
│   │   ├── lever.ts               # Lever adapter
│   │   ├── ashby.ts               # Ashby adapter
│   │   ├── smartrecruiters.ts     # SmartRecruiters adapter
│   │   ├── remoteok.ts            # RemoteOK adapter
│   │   └── types.ts               # ATS type definitions
│   ├── ai/                        # AI/LLM utilities
│   │   ├── gemini.ts              # Gemini API client
│   │   ├── email-classifier.ts    # Email decision classification
│   │   ├── entity-extractor.ts    # Entity extraction from emails
│   │   ├── deadline-extractor.ts  # Deadline extraction
│   │   └── application-matcher.ts # Match jobs to user profile
│   ├── scoring/                   # Job scoring engines
│   │   ├── gemini-scorer.ts       # AI-based job scoring
│   │   └── rule-scorer.ts         # Rule-based scoring fallback
│   ├── gmail/                     # Gmail integration
│   │   ├── client.ts              # Gmail API wrapper
│   │   ├── vault.ts               # Token management
│   │   └── refresh.ts             # Token refresh logic
│   ├── jobs/                      # Job query utilities
│   │   └── filters.ts             # Parse job filter params
│   ├── types.ts                   # Global TypeScript types
│   ├── utils.ts                   # Shared utilities
│   └── universities.ts            # University data/validation
├── supabase/                      # Supabase configuration
│   └── migrations/                # Database migration files
├── middleware.ts                  # Auth & routing middleware
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
└── next.config.js                 # Next.js config
```

## Directory Purposes

**`app/api/`:**
- Purpose: All HTTP endpoints, webhook handlers, background job triggers
- Contains: Route handlers (.ts files with GET/POST/PATCH/DELETE exports)
- Key files: `jobs/route.ts`, `applications/route.ts`, `jobs/score/route.ts`, `gmail/webhook/route.ts`

**`app/(auth)/`:**
- Purpose: Pre-login pages outside dashboard layout
- Contains: Login page, auth callback handlers
- Key files: `login/page.tsx`

**`app/(dashboard)/`:**
- Purpose: Post-login user interface
- Contains: Dashboard pages, protected routes
- Key files: `layout.tsx` (auth guard), `page.tsx` (pipeline), `jobs/page.tsx`, `applications/page.tsx`

**`components/`:**
- Purpose: Reusable React components
- Contains: UI primitives (from shadcn), layout wrappers, page-specific components
- Key files: `layout/Sidebar.tsx`, `dashboard/PipelineKanban.tsx`, `providers/ThemeProvider.tsx`

**`lib/supabase/`:**
- Purpose: Centralized Supabase client management
- Contains: Server/client factory functions
- Key files: `server.ts` (async cookies), `client.ts` (browser API)

**`lib/ats/`:**
- Purpose: Integrate multiple job board platforms
- Contains: Platform-specific parsers and API clients
- Key files: One file per platform (greenhouse.ts, lever.ts, etc)

**`lib/ai/`:**
- Purpose: AI-powered document and email analysis
- Contains: Gemini API wrappers for classification, extraction, scoring
- Key files: `gemini.ts` (base client), `email-classifier.ts`, `deadline-extractor.ts`

**`lib/scoring/`:**
- Purpose: Job-to-profile matching algorithms
- Contains: Two scoring strategies (AI and rules)
- Key files: `gemini-scorer.ts`, `rule-scorer.ts`

**`lib/gmail/`:**
- Purpose: Gmail API integration for email monitoring
- Contains: Gmail API client, token refresh, webhook parsing
- Key files: `client.ts`, `vault.ts`

**`supabase/migrations/`:**
- Purpose: Database schema versioning
- Contains: Timestamped SQL migration files
- Key files: Auto-generated by Supabase CLI

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML/CSS setup
- `app/(dashboard)/layout.tsx`: Auth guard + sidebar wrapper
- `app/api/auth/callback/route.ts`: OAuth callback handler
- `middleware.ts`: Auth + route protection

**Configuration:**
- `package.json`: Dependencies (Next.js 14, Supabase, Tailwind)
- `tsconfig.json`: TypeScript strict mode
- `next.config.js`: Build settings
- `tailwind.config.js`: Theme configuration

**Core Logic:**
- `lib/ats/`: Job board platform adapters
- `lib/ai/`: Gemini-powered analysis
- `lib/scoring/`: Job match scoring
- `lib/supabase/`: Data access factory

**Testing:**
- No explicit test directory visible; tests co-located or in separate spec files
- `package.json` has vitest + @testing-library/react configured

## Naming Conventions

**Files:**
- Route handlers: `app/api/[resource]/route.ts` (HTTP method exports)
- Pages: `app/[group]/[page]/page.tsx`
- Components: PascalCase `components/layout/Sidebar.tsx`
- Utilities: camelCase `lib/jobs/filters.ts`
- Adapters: Platform name `lib/ats/greenhouse.ts`

**Directories:**
- API domains: Plural `api/jobs/`, `api/applications/`, `api/companies/`
- Groups: Parentheses `(auth)`, `(dashboard)` for layout sharing
- Dynamic routes: Brackets `[id]`, `[resource]`
- Feature areas: Feature name `lib/ats/`, `lib/ai/`, `lib/scoring/`

**Functions:**
- API routes: HTTP method names (GET, POST, PATCH, DELETE)
- Utilities: camelCase `parseJobFilters()`, `createClient()`
- Adapters: Action-based `fetchGreenhouseJobs()`, `parseJobAshby()`
- Types: PascalCase `ApplicationWithJob`, `JobScore`

**Types:**
- Models: Entity name `Application`, `Job`, `Company`
- Generics: PascalCase with context `T` for generic types
- Unions: Descriptive `AtsPayload = GreenhousePayload | LeverPayload`

## Where to Add New Code

**New Feature (e.g., analytics dashboard):**
- Primary code: `app/(dashboard)/analytics/page.tsx`
- API endpoints: `app/api/analytics/route.ts`
- Business logic: `lib/analytics/compute.ts`
- Types: Add to `lib/types.ts` or `lib/analytics/types.ts`
- Tests: Co-locate or in `app/(dashboard)/analytics/__tests__/`

**New Component/Module:**
- Reusable component: `components/dashboard/[ComponentName].tsx`
- Layout component: `components/layout/[LayoutName].tsx`
- UI primitive: `components/ui/[primitive].tsx` (from shadcn template)

**New Integration (e.g., new ATS platform):**
- Adapter: `lib/ats/[platform].ts`
- Platform classifier: Update `lib/ats/classify.ts`
- Types: Add to `lib/ats/types.ts`

**Utilities:**
- Shared helpers: `lib/utils.ts`
- Domain-specific: `lib/[domain]/[utility].ts` (e.g., `lib/gmail/helpers.ts`)

**Database Changes:**
- Schema: `supabase/migrations/[timestamp]_[description].sql`
- Types: Regenerate via Supabase CLI or `supabase gen types`

## Special Directories

**`app/fonts/`:**
- Purpose: Custom font files (if any)
- Generated: No
- Committed: Yes

**`supabase/migrations/`:**
- Purpose: Database schema version history
- Generated: By Supabase CLI
- Committed: Yes (source of truth)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (during `npm run build`)
- Committed: No (.gitignored)

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (during `npm install`)
- Committed: No (.gitignored)

---

*Structure analysis: 2026-03-24*
