# Profiles Feedback Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 post-launch issues in the profiles/autofill redesign: regional identity accordion UX, EEO save-on-change, resume parsing (switch to pdfjs-dist), experience date pickers, education graduation month, expanded skills list, export data JSON, and EEO autofill alias map.

**Architecture:** All changes are targeted in-place patches to existing components and routes. One new shared data file (`skills-list.ts`), two new routes (`GET /api/profile/export`, updated `parse-resume`), and one new extension utility (`eeo-aliases.ts`). No new hooks or architectural abstractions.

**Tech Stack:** Next.js 14 API routes, React 18 client components, pdfjs-dist (replaces pdf-parse), TypeScript strict, Zod, Supabase, Chrome MV3 extension.

---

## File Map

**Modified:**
- `autoapply/apps/web/lib/types.ts` — add `graduation_month` to `EducationEntry`
- `autoapply/apps/web/lib/schemas/application-profile.ts` — add `graduation_month` to `educationEntrySchema`
- `autoapply/apps/web/components/ui/tag-input.tsx` — import skills list for datalist suggestions
- `autoapply/apps/web/components/profile/RegionalIdentityList.tsx` — accordion state, count, auto-scroll
- `autoapply/apps/web/components/profile/RegionalIdentityCard.tsx` — collapsed summary + chevron toggle
- `autoapply/apps/web/components/profile/RegionalIdentityForm.tsx` — EEO selects call patch() on onChange
- `autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx` — experience type="month", education graduation_month
- `autoapply/apps/web/components/profiles/ResumeParser.tsx` — education graduation_month field
- `autoapply/apps/web/app/(dashboard)/profile/page.tsx` — wire export button as client component
- `autoapply/apps/web/app/api/profiles/[id]/parse-resume/route.ts` — replace pdf-parse with pdfjs-dist, surface errors
- `autoapply/apps/extension/lib/form-fill/events.ts` — accept aliases param in fillSelectField
- `autoapply/apps/extension/lib/greenhouse/filler.ts` — pass EEO aliases when filling EEO fields
- `autoapply/apps/extension/lib/greenhouse/mapper.ts` — tag EEO fields for alias lookup

**Created:**
- `autoapply/apps/web/lib/profile/skills-list.ts` — curated ~400-skill list
- `autoapply/apps/web/app/api/profile/export/route.ts` — GET export route
- `autoapply/apps/extension/lib/greenhouse/eeo-aliases.ts` — EEO value alias map

---

## Task 1: Add `graduation_month` to types and schema

**Files:**
- Modify: `autoapply/apps/web/lib/types.ts`
- Modify: `autoapply/apps/web/lib/schemas/application-profile.ts`

- [ ] **Step 1: Update `EducationEntry` in `lib/types.ts`**

Find the `EducationEntry` interface and add `graduation_month`:

```ts
export interface EducationEntry {
  school: string; degree: string; major: string
  gpa?: number; graduation_year: number
  graduation_month: number | null
}
```

- [ ] **Step 2: Update `educationEntrySchema` in `lib/schemas/application-profile.ts`**

```ts
export const educationEntrySchema = z.object({
  school: z.string().min(1, 'School is required'),
  degree: z.string().min(1, 'Degree is required'),
  major: z.string().min(1, 'Major is required'),
  gpa: z.number().min(0).max(4.0).optional(),
  graduation_year: z.number().int().min(1950).max(2035),
  graduation_month: z.number().int().min(1).max(12).nullable().default(null),
})
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd autoapply/apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: any errors are pre-existing (not from this change). New errors about `graduation_month` missing in callers = fix them in later tasks.

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/lib/types.ts autoapply/apps/web/lib/schemas/application-profile.ts
git commit -m "feat(types): add graduation_month to EducationEntry"
```

---

## Task 2: Create expanded skills list

**Files:**
- Create: `autoapply/apps/web/lib/profile/skills-list.ts`

- [ ] **Step 1: Create the file**

