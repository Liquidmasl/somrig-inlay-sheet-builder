/**
 * 3MF export — verifies the exported package carries one object per colour and
 * a matching <basematerials> resource, so slicers can map colours to filaments.
 *
 * The export only runs in a real browser (it samples the live SVG DOM via
 * getScreenCTM / getPointAtLength), so it is covered here rather than in a unit test.
 */

import { strFromU8, unzipSync } from 'fflate'
import { expect, test } from './fixtures'

const RED = '#FF3B30'
const BLUE = '#0A84FF'

// Two plain squares — enough geometry to extrude, no MDI dependency.
const SQUARE = 'M4 4 H20 V20 H4 Z'

/** Seed a sheet with one button whose two halves use different icon colours. */
async function seedTwoColourSheet(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ([red, blue, square]: string[]) => {
      const zone = (iconColor: string) => ({
        type: 'single',
        icon: square,
        iconSize: 12,
        iconColor,
        iconRotation: 0,
      })
      localStorage.setItem(
        'button-customizer-state-v1',
        JSON.stringify({
          version: 1,
          nextId: 2,
          activeSheetId: 'sheet-1',
          activeButtonId: null,
          savedAt: new Date().toISOString(),
          sheets: [
            {
              id: 'sheet-1',
              name: 'Test',
              buttonType: 'somrig',
              buttons: [
                {
                  id: 'sheet-1-btn-1',
                  top: { zones: [zone(red)], indicatorPosition: 'inner' },
                  bottom: { zones: [zone(blue)], indicatorPosition: 'inner' },
                  horizontalSeparator: {
                    thickness: 0.3,
                    color: '#000000',
                    style: 'solid',
                  },
                  verticalSeparator: {
                    thickness: 0.3,
                    color: '#000000',
                    style: 'solid',
                  },
                },
              ],
            },
          ],
        }),
      )
    },
    [RED, BLUE, SQUARE],
  )
}

/**
 * Select the first inlay (download buttons only render for the selected one),
 * click 3MF, and return the 3dmodel.model XML from the package.
 */
async function downloadModelXml(page: import('@playwright/test').Page) {
  await page.locator('main button[aria-label]').first().click()
  // Both the desktop grid and the mobile list are in the DOM; take the visible one.
  const button = page
    .locator('button[aria-label="Download 3MF"]:visible')
    .first()
  await expect(button).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    button.click(),
  ])
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const files = unzipSync(new Uint8Array(Buffer.concat(chunks)))
  return strFromU8(files['3D/3dmodel.model'])
}

/** Mesh objects in the model, in resource order (the assembly has no mesh). */
function parseMeshObjects(xml: string) {
  return [...xml.matchAll(/<object id="(\d+)"([^>]*)>([\s\S]*?)<\/object>/g)]
    .filter((m) => m[3].includes('<mesh>'))
    .map((m) => ({
      id: m[1],
      name: /name="([^"]*)"/.exec(m[2])?.[1] ?? '',
      pid: /pid="(\d+)"/.exec(m[2])?.[1] ?? '',
      pindex: /pindex="(\d+)"/.exec(m[2])?.[1] ?? '',
      triangles: [
        ...m[3].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g),
      ].map((t) => [Number(t[1]), Number(t[2]), Number(t[3])] as const),
    }))
}

/**
 * A mesh is watertight when every directed edge occurs exactly once and its
 * reverse occurs exactly once — i.e. each edge is shared by exactly two
 * consistently-wound triangles. Slicers reject anything else.
 */
function isWatertight(
  triangles: readonly (readonly [number, number, number])[],
) {
  const edges = new Map<string, number>()
  for (const [a, b, c] of triangles) {
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = `${from}-${to}`
      edges.set(key, (edges.get(key) ?? 0) + 1)
    }
  }
  return [...edges].every(
    ([key, count]) =>
      count === 1 && edges.get(key.split('-').reverse().join('-')) === 1,
  )
}

test.describe('3MF export', () => {
  test('groups geometry by colour and declares matching materials', async ({
    page,
  }) => {
    await seedTwoColourSheet(page)
    await page.goto('/')
    await expect(page.locator('main svg').first()).toBeVisible()

    const xml = await downloadModelXml(page)

    // One <base> per distinct colour: plate white, black separators, red + blue icons.
    const displayColors = [...xml.matchAll(/displaycolor="([^"]+)"/g)].map(
      (m) => m[1],
    )
    expect(new Set(displayColors).size).toBe(displayColors.length)
    expect(displayColors).toEqual(
      expect.arrayContaining(['#FFFFFF', '#000000', RED, BLUE]),
    )

    // Every mesh object references the material group, and each colour is used.
    const objects = parseMeshObjects(xml)
    expect(objects.length).toBe(displayColors.length)
    expect(objects.map((o) => o.name)).toContain('Plate')
    for (const o of objects) expect(o.pid).toBe('1')
    expect(new Set(objects.map((o) => o.pindex)).size).toBe(
      displayColors.length,
    )

    // Splitting the icon layer per colour must not break the meshes.
    for (const o of objects) {
      expect(isWatertight(o.triangles), `${o.name} is watertight`).toBe(true)
    }

    // All meshes are grouped into a single assembly placed by one build item.
    expect([...xml.matchAll(/<component objectid="\d+" \/>/g)].length).toBe(
      objects.length,
    )
    expect([...xml.matchAll(/<item objectid="\d+"/g)].length).toBe(1)

    // Geometry actually made it in.
    expect(xml).toContain('<vertex')
    expect(xml).toContain('<triangle')
  })

  test('exports a plate-only model when the inlay is blank', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('main svg').first()).toBeVisible()

    const xml = await downloadModelXml(page)

    // Default sheet has separators but no icons — plate + separator colour.
    expect(xml).toContain('<basematerials id="1">')
    expect(xml).toContain('displaycolor="#FFFFFF"')
    expect(xml).toContain('<vertex')
  })
})
