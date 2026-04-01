import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { chromium, expect, test } from '@playwright/test'

const extensionPath = path.resolve(__dirname, '../../extension/.output/chrome-mv3')

const greenhouseHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Frontend Engineer | Acme</title>
  </head>
  <body>
    <div class="posting-headline">
      <h2>Frontend Engineer</h2>
      <div class="company">Acme</div>
    </div>
    <form id="application_form">
      <div class="field">
        <label for="first_name">First Name</label>
        <input id="first_name" name="first_name" type="text" />
      </div>
      <div class="field">
        <label for="last_name">Last Name</label>
        <input id="last_name" name="last_name" type="text" />
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />
      </div>
      <div class="field">
        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="tel" />
      </div>
    </form>
  </body>
</html>
`

test('Greenhouse extension fills fields and tracks the application in a real browser', async () => {
  const manifestPath = path.join(extensionPath, 'manifest.json')

  try {
    await fs.access(manifestPath)
  } catch {
    throw new Error(`Extension build is missing at ${manifestPath}. Run the extension build before this test.`)
  }

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autoapply-extension-'))
  const duplicateChecks: string[] = []
  const fieldMappingRequests: string[] = []
  const pageErrors: string[] = []
  const trackRequests: Array<Record<string, unknown>> = []
  const statusUpdates: Array<Record<string, unknown>> = []

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })

  try {
    await context.route('https://boards.greenhouse.io/**', async (route) => {
      await route.fulfill({
        body: greenhouseHtml,
        contentType: 'text/html',
        status: 200,
      })
    })

    await context.route('http://localhost:3000/api/extension/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())

      if (url.pathname.endsWith('/field-mappings')) {
        fieldMappingRequests.push(request.url())
        await route.fulfill({
          body: JSON.stringify({
            is_active: true,
            mappings: [],
            platform: 'greenhouse',
            version: 1,
          }),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      if (url.pathname.endsWith('/track-application') && request.method() === 'GET') {
        duplicateChecks.push(request.url())
        await route.fulfill({
          body: JSON.stringify({ exists: false }),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      if (url.pathname.endsWith('/track-application') && request.method() === 'POST') {
        trackRequests.push((request.postDataJSON() as Record<string, unknown>) ?? {})
        await route.fulfill({
          body: JSON.stringify({ id: 'application-1' }),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      if (url.pathname.endsWith('/track-application') && request.method() === 'PATCH') {
        statusUpdates.push((request.postDataJSON() as Record<string, unknown>) ?? {})
        await route.fulfill({
          body: JSON.stringify({ success: true }),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      await route.fulfill({
        body: JSON.stringify({ error: 'Unhandled mock route' }),
        contentType: 'application/json',
        status: 500,
      })
    })

    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))

    await serviceWorker.evaluate(async () => {
      await chrome.storage.local.set({
        activeProfileId: 'profile-1',
        profiles: [
          {
            id: 'profile-1',
            name: 'Primary Profile',
          },
        ],
        userIdentity: {
          email: 'jane@example.com',
          fullName: 'Jane Doe',
          full_name: 'Jane Doe',
          location: 'New York, NY',
          phone: '5551234567',
          portfolioUrl: null,
          portfolio_url: null,
          userId: 'user-1',
        },
      })
    })

    const page = await context.newPage()
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })
    await page.goto('https://boards.greenhouse.io/acme/jobs/123/apply')
    await page.bringToFront()

    await expect
      .poll(async () => {
        return await serviceWorker.evaluate(async () => {
          const stored = await chrome.storage.local.get(['atsDetected'])
          return stored.atsDetected?.platform ?? null
        })
      })
      .toBe('greenhouse')

    let previewVisible = false
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await serviceWorker.evaluate(async () => {
        const tabs = await chrome.tabs.query({})
        const tab = tabs.find((candidate) =>
          candidate.url?.startsWith('https://boards.greenhouse.io/acme/jobs/123/apply')
        )
        if (!tab?.id) {
          throw new Error('No Greenhouse tab available for FILL_STARTED')
        }

        await chrome.tabs.sendMessage(tab.id, {
          payload: {
            platform: 'greenhouse',
            profileId: 'profile-1',
          },
          type: 'FILL_STARTED',
        })
      })

      previewVisible = await page.evaluate(() => {
        const host = document.querySelector('autoapply-greenhouse-preview')
        return host?.shadowRoot?.textContent?.includes('Review Field Mappings') ?? false
      })

      if (previewVisible) break
      await page.waitForTimeout(500)
    }

    expect(previewVisible).toBe(true)
    expect(pageErrors).toEqual([])
    expect(fieldMappingRequests.length).toBeGreaterThan(0)
    expect(duplicateChecks.length).toBeGreaterThan(0)

    await expect(page.getByText('Review Field Mappings')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Confirm Fill' }).click()

    await expect(page.locator('#first_name')).toHaveValue('Jane')
    await expect(page.locator('#last_name')).toHaveValue('Doe')
    await expect(page.locator('#email')).toHaveValue('jane@example.com')
    await expect(page.locator('#phone')).toHaveValue('(555) 123-4567')
    await expect(page.getByText('Application tracked!')).toBeVisible()

    await expect.poll(() => trackRequests.length).toBe(1)
    expect(trackRequests[0]).toMatchObject({
      applyUrl: 'https://boards.greenhouse.io/acme/jobs/123/apply',
      companyName: 'Acme',
      jobTitle: 'Frontend Engineer',
      profileId: 'profile-1',
      source: 'extension_autofill',
    })

    await page.evaluate(() => {
      history.pushState({}, '', '/acme/jobs/123/apply/confirmation')
      document.body.append('Application submitted successfully')
    })

    await expect.poll(() => statusUpdates.length).toBe(1)
    expect(statusUpdates[0]).toMatchObject({
      id: 'application-1',
      status: 'applied',
    })
  } finally {
    await context.close()
    await fs.rm(userDataDir, { force: true, recursive: true })
  }
})
