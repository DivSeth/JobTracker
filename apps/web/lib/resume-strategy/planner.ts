import type { RoleArchetypeKey } from '@/lib/job-analysis/analyzer'

type ClaimLike = {
  id: string
  claim: string
  category?: string | null
  evidence_strength?: string | null
  confidence?: number | null
  resume_usable?: boolean | null
  best_role_archetypes?: string[] | null
  do_not_overclaim?: string[] | null
  status?: string | null
}

type JobAnalysisLike = {
  id: string
  title?: string | null
  company_name?: string | null
  role_archetype_key?: RoleArchetypeKey | string | null
  tech_stack?: string[] | null
  hidden_priorities?: string[] | null
  strategy?: {
    role_archetype_key?: RoleArchetypeKey | string
    focus?: string[]
  } | null
  fit_score?: number | null
}

type AlertLike = {
  id: string
  message: string
  status?: string | null
}

export interface StrategyClaim {
  id: string
  claim: string
  category: string | null
  evidenceStrength: string | null
  confidence: number | null
  status: string | null
  matchReasons: string[]
  doNotOverclaim: string[]
}

export interface ResumeStrategyPreviewData {
  jobAnalysisId: string
  title: string | null
  companyName: string | null
  roleArchetypeKey: string
  headline: string
  fitScore: number | null
  focus: string[]
  selectedClaims: StrategyClaim[]
  overclaimRules: string[]
  networkingAlerts: Array<{ id: string; message: string }>
  nextSteps: string[]
}

const ROLE_CATEGORY_MATCHES: Record<string, string[]> = {
  backend: ['backend', 'distributed_systems', 'reliability', 'cloud', 'systems'],
  full_stack: ['full_stack', 'backend', 'frontend', 'product'],
  frontend: ['frontend', 'product', 'design_system', 'web_performance'],
  ai_ml: ['ai_ml', 'data', 'retrieval', 'ml'],
  ai_platform: ['ai_platform', 'ai_ml', 'retrieval', 'data', 'backend', 'cloud'],
  quant_swe: ['quant', 'systems', 'c++', 'trading_systems'],
  sre_infra: ['reliability', 'cloud', 'backend', 'systems', 'infrastructure'],
  consulting: ['consulting', 'leadership', 'product', 'data', 'stakeholder'],
}

const DEFAULT_FOCUS: Record<string, string[]> = {
  backend: ['backend systems reliability', 'distributed service ownership'],
  full_stack: ['full-stack product delivery', 'frontend/backend integration'],
  frontend: ['frontend product quality', 'accessible UI implementation'],
  ai_ml: ['applied ML/data evidence', 'retrieval and evaluation experience'],
  ai_platform: ['LLM platform primitives', 'retrieval/evaluation infrastructure'],
  quant_swe: ['C++ systems depth', 'performance-sensitive engineering'],
  sre_infra: ['production reliability', 'observability and incident readiness'],
  consulting: ['client-facing delivery', 'structured analysis'],
}

function normalizeList(values?: string[] | null): string[] {
  return values?.map((value) => value.toLowerCase().trim()).filter(Boolean) ?? []
}

function roleKeyFor(jobAnalysis: JobAnalysisLike): string {
  return jobAnalysis.role_archetype_key ?? jobAnalysis.strategy?.role_archetype_key ?? 'backend'
}

function evidenceScore(strength?: string | null): number {
  if (strength === 'high') return 3
  if (strength === 'medium') return 2
  if (strength === 'low') return 1
  return 0
}

