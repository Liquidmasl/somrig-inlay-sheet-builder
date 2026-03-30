/**
 * Screenshot spec — captures reference screenshots of the app for use in PRs.
 *
 * Run with:  npm run screenshot
 * Output:    tests/e2e/screenshots/
 *
 * These are not assertion tests — they exist to produce visual documentation.
 * Screenshots are committed to the repo and referenced in PR bodies.
 */

import { test } from '@playwright/test'
import path from 'path'

const SCREENSHOTS_DIR = path.resolve('tests/e2e/screenshots')

test.describe('Screenshots', () => {
  test('full page — light mode (no selection)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'full-page-light.png'),
      fullPage: true,
    })
  })

  test('full page — dark mode (no selection)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('header button[aria-label*="mode"]').click()
    await page.waitForTimeout(150) // allow transition
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'full-page-dark.png'),
      fullPage: true,
    })
  })

  test('editor panel — button selected light mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('main button[aria-label]').first().click()
    await page.waitForTimeout(100)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'editor-panel-light.png'),
    })
  })

  test('editor panel — button selected dark mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('header button[aria-label*="mode"]').click()
    await page.waitForTimeout(150)
    await page.locator('main button[aria-label]').first().click()
    await page.waitForTimeout(100)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'editor-panel-dark.png'),
    })
  })

  test('editor panel — 3 zones top configured', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('main button[aria-label]').first().click()

    // Set top to 3 zones
    const aside = page.locator('aside')
    await aside.locator('section').first().locator('button').filter({ hasText: '3' }).click()

    await page.waitForTimeout(100)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'editor-3-zones-top.png'),
    })
  })

  test('icon picker modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('main button[aria-label]').first().click()

    const aside = page.locator('aside')
    await aside.getByText('No icon — click to add').first().click()
    await page.waitForTimeout(100)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'icon-picker-modal.png'),
    })
  })
})
