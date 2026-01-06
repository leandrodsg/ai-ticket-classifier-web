import { test, expect } from '@playwright/test'

test('setup verification', async ({ page }) => {
  // Navigate to the app
  await page.goto('/')

  // Check if the page loads
  await expect(page).toHaveTitle(/AI Ticket Classifier/)

  // Check if basic elements are present
  const body = page.locator('body')
  await expect(body).toBeVisible()

  // Check if Tailwind is working (basic styling)
  const styledElement = page.locator('[class*="bg-"]')
  await expect(styledElement.first()).toBeVisible()
})