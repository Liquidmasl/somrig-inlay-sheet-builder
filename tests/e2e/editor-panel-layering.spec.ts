/**
 * The floating editor panel is fixed at the bottom of the viewport while the
 * sheet grid scrolls behind it. Each card carries its own absolutely positioned
 * z-10 action row (SVG / 3MF / duplicate / delete), so the panel needs a higher
 * stacking level or those buttons paint on top of it mid-scroll.
 */

import { expect, test } from './fixtures'

/** Seed enough buttons that the grid scrolls past the editor panel. */
async function seedFullSheet(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const zone = () => ({
      type: 'single',
      icon: 'M4 4 H20 V20 H4 Z',
      iconSize: 10,
      iconColor: '#FF0000',
      iconRotation: 0,
    })
    const separator = { thickness: 0.3, color: '#000000', style: 'solid' }
    localStorage.setItem(
      'button-customizer-state-v1',
      JSON.stringify({
        version: 1,
        nextId: 2,
        activeSheetId: 's1',
        activeButtonId: 's1-btn-1',
        savedAt: new Date().toISOString(),
        sheets: [
          {
            id: 's1',
            name: 'Test',
            buttonType: 'somrig',
            buttons: Array.from({ length: 12 }, (_, i) => ({
              id: `s1-btn-${i + 1}`,
              top: { zones: [zone()], indicatorPosition: 'inner' },
              bottom: { zones: [zone()], indicatorPosition: 'inner' },
              horizontalSeparator: { ...separator },
              verticalSeparator: { ...separator },
            })),
          },
        ],
      }),
    )
  })
}

test('editor panel stays above the card action buttons while scrolling', async ({
  page,
}) => {
  await seedFullSheet(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator('main svg').first()).toBeVisible()

  const result = await page.evaluate(() => {
    const scroller = document.scrollingElement as HTMLElement
    const panel = document.querySelector('aside') as HTMLElement
    const rows = document.querySelectorAll(
      '#print-area div.absolute.top-1.left-1',
    )
    const actions = rows[rows.length - 1] as HTMLElement

    // Scroll the last card's action row into the middle of the panel band.
    const panelBox = panel.getBoundingClientRect()
    scroller.scrollTop +=
      actions.getBoundingClientRect().top - (panelBox.top + panelBox.height / 2)

    const box = actions.getBoundingClientRect()
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    ) as HTMLElement
    return {
      overlapping: box.top > panelBox.top && box.bottom < panelBox.bottom,
      hitInsidePanel: !!hit.closest('aside'),
    }
  })

  // Guard the setup itself: without an overlap the assertion below is vacuous.
  expect(result.overlapping, 'action row scrolled behind the panel').toBe(true)
  expect(result.hitInsidePanel, 'panel receives the click, not the card').toBe(
    true,
  )
})
