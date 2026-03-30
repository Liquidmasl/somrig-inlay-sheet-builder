import { test, expect } from '@playwright/test'

test.describe('ButtonInlaySVG', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders SVG elements for all zone variants', async ({ page }) => {
    // All sections should render SVG elements
    const svgs = page.locator('svg')
    await expect(svgs.first()).toBeVisible()
    const count = await svgs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('1-zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '1 Zone' })
    await expect(section.getByText('dot indicator', { exact: true })).toBeVisible()
    await expect(section.getByText('dash indicator', { exact: true })).toBeVisible()
    await expect(section.getByText('double-dot indicator', { exact: true })).toBeVisible()
    await expect(section.getByText('no indicator', { exact: true })).toBeVisible()
  })

  test('2-zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '2 Zones' })
    await expect(section.getByText('light + fan')).toBeVisible()
    await expect(section.getByText('thermo + volume')).toBeVisible()
  })

  test('3-zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '3 Zones' })
    await expect(section.getByText('light + fan + home light')).toBeVisible()
    await expect(section.getByText('power + thermo + volume')).toBeVisible()
  })

  test('SVG outline path is present in each button inlay', async ({ page }) => {
    // Each ButtonInlaySVG renders a path with the physical outline
    const outlinePaths = page.locator('svg > path')
    const count = await outlinePaths.count()
    // We have 8 button inlays on the page (4 in 1-zone, 2 in 2-zone, 2 in 3-zone)
    expect(count).toBeGreaterThanOrEqual(8)
  })

  test('renders correctly in dark mode', async ({ page }) => {
    const toggleBtn = page.locator('header button').first()
    await toggleBtn.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // SVGs should still be visible in dark mode
    const svgs = page.locator('svg')
    await expect(svgs.first()).toBeVisible()
  })
})