```ts
// autoapply/apps/web/lib/profile/skills-list.ts
export const SKILLS: string[] = [
  // Programming Languages
  'Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust',
  'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Julia', 'Haskell', 'Erlang',
  'Elixir', 'Clojure', 'F#', 'Dart', 'Lua', 'Perl', 'PHP', 'Groovy', 'COBOL',
  'Fortran', 'Assembly', 'Solidity', 'Move', 'Zig',

  // Web Frameworks & Libraries
  'React', 'Next.js', 'Vue', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit', 'Remix',
  'Astro', 'Qwik', 'Solid.js', 'Ember.js', 'Backbone.js', 'jQuery', 'Alpine.js',
  'Express', 'Fastify', 'Koa', 'Hono', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Rails', 'Sinatra', 'Laravel', 'Symfony', 'Spring Boot', 'Spring MVC', 'Quarkus',
  'Micronaut', 'Ktor', 'Play Framework', 'Phoenix', 'Gin', 'Echo', 'Fiber', 'Chi',
  'Actix', 'Axum', 'Rocket', 'ASP.NET Core', 'Blazor',

  // Mobile
  'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Jetpack Compose', 'Android SDK',
  'iOS Development', 'Expo', 'Capacitor', 'Ionic', 'Xamarin', 'MAUI',

  // CSS & Styling
  'Tailwind CSS', 'CSS', 'HTML', 'SCSS', 'Sass', 'CSS Modules', 'Styled Components',
  'Emotion', 'Material UI', 'Chakra UI', 'Radix UI', 'shadcn/ui', 'Ant Design',
  'Bootstrap', 'Bulma',

  // Databases
  'PostgreSQL', 'MySQL', 'SQLite', 'SQL Server', 'Oracle DB', 'MongoDB', 'Redis',
  'Cassandra', 'DynamoDB', 'Firestore', 'CockroachDB', 'PlanetScale', 'Supabase',
  'Firebase', 'Fauna', 'Neo4j', 'InfluxDB', 'TimescaleDB', 'Elasticsearch',
  'OpenSearch', 'Pinecone', 'Weaviate', 'Qdrant', 'Chroma',

  // Cloud & Infrastructure
  'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Cloudflare', 'DigitalOcean', 'Fly.io',
  'Railway', 'Render', 'Heroku', 'Linode', 'Hetzner',

  // DevOps & CI/CD
  'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Pulumi', 'Ansible', 'Chef', 'Puppet',
  'GitHub Actions', 'GitLab CI', 'CircleCI', 'Jenkins', 'ArgoCD', 'Flux',
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'PagerDuty', 'Sentry',
  'OpenTelemetry', 'Jaeger', 'Zipkin', 'Vault', 'Consul',

  // AI / ML / Data
  'PyTorch', 'TensorFlow', 'Keras', 'JAX', 'Hugging Face', 'LangChain', 'LlamaIndex',
  'OpenAI API', 'Anthropic API', 'Gemini API', 'Scikit-learn', 'XGBoost', 'LightGBM',
  'CatBoost', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly',
  'Jupyter', 'Spark', 'Hadoop', 'Flink', 'Kafka', 'Airflow', 'Prefect', 'Dagster',
  'dbt', 'Fivetran', 'Airbyte', 'Great Expectations', 'MLflow', 'Weights & Biases',
  'Ray', 'CUDA', 'OpenCV', 'spaCy', 'NLTK', 'Transformers', 'Diffusers',
  'Stable Diffusion', 'Computer Vision', 'NLP', 'Reinforcement Learning',
  'Time Series Analysis', 'A/B Testing', 'Statistical Modeling', 'Data Visualization',

  // APIs & Protocols
  'REST', 'GraphQL', 'gRPC', 'WebSockets', 'WebRTC', 'MQTT', 'AMQP', 'Kafka',
  'RabbitMQ', 'SQS', 'SNS', 'Pub/Sub', 'tRPC', 'OpenAPI', 'Swagger',

  // Security
  'OAuth 2.0', 'JWT', 'SAML', 'LDAP', 'SSO', 'MFA', 'Penetration Testing',
  'OWASP', 'Cryptography', 'TLS/SSL', 'Zero Trust', 'IAM', 'SIEM',
  'Vulnerability Assessment', 'Threat Modeling', 'Security Auditing',
  'Reverse Engineering', 'Malware Analysis', 'Network Security',

  // Testing
  'Jest', 'Vitest', 'Playwright', 'Cypress', 'Selenium', 'Pytest', 'JUnit',
  'Mocha', 'Chai', 'Testing Library', 'Storybook', 'k6', 'Locust', 'Gatling',
  'Contract Testing', 'TDD', 'BDD',

  // Tools & Platforms
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Linear', 'Notion', 'Confluence',
  'Slack', 'VS Code', 'IntelliJ', 'Xcode', 'Linux', 'Bash', 'PowerShell', 'Vim',
  'tmux', 'Neovim', 'Postman', 'Insomnia', 'Wireshark', 'Nginx', 'Apache',
  'Caddy', 'HAProxy', 'Traefik',

  // Design & Product
  'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin', 'Framer', 'Webflow',
  'Illustrator', 'Photoshop', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
  'UI/UX Design', 'Product Management', 'User Research', 'Usability Testing',
  'Design Systems', 'Wireframing', 'Prototyping', 'Information Architecture',

  // Business & Domain
  'Financial Modeling', 'Valuation', 'Excel', 'Bloomberg Terminal', 'SQL',
  'Tableau', 'Power BI', 'Looker', 'Salesforce', 'HubSpot', 'SAP', 'Workday',
  'Accounting', 'GAAP', 'IFRS', 'FP&A', 'Equity Research', 'Investment Banking',
  'Private Equity', 'Venture Capital', 'Risk Management', 'Derivatives', 'Options',
  'Portfolio Management', 'Quantitative Finance', 'Algorithmic Trading',

  // Science & Engineering
  'CAD', 'SolidWorks', 'AutoCAD', 'ANSYS', 'MATLAB Simulink', 'LabVIEW',
  'PLC Programming', 'Circuit Design', 'PCB Layout', 'FPGA', 'Verilog', 'VHDL',
  'Embedded Systems', 'RTOS', 'CAN Bus', 'ROS', 'Control Systems',
  'Signal Processing', 'Finite Element Analysis', 'Computational Fluid Dynamics',
  'Bioinformatics', 'Clinical Research', 'GCP (Clinical)', 'HIPAA', 'FDA Regulations',
  'Lab Techniques', 'PCR', 'CRISPR', 'Flow Cytometry', 'Mass Spectrometry',

  // Soft Skills
  'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum', 'Kanban',
  'Cross-functional Collaboration', 'Mentoring', 'Technical Writing', 'Public Speaking',
  'Problem Solving', 'Critical Thinking', 'Data-driven Decision Making',
  'Stakeholder Management', 'Product Strategy', 'Go-to-Market', 'Growth',

  // Languages (human)
  'Spanish', 'Mandarin', 'French', 'German', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Portuguese', 'Italian', 'Russian', 'Dutch', 'Swedish',
]
```

