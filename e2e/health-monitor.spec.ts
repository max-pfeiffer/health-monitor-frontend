import { test, expect } from '@playwright/test'

test('app title is correct', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Health Monitor/)
})
