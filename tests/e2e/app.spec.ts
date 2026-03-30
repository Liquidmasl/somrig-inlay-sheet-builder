import { test, expect } from '@playwright/test'

test.describe('App', () => {
  test('loads and displays the header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Somrig/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('displays all zone sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('1 Zone (top) + 1 Zone (bottom)')).toBeVisible()
    await expect(page.getByText('2 Zones (top) + 2 Zones (bottom)')).toBeVisible()
    await expect(page.getByText('3 Zones (top) + 3 Zones (bottom)')).toBeVisible()
    await expect(page.getByText('Mixed: 3 Zones (top) + 1 Zone (bottom)')).toBeVisible()
  })

  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const toggleBtn = page.locator('header button').first()

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