- [ ] **Step 2: Commit**

```bash
git add autoapply/apps/web/lib/profile/skills-list.ts
git commit -m "feat(profile): add expanded skills list (~400 entries)"
```

---

## Task 3: Wire skills list into TagInput

**Files:**
- Modify: `autoapply/apps/web/components/ui/tag-input.tsx`

- [ ] **Step 1: Replace hardcoded SKILL_SUGGESTIONS with import**

At the top of `tag-input.tsx`, replace the hardcoded `SKILL_SUGGESTIONS` array with an import:

```ts
'use client'
import { useState, KeyboardEvent } from 'react'
import { SKILLS } from '@/lib/profile/skills-list'
```

Then find where `SKILL_SUGGESTIONS` is used in the `<datalist>` and rename to `SKILLS`:

```tsx
<datalist id="skill-suggestions">
  {SKILLS.map(s => <option key={s} value={s} />)}
</datalist>
```

Also remove the old `const SKILL_SUGGESTIONS = [...]` block entirely.

- [ ] **Step 2: Verify the page compiles**

```bash
cd autoapply/apps/web && npx tsc --noEmit 2>&1 | grep tag-input
```

Expected: no errors on tag-input.tsx.

- [ ] **Step 3: Commit**

```bash
git add autoapply/apps/web/components/ui/tag-input.tsx
git commit -m "feat(skills): wire expanded skills list into TagInput suggestions"
```

---

## Task 4: Fix EEO selects — save on change

**Files:**
- Modify: `autoapply/apps/web/components/profile/RegionalIdentityForm.tsx`

The EEO fields (lines ~291–332) use `onChange={(e) => set(...)}` + `onBlur={() => commit(...)}`. Selects don't reliably fire `onBlur` after option selection. Fix: call `patch()` directly in `onChange`, remove the `onBlur` from those selects.

- [ ] **Step 1: Fix `eeo_gender` select**

Find the `eeo_gender` select and change its handlers:

```tsx
<select
  id={`eeo_gender-${initial.id}`}
  value={values.eeo_gender ?? ''}
  onChange={(e) => {
    const val = e.target.value || null
    set('eeo_gender', val)
    patch({ eeo_gender: val })
  }}
  className="rounded-md border bg-background px-2 py-1"
>
```

- [ ] **Step 2: Fix `eeo_race` select**

```tsx
<select
  id={`eeo_race-${initial.id}`}
  value={values.eeo_race ?? ''}
  onChange={(e) => {
    const val = e.target.value || null
    set('eeo_race', val)
    patch({ eeo_race: val })
  }}
  className="rounded-md border bg-background px-2 py-1"
>
```

- [ ] **Step 3: Fix `eeo_veteran_status` select**

```tsx
<select
  id={`eeo_veteran-${initial.id}`}
  value={values.eeo_veteran_status ?? ''}
  onChange={(e) => {
    const val = e.target.value || null
    set('eeo_veteran_status', val)
    patch({ eeo_veteran_status: val })
  }}
  className="rounded-md border bg-background px-2 py-1"
>
```

- [ ] **Step 4: Fix `eeo_disability_status` select**

