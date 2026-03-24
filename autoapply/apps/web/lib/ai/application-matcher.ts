import type { EmailEntities, ApplicationStatus } from '@/lib/types'

interface MatcherInput {
  entities: EmailEntities
  applications: Array<{ id: string; company: string; title: string; status: string }>
}

interface MatcherResult {
  matched_application_id: string | null
  is_new: boolean
  suggested_status: ApplicationStatus
}

const CATEGORY_TO_STATUS: Record<string, ApplicationStatus> = {
  oa: 'oa',
  interview_invite: 'interviewing',
  rejection: 'rejected',
  offer: 'offer',
  application_confirm: 'applied',
}

/** Match extracted entities to existing applications using fuzzy company+title matching */
export function matchApplication(input: MatcherInput, emailCategory: string): MatcherResult {
  const suggested = CATEGORY_TO_STATUS[emailCategory] ?? 'applied'

  const companyNorm = input.entities.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')

  let bestMatch: { id: string; score: number } | null = null

  for (const app of input.applications) {
    const appCompany = app.company.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (appCompany === companyNorm || appCompany.includes(companyNorm) || companyNorm.includes(appCompany)) {
      const titleSimilarity = titleOverlap(input.entities.role_title, app.title)
      const score = titleSimilarity

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: app.id, score }
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.3) {
    return { matched_application_id: bestMatch.id, is_new: false, suggested_status: suggested }
  }

  return { matched_application_id: null, is_new: true, suggested_status: suggested }
}

/** Simple word overlap ratio between two titles */
function titleOverlap(a: string, b: string): number {
  const arrA = a.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const arrB = b.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const setB = new Set(arrB)
  if (arrA.length === 0 || arrB.length === 0) return 0.5
  let overlap = 0
  arrA.forEach(w => { if (setB.has(w)) overlap++ })
  return overlap / Math.max(arrA.length, arrB.length)
}
