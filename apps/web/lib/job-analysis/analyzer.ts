import { normalizeCompanyName } from '@/lib/knowledge-graph/repository'

export type RoleArchetypeKey =
  | 'backend'
  | 'full_stack'
  | 'frontend'
  | 'ai_ml'
  | 'ai_platform'
  | 'quant_swe'
  | 'sre_infra'
  | 'consulting'

export interface PastedJobInput {
  jobText: string
  applyUrl?: string
  companyName?: string
  jobTitle?: string
}

export interface JobAnalysisResult {
  apply_url?: string
  company_name: string | null
  normalized_company: string | null
  title: string | null
  role_archetype_key: RoleArchetypeKey
  seniority: string
  tech_stack: string[]
  requirements: string[]
  hidden_priorities: string[]
  strategy: {
    focus: string[]
    suppress: string[]
    proof_points: string[]
  }
  fit_score: number
}

const ROLE_KEYWORDS: Record<RoleArchetypeKey, string[]> = {
  backend: [
    'backend',
    'distributed',
    'api',
    'service',
    'services',
    'queue',
    'queues',
    'reliability',
    'observability',
    'platform',
    'cloud',
  ],
  full_stack: [
    'full stack',
    'full-stack',
    'product engineer',
    'product-minded',
    'customer-facing',
    'react',
    'frontend',
    'backend',
    'node',
  ],
  frontend: ['frontend', 'front-end', 'react', 'design system', 'accessibility', 'web performance'],
  ai_ml: ['machine learning', 'ml', 'model', 'data science', 'training', 'inference'],
  ai_platform: ['ai platform', 'llm', 'rag', 'retrieval', 'vector', 'eval', 'agent', 'model serving'],
  quant_swe: ['quant', 'c++', 'low latency', 'trading', 'market data', 'order book', 'matching engine'],
  sre_infra: ['sre', 'infrastructure', 'kubernetes', 'terraform', 'incident', 'on-call', 'observability'],
  consulting: ['consulting', 'client', 'stakeholder', 'business analyst', 'requirements gathering'],
}

const TECH_PATTERNS: Array<[string, RegExp]> = [
  ['typescript', /\btypescript\b/i],
  ['react', /\breact\b/i],
  ['next.js', /\bnext\.?js\b/i],
  ['postgres', /\bpostgres(?:ql)?\b/i],
  ['redis', /\bredis\b/i],
  ['python', /\bpython\b/i],
  ['aws', /\baws\b|amazon web services/i],
  ['kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['c++', /(^|[^a-z0-9])c\+\+([^a-z0-9]|$)/i],
  ['node', /\bnode(?:\.js)?\b/i],
  ['go', /\bgolang\b|\bgo\b/i],
  ['kafka', /\bkafka\b/i],
  ['java', /\bjava\b/i],
  ['graphql', /\bgraphql\b/i],
  ['docker', /\bdocker\b/i],
  ['terraform', /\bterraform\b/i],
]

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function inferCompanyFromApplyUrl(applyUrl?: string): string | null {
  if (!applyUrl) return null

  try {
    const url = new URL(applyUrl)
    const firstPathSegment = url.pathname.split('/').filter(Boolean)[0]

    if (!firstPathSegment) return null

    if (['jobs.ashbyhq.com', 'jobs.gem.com'].includes(url.hostname)) {
      return titleCaseSlug(decodeURIComponent(firstPathSegment))
    }
  } catch {
    return null
  }

  return null
}

export function classifyRoleArchetype(jobText: string): RoleArchetypeKey {
  const text = jobText.toLowerCase()

  if (/\bfull[-\s]?stack\b/.test(text) || /\bproduct engineer\b/.test(text)) {
    return 'full_stack'
  }

  if (/\bfront[-\s]?end\b/.test(text) && !/\bbackend\b/.test(text)) {
    return 'frontend'
  }

  const scores = Object.entries(ROLE_KEYWORDS).map(([role, keywords]) => ({
    role: role as RoleArchetypeKey,
    score: keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0),
  }))

  scores.sort((a, b) => b.score - a.score)

  if (scores[0]?.score > 0) {
    return scores[0].role
  }

  return 'backend'
}

export function extractTechStack(jobText: string): string[] {
  return TECH_PATTERNS
    .filter(([, pattern]) => pattern.test(jobText))
    .map(([tech]) => tech)
}