```tsx
<select
  id={`eeo_disability-${initial.id}`}
  value={values.eeo_disability_status ?? ''}
  onChange={(e) => {
    const val = e.target.value || null
    set('eeo_disability_status', val)
    patch({ eeo_disability_status: val })
  }}
  className="rounded-md border bg-background px-2 py-1"
>
```

- [ ] **Step 5: Manual test — open a regional identity, change an EEO dropdown, navigate away, come back**

Expected: the selected value persists after returning to the page.

- [ ] **Step 6: Commit**

```bash
git add autoapply/apps/web/components/profile/RegionalIdentityForm.tsx
git commit -m "fix(profile): EEO selects patch on onChange, not onBlur"
```

---

## Task 5: Regional identity accordion UX

**Files:**
- Modify: `autoapply/apps/web/components/profile/RegionalIdentityList.tsx`
- Modify: `autoapply/apps/web/components/profile/RegionalIdentityCard.tsx`

- [ ] **Step 1: Rewrite `RegionalIdentityList.tsx`**

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RegionalIdentityCard } from './RegionalIdentityCard'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface AppProfileOption {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  initial: Stored[]
  appProfiles: AppProfileOption[]
}

const DEFAULT_NEW: Omit<Stored, 'id'> = {
  label: 'New region',
  country_codes: ['US'],
  is_default: false,
  email: '',
  country: 'US',
}

export function RegionalIdentityList({ initial, appProfiles }: Props) {
  const [items, setItems] = useState<Stored[]>(initial)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const newCardRef = useRef<HTMLDivElement | null>(null)

  async function handleAdd() {
    setCreating(true)
    try {
      const res = await fetch('/api/profile/regional-identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_NEW),
      })
      if (res.ok) {
        const created = (await res.json()) as Stored
        setItems((prev) => [...prev, created])
        setOpenIds(new Set([created.id]))
      }
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (newCardRef.current) {
      setTimeout(() => {
        newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [items.length])

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setOpenIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const newestId = items[items.length - 1]?.id

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {items.length} Region{items.length !== 1 ? 's' : ''}
        </h2>
        <Button onClick={handleAdd} disabled={creating}>
          + Add region
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((it) => (
          <div
            key={it.id}
            ref={it.id === newestId ? newCardRef : null}
          >
            <RegionalIdentityCard
              identity={it}
              isOpen={openIds.has(it.id)}
              onToggle={() => toggleOpen(it.id)}
              onDeleted={handleDeleted}
              appProfiles={appProfiles}
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-on-surface-muted">
            No regions yet. Add at least one before the extension can auto-fill applications.
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Rewrite `RegionalIdentityCard.tsx`**

```tsx
'use client'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { RegionalIdentityForm } from './RegionalIdentityForm'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface AppProfileOption {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  identity: Stored
  isOpen: boolean
  onToggle: () => void
  onDeleted: (id: string) => void
  appProfiles: AppProfileOption[]
}

export function RegionalIdentityCard({ identity, isOpen, onToggle, onDeleted, appProfiles }: Props) {
  const countrySummary = (identity.country_codes ?? []).join(', ')
  const label = identity.label ?? 'New region'

  return (
    <article className="rounded-lg border bg-surface-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isOpen
            ? <ChevronDown size={16} className="text-on-surface-muted shrink-0" />
            : <ChevronRight size={16} className="text-on-surface-muted shrink-0" />
          }
          <span className="font-medium text-sm">{label}</span>
          {countrySummary && (
            <span className="text-xs text-on-surface-muted">· {countrySummary}</span>
          )}
        </div>
        {identity.is_default && (
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Default</span>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-border-subtle">
          <RegionalIdentityForm initial={identity} onDeleted={onDeleted} appProfiles={appProfiles} />
        </div>
      )}
    </article>
  )
}
```

- [ ] **Step 3: Manual test**
  - Load `/profile`, confirm all existing region cards are collapsed showing label + country codes.
  - Click a card header — it expands.
  - Click "Add region" — new card appears expanded, others collapse, page scrolls to it.
  - Delete a region — count updates.

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/components/profile/RegionalIdentityList.tsx autoapply/apps/web/components/profile/RegionalIdentityCard.tsx
git commit -m "feat(profile): regional identity accordion with auto-scroll and live count"
```

---

## Task 6: Experience date pickers + education graduation month in forms

**Files:**
- Modify: `autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx`
- Modify: `autoapply/apps/web/components/profiles/ResumeParser.tsx`

Both files manage `ExperienceEntry[]` and `EducationEntry[]` in local state. `ApplicationProfileForm` uses text inputs for experience start/end. Both need `graduation_month` added to education.

- [ ] **Step 1: Fix experience start/end in `ApplicationProfileForm.tsx`**

Find the experience start date input (around line 207) which looks like:
```tsx
onChange={e => { setExperience(ex => ex.map((x, j) => j === i ? { ...x, start: e.target.value } : x)); markDirty() }}
```

Change its `type` attribute from `type="text"` (or no type) to `type="month"` and add a `placeholder="YYYY-MM"`:

```tsx
<input
  type="month"
  id={`exp-start-${i}`}
  value={ex.start}
  onChange={e => { setExperience(exps => exps.map((x, j) => j === i ? { ...x, start: e.target.value } : x)); markDirty() }}
  className="..."
/>
```

Do the same for the end date input (around line 217).

- [ ] **Step 2: Add `graduation_month` to education state in `ApplicationProfileForm.tsx`**

The `emptyEducation` factory and the education state use `EducationEntry`. Since `graduation_month` is now part of the type, update the default factory (if one exists inline) or the `useState` initial map:

Find where education entries are initialized (around line 41):
```ts
const [education, setEducation] = useState<EducationEntry[]>(profile.education ?? [])
```

Ensure existing entries from `profile.education` pass through as-is (they'll have `graduation_month: null` or undefined from DB — Zod default handles this). No state change needed, just add the UI field.

- [ ] **Step 3: Add graduation month UI to education section in `ApplicationProfileForm.tsx`**

Find the graduation year input (around line 312):
```tsx
onChange={e => { setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_year: Number(e.target.value) } : x)); markDirty() }}
```

Add a month dropdown immediately before it:

```tsx
{/* Graduation Month */}
<div className="space-y-1.5">
  <label htmlFor={`edu-gm-${i}`} className="block label-sm text-on-surface-muted">Graduation Month</label>
  <select
    id={`edu-gm-${i}`}
    value={edu.graduation_month ?? ''}
    onChange={e => {
      const val = e.target.value ? Number(e.target.value) : null
      setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_month: val } : x))
      markDirty()
    }}
    className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
  >
    <option value="">— Month —</option>
    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
      <option key={m} value={idx + 1}>{m}</option>
    ))}
  </select>
