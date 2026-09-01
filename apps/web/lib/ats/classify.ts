const SWE_KEYWORDS = [
  'software', 'engineer', 'developer', 'swe',
  'frontend', 'backend', 'fullstack', 'full-stack', 'full stack',
  'devops', 'sre', 'infrastructure', 'platform',
  'data engineer', 'ml engineer', 'machine learning',
  'mobile', 'ios', 'android',
  'cloud', 'systems', 'embedded',
  'security engineer', 'qa', 'sdet', 'test engineer',
]

const INTERNSHIP_KEYWORDS = ['intern', 'co-op', 'coop', 'internship']

const NEW_GRAD_KEYWORDS = [
  'new grad', 'new-grad', 'entry level', 'entry-level',
  'junior', 'associate', 'university', 'early career',
  'recent graduate', 'early-career',
]

export function isSWERole(title: string): boolean {
  const lower = title.toLowerCase()
  return SWE_KEYWORDS.some(kw => lower.includes(kw))
}

export function classifyJobType(title: string): 'internship' | 'new_grad' | 'fulltime' {
  const lower = title.toLowerCase()
  if (INTERNSHIP_KEYWORDS.some(kw => lower.includes(kw))) return 'internship'
  if (NEW_GRAD_KEYWORDS.some(kw => lower.includes(kw))) return 'new_grad'
  return 'fulltime'
}

export function normalizeKey(company: string, title: string, location: string | null): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const loc = location ? norm(location) : 'unknown'
  return `${norm(company)}|${norm(title)}|${loc}`
}
