/**
 * use3mfDownload — generates a 3MF file containing:
 *   Object 1: physical button plate (parsed from a binary STL shipped in public/models/)
 *   Object 2: extruded icon / indicator / label layer embedded into the face at Z=0
 *
 * Coordinate conventions
 * ─────────────────────
 *   STL / 3D world  X: left→right, Y: bottom→top, Z: -depth→0 (face at Z=0)
 *   SVG viewBox     X: left→right, Y: top→bottom, origin = top-left corner, units = mm
 *
 *   Mapping: worldX = svgX − W/2
 *            worldY = H/2 − svgY   (Y flip)
 *            worldZ = -EXTRUDE_H..0 (icon layer embedded into face, flush at Z=0)
 *
 * Multi-colour printing (Bambu Studio)
 * ─────────────────────────────────────
 *   Import the 3MF, assign a different filament to each object.
 *   Both meshes share the Z=−EXTRUDE_H..0 region; the slicer assigns colour
 *   per object so the face surface remains flat with two colours.
 */

import earcut from 'earcut'
import * as fflate from 'fflate'
import * as opentype from 'opentype.js'

// Depth of the icon extrusion below the face surface (mm)
const EXTRUDE_H = 0.4

// ── Font (cached singleton) ───────────────────────────────────────────────────

let _fontPromise: Promise<opentype.Font> | null = null

function loadFont(): Promise<opentype.Font> {
  if (!_fontPromise) {
    _fontPromise = fetch('/fonts/DejaVuSans.ttf')
      .then((r) => r.arrayBuffer())
      .then((buf) => opentype.parse(buf) as opentype.Font)
  }
  return _fontPromise
}

// ── Hidden SVG helper for path measurement ────────────────────────────────────
// getTotalLength / getPointAtLength require an element in the live DOM.

let _helperSvg: SVGSVGElement | null = null
let _helperPath: SVGPathElement | null = null

function getHelperPath(): SVGPathElement {
  if (!_helperSvg || !_helperPath) {
    const ns = 'http://www.w3.org/2000/svg'
    _helperSvg = document.createElementNS(ns, 'svg') as SVGSVGElement
    _helperPath = document.createElementNS(ns, 'path') as SVGPathElement
    _helperSvg.appendChild(_helperPath)
    Object.assign(_helperSvg.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    })
    document.body.appendChild(_helperSvg)
  }
  return _helperPath
}

// ── Binary STL parser ─────────────────────────────────────────────────────────

function parseStl(buffer: ArrayBuffer): number[] {
  const view = new DataView(buffer)
  const count = view.getUint32(80, true)
  const verts: number[] = []
  for (let i = 0; i < count; i++) {
    const base = 84 + i * 50 + 12 // skip 12-byte normal
    for (let v = 0; v < 3; v++) {
      const b = base + v * 12
      verts.push(
        view.getFloat32(b, true),
        view.getFloat32(b + 4, true),
        view.getFloat32(b + 8, true),
      )
    }
  }
  return verts
}

// ── 2D geometry helpers ───────────────────────────────────────────────────────

function signedArea(pts: [number, number][]): number {
  let a = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
  }
  return a * 0.5
}

function circlePolygon(
  cx: number,
  cy: number,
  r: number,
  n = 20,
): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
  })
}

function rectPolygon(
  x: number,
  y: number,
  w: number,
  h: number,
): [number, number][] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]
}

/** Rotate ring around (cx, cy) by deg degrees (positive = CCW in standard math). */
function rotateRing(
  ring: [number, number][],
  deg: number,
  cx: number,
  cy: number,
): [number, number][] {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return ring.map(([x, y]) => [
    cx + (x - cx) * cos - (y - cy) * sin,
    cy + (x - cx) * sin + (y - cy) * cos,
  ])
}

/** Map SVG (Y-down, origin top-left) coords to 3D world (Y-up, origin center). */
function svgRingToWorld(
  ring: [number, number][],
  W: number,
  H: number,
): [number, number][] {
  return ring.map(([x, y]) => [x - W / 2, H / 2 - y])
}

