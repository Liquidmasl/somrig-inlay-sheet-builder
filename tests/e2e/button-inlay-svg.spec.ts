import { expect, test } from '@playwright/test'

test.describe('ButtonInlaySVG', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders SVG elements in the sheet canvas', async ({ page }) => {
    const svgs = page.locator('main svg')
    await expect(svgs.first()).toBeVisible()
    const count = await svgs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('SVG outline path is present in each button inlay', async ({ page }) => {
    // Each button inlay has at least one path (the outline)
    const outlinePaths = page.locator('main svg > path')
    const count = await outlinePaths.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('renders correctly in dark mode', async ({ page }) => {
    const toggleBtn = page.locator('header button[aria-label*="mode"]')
    await toggleBtn.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    const svgs = page.locator('main svg')
    await expect(svgs.first()).toBeVisible()
  })

  test('selecting a button highlights it and shows editor controls', async ({
    page,
  }) => {
    const btn = page.locator('main button[aria-label]').first()
    await btn.click()
    // Selected button gets the blue ring
    await expect(btn).toHaveClass(/ring-blue-500/)
    // Editor controls appear
    await expect(page.getByText('Top Half')).toBeVisible()
  })

  test('zone count change reflects in canvas SVG (via editor)', async ({
    page,
  }) => {
    await page.locator('main button[aria-label]').first().click()

    const selectedBtn = page.locator('main button[aria-label]').first()
    const svgBefore = await selectedBtn.locator('svg').first().innerHTML()

    // Change top half to 3 zones (Top Half is the first section)
    await page
      .locator('aside')
      .locator('section')
      .first()
      .locator('button')
      .filter({ hasText: '3' })
      .click()
    await page.waitForTimeout(100)

    const svgAfter = await selectedBtn.locator('svg').first().innerHTML()
    expect(svgAfter).not.toBe(svgBefore)
  })

  test('zone count change reflects in canvas SVG', async ({ page }) => {
    await page.locator('main button[aria-label]').first().click()

    const canvasSvgBefore = await page.locator('main svg').first().innerHTML()

    // Change top half to 2 zones
    const aside = page.locator('aside')
    await aside
      .locator('section')
      .first()
      .locator('button')
      .filter({ hasText: '2' })
      .click()
    await page.waitForTimeout(100)

    const canvasSvgAfter = await page.locator('main svg').first().innerHTML()
    expect(canvasSvgAfter).not.toBe(canvasSvgBefore)
  })
})
