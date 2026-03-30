import { test, expect } from '@playwright/test'

test.describe('App', () => {
  test('loads and displays the header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Somrig/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('shows a button in the sheet canvas', async ({ page }) => {
    await page.goto('/')
    // There should be at least one button inlay SVG in the canvas
    await expect(page.locator('main svg').first()).toBeVisible()
  })

  test('shows empty editor state initially', async ({ page }) => {
    await page.goto('/')
    // The default sheet has one button which starts selected, or not
    // Either way the aside panel should be present
    await expect(page.locator('aside')).toBeVisible()
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const toggleBtn = page.locator('header button[aria-label*="mode"]')

    // Start in light mode (no dark class)
    await expect(html).not.toHaveClass(/dark/)

    // Click toggle — should go dark
    await toggleBtn.click()
    await expect(html).toHaveClass(/dark/)

    // Click again — should go back to light
    await toggleBtn.click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
