import { test, expect } from '@playwright/test'

test.describe('ButtonInlaySVG', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders SVG elements for all zone variants', async ({ page }) => {
    const svgs = page.locator('svg')
    await expect(svgs.first()).toBeVisible()
    const count = await svgs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('1+1 zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '1 Zone (top) + 1 Zone (bottom)' })
    await expect(section.getByText('light (dot) / fan (dash)', { exact: true })).toBeVisible()
    await expect(section.getByText('volume (double-dot) / power (dot)', { exact: true })).toBeVisible()
  })

  test('2+2 zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '2 Zones (top) + 2 Zones (bottom)' })
    await expect(section.getByText('light+fan / thermo+volume')).toBeVisible()
    await expect(section.getByText('power+home / music+tv')).toBeVisible()
  })

  test('3+3 zone section renders expected indicator labels', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: '3 Zones (top) + 3 Zones (bottom)' })
    await expect(section.getByText('light+fan+home / power+thermo+volume')).toBeVisible()
  })

  test('mixed 3+1 and 1+3 zone sections render', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: 'Mixed: 3 Zones (top) + 1 Zone (bottom)' })
    await expect(section.getByText('3 top zones / 1 bottom zone')).toBeVisible()
    await expect(section.getByText('1 top zone / 3 bottom zones')).toBeVisible()
  })

  test('mixed 2+3 and 3+2 zone sections render', async ({ page }) => {
    const section = page.locator('section').filter({ hasText: 'Mixed: 2 Zones (top) + 3 Zones (bottom)' })
    await expect(section.getByText('2 top zones / 3 bottom zones')).toBeVisible()
    await expect(section.getByText('3 top zones / 2 bottom zones')).toBeVisible()
  })

  test('SVG outline path is present in each button inlay', async ({ page }) => {
    const outlinePaths = page.locator('svg > path')
    const count = await outlinePaths.count()
    // 2 + 2 + 1 + 2 + 2 = 9 button inlays on the page
    expect(count).toBeGreaterThanOrEqual(9)
  })

  test('renders correctly in dark mode', async ({ page }) => {
    const toggleBtn = page.locator('header button').first()
    await toggleBtn.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    const svgs = page.locator('svg')
    await expect(svgs.first()).toBeVisible()
  })
})
