const NAME_TO_CODE: Record<string, string> = {
  'united states': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  'great britain': 'GB',
  canada: 'CA',
  india: 'IN',
  germany: 'DE',
  france: 'FR',
  australia: 'AU',
  singapore: 'SG',
  ireland: 'IE',
  netherlands: 'NL',
  japan: 'JP',
  brazil: 'BR',
  mexico: 'MX',
  spain: 'ES',
  italy: 'IT',
  'new zealand': 'NZ',
  poland: 'PL',
}

function toCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  return NAME_TO_CODE[trimmed.toLowerCase()] ?? null
}

function fromCombobox(doc: Document): string | null {
  const nodes = doc.querySelectorAll<HTMLElement>('[role="combobox"]')
  for (const n of Array.from(nodes)) {
    const label = (n.getAttribute('aria-label') ?? '').toLowerCase()
    if (!/country/.test(label)) continue
    const raw = n.getAttribute('data-value') ?? n.textContent ?? null
    const code = toCode(raw)
    if (code) return code
  }
  return null
}

function fromLocationText(doc: Document): string | null {
  const candidates = doc.querySelectorAll<HTMLElement>('.location, [data-location], h1 + div')
  for (const el of Array.from(candidates)) {
    const text = el.textContent ?? ''
    const segments = text.split(/[,·•|]/).map((s) => s.trim())
    for (let i = segments.length - 1; i >= 0; i--) {
      const code = toCode(segments[i])
      if (code) return code
    }
  }
  return null
}

function fromJsonLd(doc: Document): string | null {
  const scripts = doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
  for (const s of Array.from(scripts)) {
    try {
      const data = JSON.parse(s.textContent ?? 'null')
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (!item || item['@type'] !== 'JobPosting') continue
        const loc = item.jobLocation
        const locs = Array.isArray(loc) ? loc : [loc]
        for (const l of locs) {
          const raw = l?.address?.addressCountry
          const code = toCode(typeof raw === 'string' ? raw : raw?.name ?? null)
          if (code) return code
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null
}

export function detectJobCountry(doc: Document): string | null {
  return fromCombobox(doc) ?? fromLocationText(doc) ?? fromJsonLd(doc)
}