</div>

{/* Graduation Year — already exists, keep as-is */}
```

- [ ] **Step 4: Add graduation month to `ResumeParser.tsx`**

In `ResumeParser.tsx`, find the education section. The `emptyEducation` factory:
```ts
const emptyEducation = (): EducationEntry => ({
  school: '', degree: '', major: '', graduation_year: new Date().getFullYear(),
})
```

Update it:
```ts
const emptyEducation = (): EducationEntry => ({
  school: '', degree: '', major: '', graduation_year: new Date().getFullYear(), graduation_month: null,
})
```

Then add the month dropdown in the education grid (before the graduation year input), using the same markup as Step 3 but with `ResumeParser`'s state setter:

```tsx
<div className="space-y-1.5">
  <label htmlFor={`re-edu-gm-${i}`} className="block label-sm text-on-surface-muted">Graduation Month</label>
  <select
    id={`re-edu-gm-${i}`}
    value={edu.graduation_month ?? ''}
    onChange={e => {
      const val = e.target.value ? Number(e.target.value) : null
      setEducation(ed => ed.map((x, j) => j === i ? { ...x, graduation_month: val } : x))
    }}
    className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
  >
    <option value="">— Month —</option>
    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
      <option key={m} value={idx + 1}>{m}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 5: TypeScript check**

```bash
cd autoapply/apps/web && npx tsc --noEmit 2>&1 | grep -E "ApplicationProfileForm|ResumeParser"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add autoapply/apps/web/components/profiles/ApplicationProfileForm.tsx autoapply/apps/web/components/profiles/ResumeParser.tsx
git commit -m "feat(profile): experience month pickers + education graduation month field"
```

---

## Task 7: Fix resume parsing — replace pdf-parse with pdfjs-dist

**Files:**
- Modify: `autoapply/apps/web/app/api/profiles/[id]/parse-resume/route.ts`

- [ ] **Step 1: Install pdfjs-dist**

```bash
cd autoapply/apps/web && npm install pdfjs-dist
```

Expected: added to `package.json` dependencies.

- [ ] **Step 2: Update parse-resume route**

Replace the entire file content:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'

interface ResumeParseResult {
  experience: Array<{
    company: string
    role: string
    employment_type: string
    start: string
    end: string | null
    bullets: string[]
  }>
  education: Array<{
    school: string
    degree: string
    major: string
    gpa: number | null
    graduation_year: number
    graduation_month: number | null
  }>
  skills: string[]
  certifications: Array<{
    name: string
    issuer: string
    date: string | null
    expiry: string | null
  }>
  languages: Array<{
    language: string
    proficiency: string
  }>
}

