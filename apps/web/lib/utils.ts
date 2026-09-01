import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip HTML tags and markdown bold from a string */
export function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
}

/** Format/sanitize location string */
export function sanitizeLocation(raw: string): string {
  const stripped = stripHtml(raw)
  const commaCount = (stripped.match(/,/g) || []).length
  if (commaCount >= 3 || stripped.toLowerCase().includes('location')) {
    return 'Multiple Locations'
  }
  return stripped.length > 60 ? stripped.slice(0, 60) + '…' : stripped
}

const JOB_BOARD_DOMAINS = new Set([
  'simplify.jobs', 'lever.co', 'greenhouse.io', 'workday.com',
  'myworkdayjobs.com', 'linkedin.com', 'indeed.com', 'glassdoor.com',
  'jobs.lever.co', 'boards.greenhouse.io', 'apply.workable.com',
  'smartrecruiters.com', 'icims.com', 'taleo.net', 'brassring.com',
  'wd1.myworkdayjobs.com', 'wd3.myworkdayjobs.com', 'wd5.myworkdayjobs.com',
])

/** Extract company domain from apply URL, filtering out job board domains */
export function extractCompanyDomain(applyUrl: string | null, company: string): string | null {
  if (company.includes('↳')) return null
  if (applyUrl) {
    try {
      const hostname = new URL(applyUrl).hostname.replace('www.', '')
      if (!JOB_BOARD_DOMAINS.has(hostname)) return hostname
    } catch { /* invalid URL */ }
  }
  // Fallback: guess from company name
  const guess = company.toLowerCase().replace(/[^a-z0-9]/g, '')
  return guess ? guess + '.com' : null
}
