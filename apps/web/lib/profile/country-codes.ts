export const COUNTRY_CODES: Array<{ code: string; name: string }> = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PL', name: 'Poland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'US', name: 'United States' },
]

export const COUNTRY_CODE_SET = new Set(COUNTRY_CODES.map((c) => c.code))

export function countryName(code: string): string | null {
  return COUNTRY_CODES.find((c) => c.code === code)?.name ?? null
}