const RESUME_PARSE_SYSTEM = `You are a resume parser. Extract structured data from resume text. Be thorough — extract ALL entries. Use ISO date formats (YYYY-MM). For employment_type, infer from context: use 'internship' if the role mentions intern/internship, 'full_time' otherwise. For language proficiency, infer from context or default to 'professional'. Return valid JSON only.`

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdfjs out of the module graph for other routes
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Disable worker in Node.js serverless environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const data = new Uint8Array(buffer)
  const doc = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(text)
  }
  return pages.join('\n').trim()
}

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: profileError } = await supabase
    .from('application_profiles')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  let fileBuffer: Buffer

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    fileBuffer = Buffer.from(await file.arrayBuffer())
  } else {
    const body = await request.json()
    const resumePath = body?.resume_path as string | undefined
    if (!resumePath) return NextResponse.json({ error: 'No file or resume_path provided' }, { status: 400 })
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('profile-documents')
      .download(resumePath)
    if (downloadError || !fileData) {
      return NextResponse.json({ error: `Failed to download resume: ${downloadError?.message ?? 'unknown'}` }, { status: 500 })
    }
    fileBuffer = Buffer.from(await fileData.arrayBuffer())
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })

  let resumeText = ''
  try {
    resumeText = await extractTextFromPdf(fileBuffer)
  } catch (pdfErr) {
    const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
    return NextResponse.json({ error: `PDF text extraction failed: ${msg}` }, { status: 500 })
  }

  const RESUME_PARSE_PROMPT = resumeText.length >= 50
    ? `Extract the following structured data from this resume text. Return JSON with these exact fields:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null if current", "bullets": ["achievement 1"]}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024, "graduation_month": 5}],
  "skills": ["skill1", "skill2"],
  "certifications": [{"name": "", "issuer": "", "date": "YYYY-MM or null", "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}

graduation_month is 1–12 (1=Jan). If month unknown, use null. If a section has no data, use [].

Resume text:
\`\`\`
${resumeText}
\`\`\``
    : `You are a resume parser. Extract ALL structured data from this resume. Return JSON:
{
  "experience": [{"company": "", "role": "", "employment_type": "full_time|internship|part_time|contract", "start": "YYYY-MM", "end": "YYYY-MM or null", "bullets": []}],
  "education": [{"school": "", "degree": "", "major": "", "gpa": null, "graduation_year": 2024, "graduation_month": 5}],
  "skills": [],
  "certifications": [{"name": "", "issuer": "", "date": null, "expiry": null}],
  "languages": [{"language": "", "proficiency": "native|fluent|professional|basic"}]
}
graduation_month is 1–12 or null.`

  try {
    const result = await callGemini(RESUME_PARSE_PROMPT, RESUME_PARSE_SYSTEM, 4096)
    const parsed = parseGeminiJSON<ResumeParseResult>(result.text)
    return NextResponse.json({ data: parsed, tokens: { input: result.inputTokens, output: result.outputTokens } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini parse failed: ${msg}` }, { status: 500 })
  }
}
```

- [ ] **Step 3: Test locally — upload a real PDF resume on the app profiles page**

Navigate to `http://localhost:3000` → App Profiles → open a profile → upload a PDF resume. Watch the dev server log:

```bash
tail -f /tmp/nextjs-dev.log
```

Expected: no error in logs, parsed data appears in the Review panel.

- [ ] **Step 4: Commit**

```bash
git add autoapply/apps/web/app/api/profiles/\[id\]/parse-resume/route.ts autoapply/apps/web/package.json autoapply/apps/web/package-lock.json
git commit -m "fix(parse-resume): replace pdf-parse with pdfjs-dist, surface errors"
```

---

## Task 8: Export data — route + button

**Files:**
- Create: `autoapply/apps/web/app/api/profile/export/route.ts`
- Modify: `autoapply/apps/web/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Create the export route**

```ts
// autoapply/apps/web/app/api/profile/export/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [baseRes, regionalRes, profilesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_regional_identities').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
    supabase.from('application_profiles').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    baseIdentity: baseRes.data ?? null,
    regionalIdentities: regionalRes.data ?? [],
    applicationProfiles: profilesRes.data ?? [],
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="autoapply-export.json"',
    },
  })
}
```

- [ ] **Step 2: Create an `ExportButton` client component at the top of `profile/page.tsx`**

Since `ProfilePage` is a Server Component, extract the export button into a small `'use client'` component defined in the same file (or a separate file — same file is fine for one-off components):

Add this above the `export default async function ProfilePage()`:

```tsx
'use client'
function ExportButton() {
  async function handleExport() {
    const res = await fetch('/api/profile/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'autoapply-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={handleExport}
      className="px-4 py-1.5 border border-white/10 hover:bg-white/5 transition-all rounded text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-[16px]">file_download</span>
      Export Data
    </button>
  )
}
```

> **Note:** Because this component uses `'use client'` and the file starts with server imports, you need to move the `'use client'` directive to a separate file. Create `autoapply/apps/web/components/profile/ExportButton.tsx` with the component above, then import it in `profile/page.tsx`.

**`components/profile/ExportButton.tsx`:**

```tsx
'use client'

export function ExportButton() {
  async function handleExport() {
    const res = await fetch('/api/profile/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'autoapply-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={handleExport}
      className="px-4 py-1.5 border border-white/10 hover:bg-white/5 transition-all rounded text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-[16px]">file_download</span>
      Export Data
    </button>
  )
}
```

- [ ] **Step 3: Wire button into `profile/page.tsx`**

Add the import at the top of `profile/page.tsx`:
```tsx
import { ExportButton } from '@/components/profile/ExportButton'
```

Replace the existing static button:
```tsx
// BEFORE:
<button className="px-4 py-1.5 border border-white/10 hover:bg-white/5 transition-all rounded text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-2">
  <span className="material-symbols-outlined text-[16px]">file_download</span>
  Export Data
</button>

// AFTER:
<ExportButton />
```

- [ ] **Step 4: Manual test**

Click Export Data on the profile page. Browser should download `autoapply-export.json`. Open the file and verify it contains `baseIdentity`, `regionalIdentities`, and `applicationProfiles`.

- [ ] **Step 5: Commit**

```bash
git add autoapply/apps/web/app/api/profile/export/route.ts autoapply/apps/web/components/profile/ExportButton.tsx autoapply/apps/web/app/\(dashboard\)/profile/page.tsx
git commit -m "feat(profile): export data as JSON download"
```

---

## Task 9: EEO autofill alias map

**Files:**
- Create: `autoapply/apps/extension/lib/greenhouse/eeo-aliases.ts`
- Modify: `autoapply/apps/extension/lib/form-fill/events.ts`
- Modify: `autoapply/apps/extension/lib/greenhouse/filler.ts`
- Modify: `autoapply/apps/extension/lib/greenhouse/mapper.ts`

- [ ] **Step 1: Create `eeo-aliases.ts`**

```ts
// autoapply/apps/extension/lib/greenhouse/eeo-aliases.ts

// Maps our canonical stored EEO values → known ATS phrasings (case-insensitive match applied at runtime)
export const EEO_ALIASES: Record<string, string[]> = {
  'Decline to self-identify': [
    "decline to self-identify",
    "i don't wish to answer",
    "i prefer not to say",
    "prefer not to say",
    "prefer not to disclose",
    "choose not to disclose",
    "i do not wish to provide this information",
    "i do not wish to identify",
    "decline to identify",
    "i choose not to answer",
    "not disclosed",
    "undisclosed",
  ],
  'Male': ['male', 'man', 'he/him'],
  'Female': ['female', 'woman', 'she/her'],
  'Non-binary': ['non-binary', 'nonbinary', 'they/them', 'gender non-conforming', 'genderqueer'],
  'Not a veteran': [
    'not a veteran',
    'i am not a protected veteran',
    'i am not a veteran',
    'no',
  ],
  'Protected veteran': [
    'protected veteran',
    'i am a protected veteran',
    'i identify as a protected veteran',
    'yes',
  ],
  'Yes': ['yes', 'i have a disability', 'i have a disability or condition'],
  'No': ['no', 'i do not have a disability', 'i don\'t have a disability'],
  'American Indian or Alaskan Native': ['american indian or alaskan native', 'american indian or alaska native', 'native american'],
  'Asian': ['asian', 'asian american'],
  'Black or African American': ['black or african american', 'black', 'african american'],
  'Hispanic or Latino': ['hispanic or latino', 'hispanic', 'latino', 'latina', 'latinx'],
  'Native Hawaiian or Other Pacific Islander': ['native hawaiian or other pacific islander', 'pacific islander'],
  'Two or more races': ['two or more races', 'multiracial', 'two or more', 'mixed race'],
  'White': ['white', 'caucasian', 'white (not of hispanic or latino origin)'],
}
```

- [ ] **Step 2: Update `fillSelectField` in `events.ts` to accept aliases**

Find the `fillSelectField` function and update its signature and logic:

```ts
export function fillSelectField(
  el: HTMLSelectElement,
  value: string,
  aliases?: Record<string, string[]>
): void {
  el.focus()
  dispatchFocus(el)

  const normalized = value.trim().toLowerCase()

  // Build list of candidate values to match against (canonical + any aliases)
  const candidates: string[] = [normalized]
  if (aliases) {
    for (const [canonical, aliasList] of Object.entries(aliases)) {
      if (canonical.trim().toLowerCase() === normalized) {
        candidates.push(...aliasList.map((a) => a.toLowerCase()))
        break
      }
    }
  }

  const match = Array.from(el.options).find((option) => {
    const optionText = option.text.trim().toLowerCase()
    const optionValue = option.value.trim().toLowerCase()
    return candidates.some(
      (c) =>
        optionText === c ||
        optionValue === c ||
        optionText.includes(c) ||
        (optionText !== '' && c.includes(optionText))
    )
  })

  if (match) {
    el.value = match.value
  }

  dispatchChange(el)
  dispatchBlur(el)
}
```

- [ ] **Step 3: Tag EEO fields in `mapper.ts`**

In `mapper.ts`, find the `DEFAULT_RULES` array. Add an `isEeo: true` flag to the EEO field rules. If no EEO rules exist yet, add them. Look for patterns like `eeo_gender`, `eeo_race`, etc. and add:

```ts
{ field_pattern: 'gender|sex(?!ual)', profile_path: 'eeo_gender', source: 'user_profile', isEeo: true },
{ field_pattern: 'race|ethnicity|ethnic', profile_path: 'eeo_race', source: 'user_profile', isEeo: true },
{ field_pattern: 'veteran', profile_path: 'eeo_veteran_status', source: 'user_profile', isEeo: true },
{ field_pattern: 'disability|disabled', profile_path: 'eeo_disability_status', source: 'user_profile', isEeo: true },
```

Also update the `FieldMappingRule` type in `types.ts` (extension) to include the optional flag:

```ts
interface FieldMappingRule {
  // ... existing fields ...
  isEeo?: boolean
}
```

- [ ] **Step 4: Pass aliases in `filler.ts` for EEO fields**

In `filler.ts`, import the aliases and update the `select` case:

```ts
import { EEO_ALIASES } from '@/lib/greenhouse/eeo-aliases'
```

In the `switch` on `mappedField.field.type`, update the `'select'` case:

```ts
case 'select':
  fillSelectField(
    target as HTMLSelectElement,
    mappedField.profileValue ?? '',
    mappedField.field.isEeo ? EEO_ALIASES : undefined
  )
  break
```

Also update `MappedField` in the extension's `types.ts` so `field` carries `isEeo`:

```ts
interface GreenhouseField {
  // ... existing fields ...
  isEeo?: boolean
}
```

- [ ] **Step 5: Rebuild extension**

```bash
cd autoapply/apps/extension && npm run build 2>&1 | tail -10
```

Expected: `✔ Built extension in X.Xs`

- [ ] **Step 6: Reload extension in Chrome and test EEO autofill**

1. Go to `chrome://extensions` → AutoApply → reload.
2. Navigate to a Greenhouse job application that has EEO dropdowns.
3. Trigger autofill from the extension popup.
4. Verify EEO dropdowns populate correctly (gender, race, veteran, disability).

- [ ] **Step 7: Commit**

```bash
git add autoapply/apps/extension/lib/greenhouse/eeo-aliases.ts autoapply/apps/extension/lib/form-fill/events.ts autoapply/apps/extension/lib/greenhouse/filler.ts autoapply/apps/extension/lib/greenhouse/mapper.ts
git commit -m "feat(autofill): EEO alias map for ATS dropdown matching"
```

---

## Task 10: Update Vercel environment variable (manual)

This is a manual step — no code change.

- [ ] **Step 1: Open Vercel dashboard**

Go to vercel.com → `autoapply-seven` project → Settings → Environment Variables.

- [ ] **Step 2: Update `NEXT_PUBLIC_SUPABASE_ANON_KEY`**

Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`, edit it, and set the value to:
```
sb_publishable_2efx2Tb7vJsmB4o1yqyjDw_dRcMuV7Q
```

Apply to: Production, Preview, Development.

- [ ] **Step 3: Redeploy**

Trigger a redeployment (Deployments tab → Redeploy latest). Wait for it to complete.

- [ ] **Step 4: Verify**

Open `https://autoapply-seven.vercel.app/login`, sign in via Google, confirm you reach the dashboard without `auth_failed`.

---

## Self-Review Checklist

- [x] Spec §1 (accordion UX) → Task 5
- [x] Spec §2 (EEO save on change) → Task 4; Vercel env → Task 10
- [x] Spec §3 (resume parsing pdfjs-dist + error surfacing) → Task 7
- [x] Spec §4 (experience date pickers) → Task 6 Step 1
- [x] Spec §5 education month → Task 6 Steps 2–4; skills expansion → Tasks 2–3
- [x] Spec §6 (export JSON) → Task 8
- [x] Spec §7 (EEO alias map) → Task 9
- [x] `graduation_month` added to types, schema, parse prompt, both form components, and ResumeParser
- [x] `isEeo` flag defined in both `FieldMappingRule` and `GreenhouseField` before used in filler
- [x] `fillSelectField` signature updated before filler calls it with new param
- [x] No TBDs or placeholder steps
