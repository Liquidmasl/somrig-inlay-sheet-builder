import { expect, test } from '@playwright/test'

test.describe('Button Editor Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Click the first button in the canvas to select it
    await page.locator('main button[aria-label]').first().click()
  })

  test('clicking a button opens the editor panel', async ({ page }) => {
    // Editor panel should show zone controls after selecting a button
    await expect(page.getByText('Top Half')).toBeVisible()
    await expect(page.getByText('Bottom Half')).toBeVisible()
  })

  test('zone count segmented controls are visible', async ({ page }) => {
    // Look for the segmented control buttons
    await expect(page.locator('aside').getByText('Zones').first()).toBeVisible()
  })

  test('changing top zone count updates the canvas button', async ({
    page,
  }) => {
    const selectedBtn = page.locator('main button[aria-label]').first()
    const svgBefore = await selectedBtn.locator('svg').first().innerHTML()

    // The "Top Half" section contains the first set of zone count buttons
    const topSection = page.locator('aside').locator('section').first()

    // Click "3" zones for top half
    await topSection.locator('button').filter({ hasText: '3' }).click()
    await page.waitForTimeout(100)

    // Canvas SVG should have changed (new vertical dividers added for 3 zones)
    const svgAfter = await selectedBtn.locator('svg').first().innerHTML()
    expect(svgAfter).not.toBe(svgBefore)
  })

  test('changing bottom zone count updates the canvas button', async ({
    page,
  }) => {
    const selectedBtn = page.locator('main button[aria-label]').first()
    const svgBefore = await selectedBtn.locator('svg').first().innerHTML()

    // The "Bottom Half" section is the second section
    const botSection = page.locator('aside').locator('section').nth(1)

    // Click "3" zones for bottom half
    await botSection.locator('button').filter({ hasText: '3' }).click()
    await page.waitForTimeout(100)

    const svgAfter = await selectedBtn.locator('svg').first().innerHTML()
    expect(svgAfter).not.toBe(svgBefore)
  })

  test('icon size slider is present for each zone', async ({ page }) => {
    const aside = page.locator('aside')
    await expect(aside.locator('input[type="range"]').first()).toBeVisible()
  })

  test('icon color picker is present for each zone', async ({ page }) => {
    const aside = page.locator('aside')
    await expect(aside.locator('input[type="color"]').first()).toBeVisible()
  })

  test('clicking icon picker button opens modal', async ({ page }) => {
    const aside = page.locator('aside')
    // Click "No icon — click to add" button for first zone
    await aside.getByText('No icon — click to add').first().click()
    await expect(page.getByText('Pick Icon')).toBeVisible()
  })

  test('icon picker modal can be closed via × button', async ({ page }) => {
    const aside = page.locator('aside')
    await aside.getByText('No icon — click to add').first().click()
    await expect(page.getByText('Pick Icon')).toBeVisible()

    // Click the × close button in the modal header (first button inside .fixed)
    await page.locator('.fixed button').first().click()
    await expect(page.getByText('Pick Icon')).not.toBeVisible()
  })

  test('icon picker modal can be closed via backdrop click', async ({
    page,
  }) => {
    const aside = page.locator('aside')
    await aside.getByText('No icon — click to add').first().click()
    await expect(page.getByText('Pick Icon')).toBeVisible()

    // Click the backdrop (outside the modal content box)
    await page.locator('.fixed').click({ position: { x: 5, y: 5 } })
    await expect(page.getByText('Pick Icon')).not.toBeVisible()
  })

  test('selecting an icon updates the canvas button', async ({ page }) => {
    const aside = page.locator('aside')
    const selectedBtn = page.locator('main button[aria-label]').first()

    // Capture canvas SVG before picking icon
    const svgBefore = await selectedBtn.locator('svg').first().innerHTML()

    // Open icon picker and select the first icon
    await aside.getByText('No icon — click to add').first().click()
    await expect(page.getByText('Pick Icon')).toBeVisible()

    // Click the first icon in the grid
    const iconGrid = page.locator('.fixed .grid button').first()
    await iconGrid.click()

    // Modal should close
    await expect(page.getByText('Pick Icon')).not.toBeVisible()

    // Canvas SVG should have changed (icon path added)
    const svgAfter = await selectedBtn.locator('svg').first().innerHTML()
    expect(svgAfter).not.toBe(svgBefore)
  })

  test('icon picker has search functionality', async ({ page }) => {
    const aside = page.locator('aside')
    await aside.getByText('No icon — click to add').first().click()
    await expect(page.getByText('Pick Icon')).toBeVisible()

    const searchInput = page.getByPlaceholder('Search icons...')
    await expect(searchInput).toBeVisible()

    // Wait for icons to load (lazy-loaded on first open)
    await expect(page.locator('.fixed .grid button').first()).toBeVisible()

    // Type a search query that matches exactly 1 icon ("abacus" → "Abacus")
    await searchInput.fill('abacus')
    // Grid should be filtered to exactly 1 result (debounce settles within 5s retry window)
    await expect(page.locator('.fixed .grid button')).toHaveCount(1)
  })

  test('adding a new button and selecting it shows editor', async ({
    page,
  }) => {
    // Click the "+" add button in the canvas
    await page.locator('main button[title="Add button"]').click()

    // The new button should be selected and editor visible
    await expect(page.getByText('Top Half')).toBeVisible()
  })

  test('multiple buttons can be selected independently', async ({ page }) => {
    // Add a second button
    await page.locator('main button[title="Add button"]').click()

    // Both buttons should be visible in the canvas
    const canvasButtons = page.locator('main button[aria-label]')
    await expect(canvasButtons).toHaveCount(2)

    // Click first button
    await canvasButtons.first().click()
    const firstSelected = await canvasButtons.first().getAttribute('class')
    expect(firstSelected).toContain('ring-blue-500')

    // Click second button
    await canvasButtons.last().click()
    const secondSelected = await canvasButtons.last().getAttribute('class')
    expect(secondSelected).toContain('ring-blue-500')

    // First should no longer be selected
    const firstAfter = await canvasButtons.first().getAttribute('class')
    expect(firstAfter).not.toContain('ring-blue-500')
  })

  test('zone type selector is visible for each zone', async ({ page }) => {
    const aside = page.locator('aside')
    // Each zone card should have type toggle buttons (● ●● ▬)
    await expect(
      aside.locator('button[aria-label*="Set zone"]').first(),
    ).toBeVisible()
  })

  test('zone type selector changes the zone type indicator in canvas', async ({
    page,
  }) => {
    const selectedBtn = page.locator('main button[aria-label]').first()
    const svgBefore = await selectedBtn.locator('svg').first().innerHTML()

    // Click the "●●" (double) type button for zone 1 in top half
    const aside = page.locator('aside')
    const topSection = aside.locator('section').first()
    await topSection
      .locator('button[aria-label="Set zone 1 type to Double"]')
      .click()
    await page.waitForTimeout(100)

    // Canvas SVG should have changed (indicator changed from dot to double-dot)
    const svgAfter = await selectedBtn.locator('svg').first().innerHTML()
    expect(svgAfter).not.toBe(svgBefore)
  })

  test('zone type can be set to any type independently', async ({ page }) => {
    const aside = page.locator('aside')

    // Set top to 2 zones
    const topSection = aside.locator('section').first()
    await topSection.locator('button').filter({ hasText: '2' }).click()
    await page.waitForTimeout(100)

    // Now change zone 1 type to Hold (▬)
    await topSection
      .locator('button[aria-label="Set zone 1 type to Hold"]')
      .click()
    await page.waitForTimeout(100)

    // The type button for Hold should be active (blue)
    const holdBtn = topSection.locator(
      'button[aria-label="Set zone 1 type to Hold"]',
    )
    await expect(holdBtn).toHaveClass(/bg-blue-600/)
  })
})
