/**
 * `#layout=` links — appending generated buttons to the current sheet.
 */

import { mdiAlphaABox, mdiBattery10, mdiLightbulb, mdiPrinter3d } from '@mdi/js'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const BUTTONS = '#print-area button[aria-label^="Select button"]'
const STORAGE_KEY = 'button-customizer-state-v1'
const ERROR = '[role="alert"]'

const linkTo = (layout: unknown) =>
  `/#layout=${encodeURIComponent(JSON.stringify(layout))}`

const oneButton = (icon: string) => ({
  v: 1,
  buttons: [{ top: [{ icon }], bottom: [{}] }],
})

const iconPath = (page: Page, path: string) =>
  page.locator(`${BUTTONS} svg path[d="${path}"]`)

async function storedButtons(page: Page) {
  // Leaving the page flushes the debounced save.
  await page.reload()
  await expect(page.locator(BUTTONS).first()).toBeVisible()
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? '{}')
    return state.sheets[0].buttons
  }, STORAGE_KEY)
}

test.describe('Layout link', () => {
  test('appends buttons after the existing one and renders their icons', async ({
    page,
  }) => {
    await page.goto(
      linkTo({
        v: 1,
        buttons: [
          {
            top: [{ icon: 'mdi:lightbulb', label: 'Küche & Bad' }],
            bottom: [{ icon: 'mdi:battery-10' }],
          },
          {
            top: [{ icon: 'mdi:printer-3d' }],
            bottom: [{ icon: 'mdi:alpha-a-box' }],
          },
        ],
      }),
    )

    await expect(page.locator(BUTTONS)).toHaveCount(3)
    for (const path of [
      mdiLightbulb,
      mdiBattery10,
      mdiPrinter3d,
      mdiAlphaABox,
    ]) {
      await expect(iconPath(page, path)).toHaveCount(1)
    }
    await expect(
      page.locator('#print-area svg', { hasText: 'Küche & Bad' }),
    ).toHaveCount(1)
    await expect(page.locator(ERROR)).toHaveCount(0)
  })

  test('zones take positional gestures unless type is set', async ({
    page,
  }) => {
    await page.goto(
      linkTo({
        v: 1,
        buttons: [{ top: [{}, {}, {}], bottom: [{ type: 'double' }, {}] }],
      }),
    )
    await expect(page.locator(BUTTONS)).toHaveCount(2)

    const [, added] = await storedButtons(page)
    const types = (zones: { type: string }[]) => zones.map((z) => z.type)
    expect(types(added.top.zones)).toEqual(['single', 'hold', 'double'])
    expect(types(added.bottom.zones)).toEqual(['double', 'hold'])
    expect(added.top.zones[0].iconSize).toBe(12)
  })

  test('reloading does not import the link again', async ({ page }) => {
    await page.goto(linkTo(oneButton('mdi:lightbulb')))
    await expect(page.locator(BUTTONS)).toHaveCount(2)
    expect(new URL(page.url()).hash).toBe('')

    await page.reload()
    await expect(page.locator(BUTTONS)).toHaveCount(2)
  })

  test('imports when the hash changes in an open tab', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(BUTTONS)).toHaveCount(1)

    await page.evaluate(
      (hash) => {
        window.location.hash = hash
      },
      linkTo(oneButton('mdi:lightbulb')).slice(2),
    )

    await expect(page.locator(BUTTONS)).toHaveCount(2)
  })

  test('an unknown icon adds nothing and names the icon', async ({ page }) => {
    await page.goto(
      linkTo({
        v: 1,
        buttons: [
          { top: [{ icon: 'mdi:lightbulb' }], bottom: [{ icon: 'mdi:nope' }] },
        ],
      }),
    )

    await expect(page.locator(ERROR)).toContainText('mdi:nope')
    await expect(page.locator(BUTTONS)).toHaveCount(1)

    await page.locator(`${ERROR} button[aria-label="Dismiss"]`).click()
    await expect(page.locator(ERROR)).toHaveCount(0)
  })

  const invalidLinks: [string, string, string][] = [
    ['malformed JSON', '/#layout=%7Bnope', 'not valid JSON'],
    ['wrong version', linkTo({ v: 2, buttons: [] }), '"v": 1'],
    ['no buttons', linkTo({ v: 1, buttons: [] }), 'no buttons'],
    [
      'too many zones',
      linkTo({ v: 1, buttons: [{ top: [{}, {}, {}, {}], bottom: [{}] }] }),
      'button 1 top needs 1 to 3 zones',
    ],
    [
      'missing half',
      linkTo({ v: 1, buttons: [{ top: [{}] }] }),
      'button 1 bottom needs 1 to 3 zones',
    ],
    [
      'unknown field',
      linkTo({ v: 1, buttons: [{ top: [{ colour: 'red' }], bottom: [{}] }] }),
      'unknown field "colour"',
    ],
    [
      'inherited property name as field',
      linkTo({ v: 1, buttons: [{ top: [{ toString: 1 }], bottom: [{}] }] }),
      'unknown field "toString"',
    ],
    [
      'invalid colour',
      linkTo({
        v: 1,
        buttons: [{ top: [{ iconColor: 'red' }], bottom: [{}] }],
      }),
      'invalid iconColor',
    ],
    ['SVG path as icon', linkTo(oneButton(mdiLightbulb)), 'unknown icons'],
  ]

  for (const [name, url, message] of invalidLinks) {
    test(`rejects a link with ${name}`, async ({ page }) => {
      await page.goto(url)
      await expect(page.locator(ERROR)).toContainText(message)
      await expect(page.locator(BUTTONS)).toHaveCount(1)
    })
  }
})