// ── Point-in-polygon (ray cast) ───────────────────────────────────────────────

function pointInPolygon(
  pt: [number, number],
  poly: [number, number][],
): boolean {
  const [px, py] = pt
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// ── Group rings into outer+holes shapes ───────────────────────────────────────
// Sorts by descending area; a ring that is inside a larger ring becomes its hole.

interface Shape {
  outer: [number, number][]
  holes: [number, number][][]
}

function groupRingsIntoShapes(rings: [number, number][][]): Shape[] {
  if (rings.length === 0) return []

  // Sort largest → smallest so earlier entries always have larger area than later ones
  const sorted = [...rings].sort(
    (a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)),
  )

  // Nesting depth = number of larger rings that contain this ring's first point.
  // Even depth (0, 2, 4…) → outer shape (filled).
  // Odd depth  (1, 3, 5…) → hole inside its nearest containing outer.
  const depths = sorted.map(
    (ring, i) =>
      sorted.slice(0, i).filter((larger) => pointInPolygon(ring[0], larger))
        .length,
  )

  const shapes: Shape[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (depths[i] % 2 === 0) {
      shapes.push({ outer: sorted[i], holes: [] })
    } else {
      // Assign to the smallest-area outer that still contains this ring
      let nearest: Shape | null = null
      let nearestArea = Infinity
      for (const shape of shapes) {
        const a = Math.abs(signedArea(shape.outer))
        if (a < nearestArea && pointInPolygon(sorted[i][0], shape.outer)) {
          nearest = shape
          nearestArea = a
        }
      }
      if (nearest) nearest.holes.push(sorted[i])
    }
  }
  return shapes
}

// ── Extrusion ─────────────────────────────────────────────────────────────────

function extrudePolygon(
  outer: [number, number][],
  holes: [number, number][][],
  z0: number,
  z1: number,
): number[] {
  if (outer.length < 3) return []

  // Normalise winding so wall generation can rely on consistent traversal direction.
  // Outer must be CCW (positive signed area in world Y-up), holes must be CW.
  if (signedArea(outer) < 0) outer = [...outer].reverse()
  holes = holes.map((h) => (signedArea(h) < 0 ? [...h].reverse() : h))

  const flat: number[] = []
  const holeIndices: number[] = []
  for (const pt of outer) flat.push(...pt)
  for (const hole of holes) {
    holeIndices.push(flat.length / 2)
    for (const pt of hole) flat.push(...pt)
  }
  const allPts: [number, number][] = [
    ...outer,
    ...(holes.flat() as [number, number][]),
  ]
  const indices = earcut(flat, holeIndices.length ? holeIndices : undefined)
  if (indices.length === 0) return []

  const tris: number[] = []

  // Top face (z1) — earcut CCW order → normal points +Z
  for (let i = 0; i < indices.length; i += 3) {
    const a = allPts[indices[i]],
      b = allPts[indices[i + 1]],
      c = allPts[indices[i + 2]]
    tris.push(a[0], a[1], z1, b[0], b[1], z1, c[0], c[1], z1)
  }
  // Bottom face (z0) — flipped to CW → normal points −Z
  for (let i = 0; i < indices.length; i += 3) {
    const a = allPts[indices[i]],
      b = allPts[indices[i + 1]],
      c = allPts[indices[i + 2]]
    tris.push(a[0], a[1], z0, c[0], c[1], z0, b[0], b[1], z0)
  }

  // Side walls
  function walls(ring: [number, number][], outward: boolean) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length]
      if (outward) {
        tris.push(a[0], a[1], z0, b[0], b[1], z0, b[0], b[1], z1)
        tris.push(a[0], a[1], z0, b[0], b[1], z1, a[0], a[1], z1)
      } else {
        tris.push(a[0], a[1], z0, b[0], b[1], z1, b[0], b[1], z0)
        tris.push(a[0], a[1], z0, a[0], a[1], z1, b[0], b[1], z1)
      }
    }
  }
  walls(outer, true)
  for (const hole of holes) walls(hole, false)

  return tris
}

// ── SVG path → rings ──────────────────────────────────────────────────────────

