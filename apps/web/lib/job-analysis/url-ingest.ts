const MIN_EXTRACTED_TEXT_LENGTH = 80

type FetchJobTextOptions = {
  renderPageText?: (applyUrl: string) => Promise<string>
}

export class JobTextFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JobTextFetchError'
  }
}

export function extractReadableTextFromHtml(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(h1|h2|h3|p|li|section|article|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function hasEnoughText(text: string): boolean {
  return text.trim().length >= MIN_EXTRACTED_TEXT_LENGTH
}

async function getRenderedFallbackText(
  applyUrl: string,
  renderPageText?: (applyUrl: string) => Promise<string>
): Promise<string | null> {
  if (!renderPageText) return null

  const renderedText = (await renderPageText(applyUrl)).trim()
  return hasEnoughText(renderedText) ? renderedText : null
}

export async function renderJobPageTextWithPlaywright(applyUrl: string): Promise<string> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    await page.goto(applyUrl, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => undefined)
    return await page.locator('body').innerText({ timeout: 5000 })
  } finally {
    await browser.close()
  }
}

export async function fetchJobTextFromUrl(
  applyUrl: string,
  options: FetchJobTextOptions = {}
): Promise<string> {
  const response = await fetch(applyUrl, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      'user-agent': 'AutoApply/0.1 job-analysis-fetcher',
    },
  })

  if (!response.ok) {
    throw new JobTextFetchError(`Could not fetch job page (${response.status}). Paste the job description instead.`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()
  const extractedText = contentType.includes('html') ? extractReadableTextFromHtml(body) : body.trim()

  if (!hasEnoughText(extractedText)) {
    const renderedText = await getRenderedFallbackText(applyUrl, options.renderPageText)
    if (renderedText) return renderedText

    throw new JobTextFetchError('Could not extract enough job text from the URL. Paste the job description instead.')
  }

  return extractedText
}
