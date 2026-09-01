import { describe, expect, it, vi } from 'vitest'
import { extractReadableTextFromHtml, fetchJobTextFromUrl } from '@/lib/job-analysis/url-ingest'

describe('extractReadableTextFromHtml', () => {
  it('extracts visible job page text without head metadata or scripts', () => {
    const text = extractReadableTextFromHtml(`
      <html>
        <head>
          <title>Software Engineer, Full Stack - Nooks</title>
          <style>body { display: none; }</style>
        </head>
        <body>
          <script>window.__DATA__ = { noisy: true }</script>
          <h1>Software Engineer, Full Stack</h1>
          <p>Nooks</p>
          <section>Build React, TypeScript, Node, and Postgres product workflows.</section>
        </body>
      </html>
    `)

    expect(text).toContain('Software Engineer, Full Stack')
    expect(text).toContain('Nooks')
    expect(text).toContain('Build React, TypeScript')
    expect(text).not.toContain('Software Engineer, Full Stack - Nooks')
    expect(text).not.toContain('window.__DATA__')
  })
})

describe('fetchJobTextFromUrl', () => {
  it('uses rendered page text when static fetch returns only a client-rendered shell', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '<html><body><div id="root"></div><script src="/assets/app.js"></script></body></html>',
    } as Response)
    const renderPageText = vi.fn().mockResolvedValue(`
      Software Engineer, Backend
      Nue
      Build reliable TypeScript, React, Node, and Postgres workflows for healthcare operations.
    `)

    const text = await fetchJobTextFromUrl('https://jobs.gem.com/nue/example', { renderPageText })

    expect(text).toContain('Software Engineer, Backend')
    expect(text).toContain('Nue')
    expect(renderPageText).toHaveBeenCalledWith('https://jobs.gem.com/nue/example')

    fetchSpy.mockRestore()
  })
})