/**
 * Split a path `d` string into individual subpath strings (one per M…Z).
 * Each subpath must start with M/m.
 */
function splitSubpaths(d: string): string[] {
  return d
    .trim()
    .split(/(?=[Mm])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

/**
 * Sample a subpath `d` string in its LOCAL coordinate space.
 * Uses a hidden SVG path element so getTotalLength/getPointAtLength work.
 */
function sampleSubpathLocal(dSubpath: string): [number, number][] {
  const hp = getHelperPath()
  hp.setAttribute('d', dSubpath)

  const totalLen = hp.getTotalLength()
  if (totalLen < 0.01) return []

  // 3 samples per MDI unit (MDI paths are 24×24 units → typical arc length ~50)
  const n = Math.max(12, Math.ceil(totalLen * 3))
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const p = hp.getPointAtLength((i / n) * totalLen)
    pts.push([p.x, p.y])
  }
  return pts
}

/**
 * Sample a <path> element into polygon rings in SVG mm space.
 *
 * Key fix: the correct matrix to go from path-local → SVG-mm is
 *   svgCTM⁻¹ · pathCTM   (NOT pathCTM · svgCTM⁻¹)
 *
 * Each M…Z subpath is sampled individually via a hidden helper element,
 * so gaps between subpaths can never be misidentified as intra-path jumps.
 */
function samplePathRings(
  pathEl: SVGPathElement,
  svgEl: SVGSVGElement,
): [number, number][][] {
  const d = pathEl.getAttribute('d')
  if (!d) return []

  const pathCTM = pathEl.getScreenCTM()
  const svgCTM = svgEl.getScreenCTM()
  if (!pathCTM || !svgCTM) return []

  // svgCTM⁻¹ · pathCTM  maps path-local coords → SVG user-space (mm)
  const transform = svgCTM.inverse().multiply(pathCTM)

  const rings: [number, number][][] = []
  for (const sub of splitSubpaths(d)) {
    const localPts = sampleSubpathLocal(sub)
    if (localPts.length < 4) continue

    const mmPts: [number, number][] = localPts.map(([x, y]) => {
      const pt = new DOMPoint(x, y).matrixTransform(transform)
      return [pt.x, pt.y]
    })
    rings.push(mmPts)
  }
  return rings
}

// ── opentype.js path → polygon rings ─────────────────────────────────────────

function bezierCubic(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const u = 1 - t
  return (
    u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  )
}

function bezierQuad(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
}

function opentypePathToRings(path: opentype.Path): [number, number][][] {
  const rings: [number, number][][] = []
  let current: [number, number][] = []
  let lastX = 0,
    lastY = 0

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'M':
        if (current.length > 3) rings.push(current)
        current = []
        lastX = cmd.x!
        lastY = cmd.y!
        current.push([lastX, lastY])
        break
      case 'L':
        lastX = cmd.x!
        lastY = cmd.y!
        current.push([lastX, lastY])
        break
      case 'C': {
        const x0 = lastX,
          y0 = lastY,
          steps = 8
        for (let t = 1; t <= steps; t++) {
          const u = t / steps
          current.push([
            bezierCubic(x0, cmd.x1!, cmd.x2!, cmd.x!, u),
            bezierCubic(y0, cmd.y1!, cmd.y2!, cmd.y!, u),
          ])
        }
        lastX = cmd.x!
        lastY = cmd.y!
        break
      }
      case 'Q': {
        const x0 = lastX,
          y0 = lastY,
          steps = 6
        for (let t = 1; t <= steps; t++) {
          const u = t / steps
          current.push([
            bezierQuad(x0, cmd.x1!, cmd.x!, u),
            bezierQuad(y0, cmd.y1!, cmd.y!, u),
          ])
        }
        lastX = cmd.x!
        lastY = cmd.y!
        break
      }
      case 'Z':
        if (current.length > 3) rings.push(current)
        current = []
        break
    }
  }
  if (current.length > 3) rings.push(current)
  return rings
}

// ── Parse SVG transform="rotate(deg,cx,cy)" ──────────────────────────────────

