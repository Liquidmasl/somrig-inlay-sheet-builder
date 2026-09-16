/**
 * What's New popup — reopening it from the header, and the photo carousel.
 *
 * The fixture seeds `whats-new-seen`, so every test here starts from the state a
 * returning visitor is in: popup already dismissed, reachable only via the header.
 */

import { expect, test } from './fixtures'

const DIALOG = '[aria-labelledby="whats-new-title"]'
const AUTOPLAY_MS = 4000

test.describe("What's New", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('does not auto-open for a visitor who has seen this version', async ({
    page,
  }) => {
    await expect(page.locator('main svg').first()).toBeVisible()
    await expect(page.locator(DIALOG)).toHaveCount(0)
  })

  test('header button reopens it', async ({ page }) => {
    await page.locator('header button[aria-label="What\'s new"]').click()
    await expect(page.locator(DIALOG)).toBeVisible()

    await page.locator(`${DIALOG} button[aria-label="Close"]`).click()
    await expect(page.locator(DIALOG)).toHaveCount(0)

    // Still reachable after dismissing — that is the point of the button.
    await page.locator('header button[aria-label="What\'s new"]').click()
    await expect(page.locator(DIALOG)).toBeVisible()
  })

  test('carousel auto-advances, then yields to the visitor', async ({
    page,
  }) => {
    await page.locator('header button[aria-label="What\'s new"]').click()
    const dialog = page.locator(DIALOG)
    const photo = dialog.locator('img[alt*="cover"]').first()

    const first = await photo.getAttribute('src')
    await expect
      .poll(() => photo.getAttribute('src'), { timeout: AUTOPLAY_MS * 2 })
      .not.toBe(first)

    // The interval bar is the visible sign that autoplay is still running.
    const progress = dialog.locator('.progress-fill')
    await expect(progress).toBeVisible()

    // Any interaction hands control over; nothing moves on its own afterwards.
    const before = await photo.getAttribute('src')
    await dialog.locator('button[aria-label="Next photo"]').click()
    // The fade runs out-in, so let the new slide settle before pinning it down.
    await expect.poll(() => photo.getAttribute('src')).not.toBe(before)
    const held = await photo.getAttribute('src')

    await page.mouse.move(0, 0) // leave the carousel so hover-pause isn't what stops it
    await expect(progress).toHaveCount(0)
    await page.waitForTimeout(AUTOPLAY_MS + 1000)
    expect(await photo.getAttribute('src')).toBe(held)
  })

  test('community photos carry their credit', async ({ page }) => {
    await page.locator('header button[aria-label="What\'s new"]').click()
    const dialog = page.locator(DIALOG)
    const dots = dialog.locator('button[aria-label^="Show photo"]')
    const caption = dialog.locator('p', { hasText: 'via MakerWorld' })

    const count = await dots.count()
    expect(count).toBeGreaterThan(1)

    // Walk every slide by its dot — dots are stable targets, unlike clicking
    // through arrows while a fade is running.
    const credits: string[] = []
    for (let i = 0; i < count; i++) {
      await dots.nth(i).click()
      await page.waitForTimeout(400) // fade is 250ms, out-in
      if (await caption.count())
        credits.push((await caption.innerText()).trim())
    }

    expect(credits).toEqual([
      '— ghreak, via MakerWorld',
      '— OutName, via MakerWorld',
    ])
  })
})
