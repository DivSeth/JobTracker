// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { detectJobCountry } from './country-detector'

function docFromHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

describe('detectJobCountry', () => {
  it('reads from country combobox default value when present', () => {
    const doc = docFromHtml(`
      <div role="combobox" aria-label="Country" data-value="United Kingdom"></div>
    `)
    expect(detectJobCountry(doc)).toBe('GB')
  })

  it('parses location text near the job title', () => {
    const doc = docFromHtml(`
      <h1 class="app-title">Software Engineer</h1>
      <div class="location">San Francisco, United States</div>
    `)
    expect(detectJobCountry(doc)).toBe('US')
  })

  it('reads JSON-LD JobPosting addressCountry', () => {
    const doc = docFromHtml(`
      <script type="application/ld+json">
        ${JSON.stringify({
          '@type': 'JobPosting',
          jobLocation: { address: { addressCountry: 'IN' } },
        })}
      </script>
    `)
    expect(detectJobCountry(doc)).toBe('IN')
  })

  it('returns null when nothing matches', () => {
    const doc = docFromHtml('<p>Hello</p>')
    expect(detectJobCountry(doc)).toBeNull()
  })
})