function parseRotateTransform(
  attr: string | null,
): { deg: number; cx: number; cy: number } | null {
  if (!attr) return null
  const m = attr.match(
    /rotate\(\s*([^,)]+)(?:\s*,\s*([^,)]+)\s*,\s*([^,)]+))?\s*\)/,
  )
  if (!m) return null
  return {
    deg: parseFloat(m[1]),
    cx: m[2] ? parseFloat(m[2]) : 0,
    cy: m[3] ? parseFloat(m[3]) : 0,
  }
}

// ── Collect icon-layer geometry from the SVG DOM ──────────────────────────────

function collectIconTris(svgEl: SVGSVGElement, font: opentype.Font): number[] {
  const vb = svgEl.viewBox.baseVal
  const W = vb.width
  const H = vb.height

  // Icons are embedded INTO the face (face at Z=0, plate at Z<0).
  // Z0..Z1 overlaps the top EXTRUDE_H mm of the plate → Bambu assigns colour per object.
  const Z0 = -EXTRUDE_H
  const Z1 = 0

  const tris: number[] = []

  /** Convert SVG-space rings to world space, group into outer+holes, extrude. */
  function processRings(svgRings: [number, number][][]) {
    if (svgRings.length === 0) return
    const worldRings = svgRings.map((r) => svgRingToWorld(r, W, H))
    const shapes = groupRingsIntoShapes(worldRings)
    for (const { outer, holes } of shapes) {
      tris.push(...extrudePolygon(outer, holes, Z0, Z1))
    }
  }

  // ── MDI icon <path> elements (inside transformed <g>) ──────────────────────
  const iconPaths = svgEl.querySelectorAll<SVGPathElement>(
    'g[clip-path] g[transform] > path',
  )
  for (const pathEl of iconPaths) {
    processRings(samplePathRings(pathEl, svgEl))
  }

  // ── Dot / double-dot indicators (<circle>) ──────────────────────────────────
  const circles = svgEl.querySelectorAll<SVGCircleElement>(
    'g[clip-path] circle',
  )
  for (const circ of circles) {
    const cx = parseFloat(circ.getAttribute('cx') ?? '0')
    const cy = parseFloat(circ.getAttribute('cy') ?? '0')
    const r = parseFloat(circ.getAttribute('r') ?? '0')
    processRings([circlePolygon(cx, cy, r, 20)])
  }

  // ── Dash indicators (<rect>) ────────────────────────────────────────────────
  const rects = svgEl.querySelectorAll<SVGRectElement>('g[clip-path] rect')
  for (const rect of rects) {
    const x = parseFloat(rect.getAttribute('x') ?? '0')
    const y = parseFloat(rect.getAttribute('y') ?? '0')
    const w = parseFloat(rect.getAttribute('width') ?? '0')
    const h = parseFloat(rect.getAttribute('height') ?? '0')
    processRings([rectPolygon(x, y, w, h)])
  }

  // ── Text labels (<text>) ────────────────────────────────────────────────────
  const texts = svgEl.querySelectorAll<SVGTextElement>('g[clip-path] text')
  for (const textEl of texts) {
    const content = (textEl.textContent ?? '').trim()
    if (!content) continue

    const cx = parseFloat(textEl.getAttribute('x') ?? '0')
    const cy = parseFloat(textEl.getAttribute('y') ?? '0')
    const fontSize = parseFloat(textEl.getAttribute('font-size') ?? '3')
    const rot = parseRotateTransform(textEl.getAttribute('transform'))

    // Measure bbox at origin to get centering offsets
    const tmpPath = font.getPath(content, 0, 0, fontSize)
    const bb = tmpPath.getBoundingBox()
    if (bb.x2 <= bb.x1 || bb.y2 <= bb.y1) continue

    // Render centered at (cx, cy) — matching SVG text-anchor:middle + dominant-baseline:central
    const glyphPath = font.getPath(
      content,
      cx - (bb.x1 + bb.x2) / 2,
      cy - (bb.y1 + bb.y2) / 2,
      fontSize,
    )
    const svgRings = opentypePathToRings(glyphPath)
    if (svgRings.length === 0) continue

    // Convert to world space
    let worldRings = svgRings.map((r) => svgRingToWorld(r, W, H))

    // Apply text rotation in world space.
    // SVG rotate is CW in Y-down; after Y-flip, same angle becomes CCW (Y-up).
    // Negate so the printed result matches the SVG preview.
    if (rot) {
      const [pivotX, pivotY] = svgRingToWorld([[rot.cx, rot.cy]], W, H)[0]
      worldRings = worldRings.map((ring) =>
        rotateRing(ring, -rot.deg, pivotX, pivotY),
      )
    }

    const shapes = groupRingsIntoShapes(worldRings)
    for (const { outer, holes } of shapes) {
      tris.push(...extrudePolygon(outer, holes, Z0, Z1))
    }
  }

  return tris
}

