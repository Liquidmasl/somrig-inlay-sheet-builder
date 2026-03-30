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
  test('full page — light mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'full-page-light.png'),
      fullPage: true,
    })
  })

  test('full page — dark mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('header button').first().click()
    await page.waitForTimeout(150) // allow transition
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'full-page-dark.png'),
      fullPage: true,
    })
  })

  test('1+1 zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '1 Zone (top) + 1 Zone (bottom)' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-1-1-zones.png'),
    })
  })

  test('2+2 zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '2 Zones (top) + 2 Zones (bottom)' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-2-2-zones.png'),
    })
  })

  test('3+3 zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '3 Zones (top) + 3 Zones (bottom)' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-3-3-zones.png'),
    })
  })

  test('mixed zone sections', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: 'Mixed: 3 Zones (top) + 1 Zone (bottom)' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-mixed-3-1-zones.png'),
    })
  })
})
