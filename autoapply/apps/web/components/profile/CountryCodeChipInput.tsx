'use client'
import { COUNTRY_CODES, countryName } from '@/lib/profile/country-codes'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

export function CountryCodeChipInput({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((code) => (
        <span
          key={code}
          className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm"
        >
          {countryName(code) ?? code}
          <button
            type="button"
            aria-label={`Remove ${countryName(code) ?? code}`}
            onClick={() => onChange(value.filter((c) => c !== code))}
            className="ml-1 rounded-full text-on-surface-muted hover:text-on-surface"
          >
            ×
          </button>
        </span>
      ))}
      <select
        value=""
        role="combobox"
        onChange={(e) => {
          const next = e.target.value
          if (!next) return
          const merged = Array.from(new Set([...value, next]))
          onChange(merged)
        }}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      >
        <option value="">+ Add country</option>
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