function scoreClaim(jobAnalysis: JobAnalysisLike, claim: ClaimLike) {
  const roleKey = roleKeyFor(jobAnalysis)
  const matchingCategories = ROLE_CATEGORY_MATCHES[roleKey] ?? [roleKey]
  const category = claim.category?.toLowerCase() ?? ''
  const roleArchetypes = normalizeList(claim.best_role_archetypes)
  const techStack = normalizeList(jobAnalysis.tech_stack)
  const hiddenPriorities = normalizeList(jobAnalysis.hidden_priorities)
  const claimText = claim.claim.toLowerCase()
  const matchReasons: string[] = []
  let score = 0

  if (category === roleKey) {
    score += 40
    matchReasons.push(`category matches ${roleKey}`)
  } else if (matchingCategories.includes(category)) {
    score += 25
    matchReasons.push(`category supports ${roleKey}`)
  }

  if (roleArchetypes.includes(roleKey)) {
    score += 30
    matchReasons.push(`tagged for ${roleKey}`)
  }

  for (const tech of techStack) {
    if (claimText.includes(tech)) {
      score += 6
      matchReasons.push(`mentions ${tech}`)
    }
  }

  for (const priority of hiddenPriorities) {
    if (claimText.includes(priority)) {
      score += 4
      matchReasons.push(`supports ${priority}`)
    }
  }

  score += evidenceScore(claim.evidence_strength) * 6
  score += Math.round((claim.confidence ?? 0) * 10)

  return { score, matchReasons }
}

export function rankClaimsForJobAnalysis(
  jobAnalysis: JobAnalysisLike,
  claims: ClaimLike[]
): StrategyClaim[] {
  return claims
    .filter((claim) => claim.resume_usable !== false)
    .filter((claim) => !['rejected', 'archived'].includes(claim.status ?? ''))
    .map((claim) => {
      const { score, matchReasons } = scoreClaim(jobAnalysis, claim)
      return {
        id: claim.id,
        claim: claim.claim,
        category: claim.category ?? null,
        evidenceStrength: claim.evidence_strength ?? null,
        confidence: claim.confidence ?? null,
        status: claim.status ?? null,
        matchReasons,
        doNotOverclaim: claim.do_not_overclaim ?? [],
        score,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ score, ...claim }) => {
      void score
      return claim
    })
}

function headlineFor(roleKey: string, companyName?: string | null) {
  const roleHeadline: Record<string, string> = {
    backend: 'Backend systems strategy',
    full_stack: 'Full-stack product delivery',
    frontend: 'Frontend product quality',
    ai_ml: 'Applied AI/ML strategy',
    ai_platform: 'AI platform strategy',
    quant_swe: 'Quant/systems strategy',
    sre_infra: 'Reliability and infrastructure strategy',
    consulting: 'Consulting delivery strategy',
  }

  return `${roleHeadline[roleKey] ?? 'Resume strategy'}${companyName ? ` for ${companyName}` : ''}`
}

export function buildResumeStrategyPreview(
  jobAnalysis: JobAnalysisLike,
  claims: ClaimLike[],
  alerts: AlertLike[] = []
): ResumeStrategyPreviewData {
  const roleKey = roleKeyFor(jobAnalysis)
  const selectedClaims = rankClaimsForJobAnalysis(jobAnalysis, claims)
  const overclaimRules = Array.from(
    new Set(selectedClaims.flatMap((claim) => claim.doNotOverclaim).filter(Boolean))
  )
  const focus = jobAnalysis.strategy?.focus?.length
    ? jobAnalysis.strategy.focus
    : DEFAULT_FOCUS[roleKey] ?? ['evidence-backed role fit']

  return {
    jobAnalysisId: jobAnalysis.id,
    title: jobAnalysis.title ?? null,
    companyName: jobAnalysis.company_name ?? null,
    roleArchetypeKey: roleKey,
    headline: headlineFor(roleKey, jobAnalysis.company_name),
    fitScore: jobAnalysis.fit_score ?? null,
    focus,
    selectedClaims,
    overclaimRules,
    networkingAlerts: alerts
      .filter((alert) => alert.status === undefined || alert.status === null || alert.status === 'open')
      .map((alert) => ({ id: alert.id, message: alert.message })),
    nextSteps: [
      'Review evidence links before generating artifacts.',
      'Use selected claims as the first resume bullet candidate pool.',
      'Keep overclaim rules visible during resume and answer drafting.',
    ],
  }
}
