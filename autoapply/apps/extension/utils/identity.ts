export interface StoredBaseIdentity {
  firstName: string | null
  lastName: string | null
  preferredFirstName: string | null
  pronouns: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  dateOfBirth: string | null
  willingToRelocate: boolean
  workArrangementPreference: 'remote' | 'hybrid' | 'onsite' | 'any' | null
  earliestStartDate: string | null
  referralSource: string | null
}

export interface StoredRegionalIdentity {
  id: string
  label: string
  countryCodes: string[]
  isDefault: boolean
  email: string
  phoneE164: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string
  authorizedToWork: boolean | null
  needsSponsorshipNow: boolean | null
  needsSponsorshipFuture: boolean | null
  workAuthStatus: string | null
  workAuthDetails: string | null
  desiredSalaryMin: number | null
  desiredSalaryMax: number | null
  salaryCurrency: string | null
  salaryCadence: 'annual' | 'monthly' | 'hourly' | 'lpa' | null
  currentCompensation: number | null
  noticePeriodWeeks: number | null
  eeoGender: string | null
  eeoRace: string | null
  eeoVeteranStatus: string | null
  eeoDisabilityStatus: string | null
  defaultProfileId: string | null
}

export interface MergedIdentity {
  first_name: string | null
  last_name: string | null
  full_name: string | null
  preferred_first_name: string | null
  pronouns: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  date_of_birth: string | null
  willing_to_relocate: boolean
  work_arrangement_preference: string | null
  earliest_start_date: string | null
  referral_source: string | null
  email: string | null
  phone: string | null
  phone_e164: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  region: string | null
  postal_code: string | null
  country: string | null
  authorized_to_work: boolean | null
  needs_sponsorship_now: boolean | null
  needs_sponsorship_future: boolean | null
  work_auth_status: string | null
  work_auth_details: string | null
  desired_salary_min: number | null
  desired_salary_max: number | null
  salary_currency: string | null
  salary_cadence: string | null
  current_compensation: number | null
  notice_period_weeks: number | null
  eeo_gender: string | null
  eeo_race: string | null
  eeo_veteran_status: string | null
  eeo_disability_status: string | null
}

function formatPhone(e164: string | null): string | null {
  if (!e164) return null
  if (e164.startsWith('+1') && e164.length === 12) {
    const d = e164.slice(2)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  return e164
}

export function mergeActiveIdentity(
  base: StoredBaseIdentity,
  regional: StoredRegionalIdentity
): MergedIdentity {
  const fullName =
    [base.firstName, base.lastName].filter(Boolean).join(' ') || null
  return {
    first_name: base.firstName,
    last_name: base.lastName,
    full_name: fullName,
    preferred_first_name: base.preferredFirstName,
    pronouns: base.pronouns,
    linkedin_url: base.linkedinUrl,
    github_url: base.githubUrl,
    portfolio_url: base.portfolioUrl,
    date_of_birth: base.dateOfBirth,
    willing_to_relocate: base.willingToRelocate,
    work_arrangement_preference: base.workArrangementPreference,
    earliest_start_date: base.earliestStartDate,
    referral_source: base.referralSource,
    email: regional.email,
    phone: formatPhone(regional.phoneE164),
    phone_e164: regional.phoneE164,
    address_line_1: regional.addressLine1,
    address_line_2: regional.addressLine2,
    city: regional.city,
    region: regional.region,
    postal_code: regional.postalCode,
    country: regional.country,
    authorized_to_work: regional.authorizedToWork,
    needs_sponsorship_now: regional.needsSponsorshipNow,
    needs_sponsorship_future: regional.needsSponsorshipFuture,
    work_auth_status: regional.workAuthStatus,
    work_auth_details: regional.workAuthDetails,
    desired_salary_min: regional.desiredSalaryMin,
    desired_salary_max: regional.desiredSalaryMax,
    salary_currency: regional.salaryCurrency,
    salary_cadence: regional.salaryCadence,
    current_compensation: regional.currentCompensation,
    notice_period_weeks: regional.noticePeriodWeeks,
    eeo_gender: regional.eeoGender,
    eeo_race: regional.eeoRace,
    eeo_veteran_status: regional.eeoVeteranStatus,
    eeo_disability_status: regional.eeoDisabilityStatus,
  }
}

export function fromApiBase(row: Record<string, unknown> | null): StoredBaseIdentity {
  const r = (row ?? {}) as Record<string, unknown>
  return {
    firstName: (r.first_name as string | null) ?? null,
    lastName: (r.last_name as string | null) ?? null,
    preferredFirstName: (r.preferred_first_name as string | null) ?? null,
    pronouns: (r.pronouns as string | null) ?? null,
    linkedinUrl: (r.linkedin_url as string | null) ?? null,
    githubUrl: (r.github_url as string | null) ?? null,
    portfolioUrl: (r.portfolio_url as string | null) ?? null,
    dateOfBirth: (r.date_of_birth as string | null) ?? null,
    willingToRelocate: Boolean(r.willing_to_relocate),
    workArrangementPreference:
      (r.work_arrangement_preference as StoredBaseIdentity['workArrangementPreference']) ?? null,
    earliestStartDate: (r.earliest_start_date as string | null) ?? null,
    referralSource: (r.referral_source as string | null) ?? null,
  }
}

export function fromApiRegional(row: Record<string, unknown>): StoredRegionalIdentity {
  return {
    id: row.id as string,
    label: row.label as string,
    countryCodes: (row.country_codes as string[]) ?? [],
    isDefault: Boolean(row.is_default),
    email: (row.email as string) ?? '',
    phoneE164: (row.phone_e164 as string | null) ?? null,
    addressLine1: (row.address_line_1 as string | null) ?? null,
    addressLine2: (row.address_line_2 as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    country: (row.country as string) ?? '',
    authorizedToWork: (row.authorized_to_work as boolean | null) ?? null,
    needsSponsorshipNow: (row.needs_sponsorship_now as boolean | null) ?? null,
    needsSponsorshipFuture: (row.needs_sponsorship_future as boolean | null) ?? null,
    workAuthStatus: (row.work_auth_status as string | null) ?? null,
    workAuthDetails: (row.work_auth_details as string | null) ?? null,
    desiredSalaryMin: (row.desired_salary_min as number | null) ?? null,
    desiredSalaryMax: (row.desired_salary_max as number | null) ?? null,
    salaryCurrency: (row.salary_currency as string | null) ?? null,
    salaryCadence:
      (row.salary_cadence as StoredRegionalIdentity['salaryCadence']) ?? null,
    currentCompensation: (row.current_compensation as number | null) ?? null,
    noticePeriodWeeks: (row.notice_period_weeks as number | null) ?? null,
    eeoGender: (row.eeo_gender as string | null) ?? null,
    eeoRace: (row.eeo_race as string | null) ?? null,
    eeoVeteranStatus: (row.eeo_veteran_status as string | null) ?? null,
    eeoDisabilityStatus: (row.eeo_disability_status as string | null) ?? null,
    defaultProfileId: (row.default_profile_id as string | null) ?? null,
  }
}