function extractFirstNonEmptyLines(jobText: string): string[] {
  return jobText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function inferTitle(lines: string[], explicitTitle?: string): string | null {
  if (explicitTitle?.trim()) return explicitTitle.trim()
  return lines.find((line) => /engineer|developer|analyst|scientist|manager|intern/i.test(line)) ?? null
}

const NON_COMPANY_LABELS = new Set([
  'location',
  'employment type',
  'location type',
  'department',
  'overview',
  'application',
])

function inferCompany(
  lines: string[],
  title: string | null,
  explicitCompany?: string,
  applyUrl?: string
): string | null {
  if (explicitCompany?.trim()) return explicitCompany.trim()
  const urlCompany = inferCompanyFromApplyUrl(applyUrl)
  if (urlCompany) return urlCompany

  const titleIndex = title ? lines.indexOf(title) : -1
  const candidate = titleIndex >= 0 ? lines[titleIndex + 1] : null
  if (candidate && candidate.length <= 80 && !NON_COMPANY_LABELS.has(candidate.toLowerCase())) {
    return candidate
  }

  return null
}

function inferSeniority(text: string): string {
  if (/\b(intern|internship)\b/i.test(text)) return 'intern'
  if (/\b(new grad|entry level|junior)\b/i.test(text)) return 'junior'
  if (/\b(staff|principal)\b/i.test(text)) return 'staff_plus'
  if (/\b(senior|sr\.)\b/i.test(text)) return 'senior'
  if (/\b\d+\+?\s+years\b/i.test(text)) return 'mid'
  return 'unspecified'
}

function extractRequirements(lines: string[]): string[] {
  return lines
    .filter((line) =>
      /required|requirement|experience|years|proficient|familiar|degree|build|design/i.test(line)
    )
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .slice(0, 8)
}

function inferHiddenPriorities(text: string, role: RoleArchetypeKey): string[] {
  const priorities = new Set<string>()

  if (/customer|product|design|user/i.test(text) || role === 'full_stack') priorities.add('product ownership')
  if (/reliab|observability|incident|scale|distributed/i.test(text)) priorities.add('production reliability')
  if (/startup|ambiguous|0 to 1|fast/i.test(text)) priorities.add('startup execution')
  if (/llm|agent|rag|retrieval|eval/i.test(text)) priorities.add('practical AI integration')
  if (/trading|market|latency|c\+\+/i.test(text)) priorities.add('performance under constraints')
  if (/client|stakeholder|cross-functional/i.test(text)) priorities.add('stakeholder communication')

  return Array.from(priorities)
}

function buildStrategy(role: RoleArchetypeKey, priorities: string[]) {
  const focusByRole: Record<RoleArchetypeKey, string[]> = {
    backend: ['backend systems reliability', 'distributed service ownership', 'API and data flow hardening'],
    full_stack: ['full-stack product delivery', 'customer-facing execution', 'frontend/backend integration'],
    frontend: ['frontend product quality', 'accessible UI implementation', 'web performance'],
    ai_ml: ['applied ML/data evidence', 'retrieval and evaluation experience', 'model-backed product judgment'],
    ai_platform: ['LLM platform primitives', 'retrieval/evaluation infrastructure', 'reliable AI workflows'],
    quant_swe: ['C++ systems depth', 'performance-sensitive engineering', 'matching/order book projects'],
    sre_infra: ['production reliability', 'observability and incident readiness', 'infrastructure automation'],
    consulting: ['client-facing delivery', 'structured analysis', 'stakeholder communication'],
  }

  return {
    focus: [...focusByRole[role], ...priorities].slice(0, 5),
    suppress: [
      'irrelevant coursework unless directly tied to the role',
      'unsupported metrics or technologies',
      'consulting framing for deep SWE roles unless business context matters',
    ],
    proof_points: [
      'Select claims with direct evidence links.',
      'Prefer shipped systems, measurable outcomes, and concrete technical constraints.',
      'Keep overclaim rules visible during artifact generation.',
    ],
  }
}

function scoreFit(role: RoleArchetypeKey, techStack: string[], requirements: string[]): number {
  const baseByRole: Record<RoleArchetypeKey, number> = {
    backend: 0.72,
    full_stack: 0.76,
    frontend: 0.62,
    ai_ml: 0.7,
    ai_platform: 0.74,
    quant_swe: 0.68,
    sre_infra: 0.66,
    consulting: 0.6,
  }

  const techBonus = Math.min(0.12, techStack.length * 0.015)
  const requirementBonus = Math.min(0.08, requirements.length * 0.01)
  return Number(Math.min(0.95, baseByRole[role] + techBonus + requirementBonus).toFixed(2))
}

export function analyzePastedJob(input: PastedJobInput): JobAnalysisResult {
  const lines = extractFirstNonEmptyLines(input.jobText)
  const title = inferTitle(lines, input.jobTitle)
  const company = inferCompany(lines, title, input.companyName, input.applyUrl)
  const role = classifyRoleArchetype(`${title ?? ''}\n${input.jobText}`)
  const techStack = extractTechStack(input.jobText)
  const requirements = extractRequirements(lines)
  const hiddenPriorities = inferHiddenPriorities(input.jobText, role)

  return {
    apply_url: input.applyUrl,
    company_name: company,
    normalized_company: company ? normalizeCompanyName(company) : null,
    title,
    role_archetype_key: role,
    seniority: inferSeniority(input.jobText),
    tech_stack: techStack,
    requirements,
    hidden_priorities: hiddenPriorities,
    strategy: buildStrategy(role, hiddenPriorities),
    fit_score: scoreFit(role, techStack, requirements),
  }
}
