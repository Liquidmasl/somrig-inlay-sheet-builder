import { test, expect } from '@playwright/test'

test.describe('App', () => {
  test('loads and displays the header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Somrig/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('displays all three zone sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('1 Zone')).toBeVisible()
    await expect(page.getByText('2 Zones')).toBeVisible()
    await expect(page.getByText('3 Zones')).toBeVisible()
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
