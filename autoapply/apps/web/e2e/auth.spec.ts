import { test, expect } from '@playwright/test'

test.describe('authentication', () => {
  test('unauthenticated visitor is redirected to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page has Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    const button = page.getByRole('button', { name: /google/i })
    await expect(button).toBeVisible()
  })
})
