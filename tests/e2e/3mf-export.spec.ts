/**
 * 3MF export — verifies the exported package carries one object per colour and
 * a matching <m:colorgroup> resource, the only colour mechanism Bambu Studio
 * parses out of a third-party 3MF.
 * Also checks plate pockets and per-part filament assignments.
 *
 * The export only runs in a real browser (it samples the live SVG DOM via
 * getScreenCTM / getPointAtLength), so it is covered here rather than in a unit test.
 */

import { mdiCog } from '@mdi/js'
import { strFromU8, unzipSync } from 'fflate'
import { expect, test } from './fixtures'

const RED = '#FF3B30'
const BLUE = '#0A84FF'

// Two plain squares — enough geometry to extrude, no MDI dependency.
const SQUARE = 'M4 4 H20 V20 H4 Z'

/** Seed a sheet with one button whose two halves use different icon colours. */
async function seedTwoColourSheet(
  page: import('@playwright/test').Page,
  buttonType: 'somrig' | 'bilresa' = 'somrig',
  icon = SQUARE,
) {
  await page.addInitScript(
    ([red, blue, square, buttonType]: string[]) => {
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
              buttonType,
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
    [RED, BLUE, icon, buttonType],
  )
}

/**
 * Select the first inlay (download buttons only render for the selected one),
 * click 3MF, and return the 3dmodel.model XML from the package.
 * Also reads the per-part Bambu configuration for the new assertions.
 */
async function downloadPackage(page: import('@playwright/test').Page) {
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
  return {
    xml: strFromU8(files['3D/3dmodel.model']),
    config: strFromU8(files['Metadata/model_settings.config']),
  }
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
      vertices: [
        ...m[3].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g),
      ].map((v) => [Number(v[1]), Number(v[2]), Number(v[3])]),
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

    const { xml, config } = await downloadPackage(page)

    // Colours must live in the materials-extension colour group, declared on <model>.
    expect(xml).toContain(
      'xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"',
    )
    expect(xml).not.toContain('basematerials')

    // One <m:color> per distinct colour: plate white, black separators, red + blue icons.
    const displayColors = [
      ...xml.matchAll(/<m:color color="([^"]+)" \/>/g),
    ].map((m) => m[1])
    // 6-digit hex only — Slic3r-derived parsers fall back to white on 8 digits.
    for (const color of displayColors) expect(color).toMatch(/^#[0-9A-F]{6}$/)
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

    // Bambu must be able to assign a separate extruder to each child volume.
    const buildId = /<item objectid="(\d+)"/.exec(xml)?.[1]
    expect(config).toContain(`<object id="${buildId}">`)
    for (const o of objects) {
      const part = new RegExp(
        `<part id="${o.id}"[^>]*>([\\s\\S]*?)<\\/part>`,
      ).exec(config)?.[1]
      expect(part, `${o.name} has an extruder assignment`).toContain(
        `<metadata key="extruder" value="${Number(o.pindex) + 1}" />`,
      )
    }

    // The inserts are flush, exactly two 0.2 mm layers deep, and the white
    // plate no longer has a top face inside an icon footprint.
    const plate = objects.find((o) => o.name === 'Plate')
    if (!plate) throw new Error('Missing plate mesh')
    for (const color of [RED, BLUE]) {
      const icon = objects.find((o) => o.name === `Inlay ${color}`)
      if (!icon) throw new Error(`Missing ${color} insert`)
      expect(new Set(icon.vertices.map((v) => v[2]))).toEqual(
        new Set([-0.4, 0]),
      )
      const topTriangle = icon.triangles.find((tri) =>
        tri.every((index) => icon.vertices[index][2] === 0),
      )
      if (!topTriangle) throw new Error(`Missing ${color} top face`)
      const point = [0, 1].map(
        (axis) =>
          topTriangle.reduce(
            (sum, index) => sum + icon.vertices[index][axis],
            0,
          ) / 3,
      )
      const isInside = (tri: readonly number[]) => {
        const [a, b, c] = tri.map((index) => plate.vertices[index])
        const cross = (p: number[], q: number[]) =>
          (q[0] - p[0]) * (point[1] - p[1]) - (q[1] - p[1]) * (point[0] - p[0])
        const signs = [cross(a, b), cross(b, c), cross(c, a)]
        return signs.every((s) => s > 1e-5) || signs.every((s) => s < -1e-5)
      }
      expect(
        plate.triangles.some(
          (tri) =>
            tri.every((index) => plate.vertices[index][2] === 0) &&
            isInside(tri),
        ),
        `${color} insert has a pocket in the plate`,
      ).toBe(false)
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

    const { xml } = await downloadPackage(page)

    // Default sheet has separators but no icons — plate + separator colour.
    expect(xml).toContain('<m:colorgroup id="1">')
    expect(xml).toContain('<m:color color="#FFFFFF" />')
    expect(xml).toContain('<vertex')
  })

  test('insets coloured icons into the Bilresa plate', async ({ page }) => {
    await seedTwoColourSheet(page, 'bilresa', mdiCog)
    await page.goto('/')
    await expect(page.locator('main svg').first()).toBeVisible()
    const { xml, config } = await downloadPackage(page)
    const objects = parseMeshObjects(xml)
    expect(objects.map((o) => o.name)).toEqual(
      expect.arrayContaining(['Plate', `Inlay ${RED}`, `Inlay ${BLUE}`]),
    )
    for (const object of objects)
      expect(isWatertight(object.triangles), object.name).toBe(true)
    for (const color of [RED, BLUE]) {
      const icon = objects.find((o) => o.name === `Inlay ${color}`)
      expect(icon).toBeDefined()
      expect(new Set(icon?.vertices.map((v) => v[2]))).toEqual(
        new Set([-0.4, 0]),
      )
    }
    expect(config).toContain('<metadata key="extruder" value="3" />')
  })
})