// ── 3MF XML builder ───────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(4)

function buildObjectXml(id: number, tris: number[]): string {
  const triCount = tris.length / 9
  const vertMap = new Map<string, number>()
  const uniqueVerts: number[] = []
  const triIndices: [number, number, number][] = []

  for (let i = 0; i < triCount; i++) {
    const b = i * 9
    const tri: [number, number, number] = [0, 0, 0]
    for (let v = 0; v < 3; v++) {
      const vb = b + v * 3
      const key = `${fmt(tris[vb])},${fmt(tris[vb + 1])},${fmt(tris[vb + 2])}`
      let idx = vertMap.get(key)
      if (idx === undefined) {
        idx = uniqueVerts.length / 3
        vertMap.set(key, idx)
        uniqueVerts.push(tris[vb], tris[vb + 1], tris[vb + 2])
      }
      tri[v] = idx
    }
    triIndices.push(tri)
  }

  let vertsXml = ''
  for (let i = 0; i < uniqueVerts.length; i += 3) {
    vertsXml += `        <vertex x="${fmt(uniqueVerts[i])}" y="${fmt(uniqueVerts[i + 1])}" z="${fmt(uniqueVerts[i + 2])}" />\n`
  }
  let trisXml = ''
  for (const [v1, v2, v3] of triIndices) {
    trisXml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`
  }

  return `    <object id="${id}" type="model">
      <mesh>
        <vertices>
${vertsXml}        </vertices>
        <triangles>
${trisXml}        </triangles>
      </mesh>
    </object>`
}

// 180° rotation around X: (x,y,z)→(x,−y,−z)
// Puts the face (z=0, currently the top) at z=0 minimum so the slicer places it on the build plate.
const FACE_DOWN_TRANSFORM = '1 0 0 0 -1 0 0 0 -1 0 0 0'

function build3mfModel(plateTris: number[], iconTris: number[]): string {
  const objects = [buildObjectXml(1, plateTris)]
  const items = [`    <item objectid="1" transform="${FACE_DOWN_TRANSFORM}" />`]
  if (iconTris.length > 0) {
    objects.push(buildObjectXml(2, iconTris))
    items.push(`    <item objectid="2" transform="${FACE_DOWN_TRANSFORM}" />`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${items.join('\n')}
  </build>
</model>`
}

// ── Composable ────────────────────────────────────────────────────────────────

export function use3mfDownload() {
  async function download3mf(
    svgEl: SVGSVGElement,
    buttonType: 'somrig' | 'bilresa',
    filename = 'button-inlay.3mf',
  ) {
    const [font, stlBuf] = await Promise.all([
      loadFont(),
      fetch(`/models/${buttonType}_front_plate.stl`).then((r) =>
        r.arrayBuffer(),
      ),
    ])

    const plateTris = parseStl(stlBuf)
    const iconTris = collectIconTris(svgEl, font)

    const enc = new TextEncoder()
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`

    const zipped = fflate.zipSync({
      '[Content_Types].xml': enc.encode(contentTypes),
      '_rels/.rels': enc.encode(rels),
      '3D/3dmodel.model': enc.encode(build3mfModel(plateTris, iconTris)),
    })

    const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'model/3mf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { download3mf }
}
