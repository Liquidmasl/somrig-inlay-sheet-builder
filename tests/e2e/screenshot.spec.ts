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

  test('1-zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '1 Zone' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-1-zone.png'),
    })
  })

  test('2-zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '2 Zones' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-2-zones.png'),
    })
  })

  test('3-zone section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const section = page.locator('section').filter({ hasText: '3 Zones' })
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'section-3-zones.png'),
    })
  })
})
