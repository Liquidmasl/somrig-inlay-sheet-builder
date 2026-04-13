/**
 * use3mfDownload — generates a 3MF file containing:
 *   Object 1: physical button plate (parsed from a binary STL shipped in public/models/)
 *   Object 2: extruded icon / indicator / label layer (0.4 mm above the face at Z=0)
 *
 * Coordinate conventions
 * ─────────────────────
 *   STL / 3D world  X: left→right, Y: bottom→top, Z: -depth→0 (face at Z=0)
 *   SVG viewBox     X: left→right, Y: top→bottom, origin = top-left corner, units = mm
 *
 *   Mapping: worldX = svgX − W/2
 *            worldY = H/2 − svgY   (Y flip)
 *            worldZ = 0..+EXTRUDE_H (icon layer sits on top of face)
 *
 * Multi-colour printing
 * ────────────────────
 *   In Bambu Studio, import the 3MF and assign a different filament to each object.
 *   The two meshes touch at Z=0; the slicer resolves the colour boundary.
 */

import earcut from 'earcut'
import * as fflate from 'fflate'
import * as opentype from 'opentype.js'

// Height of the icon extrusion above the face (mm)
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

// ── Binary STL parser ─────────────────────────────────────────────────────────
/**
 * Parse a binary STL buffer into a flat vertex array [x,y,z, x,y,z, …]
 * (3 vertices per triangle, no index sharing — triangle soup).
 */
function parseStl(buffer: ArrayBuffer): number[] {
  const view = new DataView(buffer)
  const count = view.getUint32(80, true)
  const verts: number[] = []
  for (let i = 0; i < count; i++) {
    const base = 84 + i * 50 + 12 // skip 12-byte normal vector
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

// ── Coordinate mapping ────────────────────────────────────────────────────────

function svgRingToWorld(
  ring: [number, number][],
  W: number,
  H: number,
): [number, number][] {
  return ring.map(([x, y]) => [x - W / 2, H / 2 - y])
}

// ── Extrusion ─────────────────────────────────────────────────────────────────

/**
 * Extrude a polygon from z0 to z1.
 * `outer` is the boundary ring (CW or CCW — earcut handles both).
 * `holes` are inner rings.
 * Returns flat triangle vertex array [x,y,z, x,y,z, …].
 */
function extrudePolygon(
  outer: [number, number][],
  holes: [number, number][][],
  z0: number,
  z1: number,
): number[] {
  if (outer.length < 3) return []

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

  // Top face (z1): flip winding so normal points +Z
  for (let i = 0; i < indices.length; i += 3) {
    const a = allPts[indices[i]]
    const b = allPts[indices[i + 1]]
    const c = allPts[indices[i + 2]]
    tris.push(a[0], a[1], z1, c[0], c[1], z1, b[0], b[1], z1)
  }

  // Bottom face (z0): normal points −Z
  for (let i = 0; i < indices.length; i += 3) {
    const a = allPts[indices[i]]
    const b = allPts[indices[i + 1]]
    const c = allPts[indices[i + 2]]
    tris.push(a[0], a[1], z0, b[0], b[1], z0, c[0], c[1], z0)
  }

  // Side walls
  function walls(ring: [number, number][], outward: boolean) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
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

// ── SVG path sampling ─────────────────────────────────────────────────────────

/**
 * Sample a <path> element into one or more polygon rings (in SVG mm space).
 * Subpaths are detected by "jump" gaps in the sample sequence.
 */
function samplePathRings(
  pathEl: SVGPathElement,
  svgEl: SVGSVGElement,
): [number, number][][] {
  const totalLen = pathEl.getTotalLength()
  if (totalLen < 0.5) return []

  const pathCTM = pathEl.getScreenCTM()
  const svgCTM = svgEl.getScreenCTM()
  if (!pathCTM || !svgCTM) return []
  const transform = pathCTM.multiply(svgCTM.inverse())

  const samplesPerUnit = 6
  const n = Math.max(16, Math.ceil(totalLen * samplesPerUnit))
  const svgPt = svgEl.createSVGPoint()

  const samples: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const p = pathEl.getPointAtLength((i / n) * totalLen)
    svgPt.x = p.x
    svgPt.y = p.y
    const mm = svgPt.matrixTransform(transform)
    samples.push([mm.x, mm.y])
  }

  // Split into rings at "teleport" gaps (new subpath start)
  const stepLen = totalLen / n
  const jumpThreshold = stepLen * 4

  const rings: [number, number][][] = []
  let current: [number, number][] = [samples[0]]

  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i][0] - samples[i - 1][0]
    const dy = samples[i][1] - samples[i - 1][1]
    if (Math.sqrt(dx * dx + dy * dy) > jumpThreshold) {
      if (current.length > 3) rings.push(current)
      current = [samples[i]]
    } else {
      current.push(samples[i])
    }
  }
  if (current.length > 3) rings.push(current)

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

/** Convert an opentype Path into polygon rings (in the path's coordinate space). */
function opentypePathToRings(path: opentype.Path): [number, number][][] {
  const rings: [number, number][][] = []
  let current: [number, number][] = []
  let lastX = 0
  let lastY = 0

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
        const steps = 8
        const x0 = lastX,
          y0 = lastY
        for (let t = 1; t <= steps; t++) {
          const u = t / steps
          const nx = bezierCubic(x0, cmd.x1!, cmd.x2!, cmd.x!, u)
          const ny = bezierCubic(y0, cmd.y1!, cmd.y2!, cmd.y!, u)
          current.push([nx, ny])
        }
        lastX = cmd.x!
        lastY = cmd.y!
        break
      }

      case 'Q': {
        const steps = 6
        const x0 = lastX,
          y0 = lastY
        for (let t = 1; t <= steps; t++) {
          const u = t / steps
          const nx = bezierQuad(x0, cmd.x1!, cmd.x!, u)
          const ny = bezierQuad(y0, cmd.y1!, cmd.y!, u)
          current.push([nx, ny])
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
  transform: string | null,
): { deg: number; cx: number; cy: number } | null {
  if (!transform) return null
  const m = transform.match(
    /rotate\(\s*([^,)]+)(?:\s*,\s*([^,)]+)\s*,\s*([^,)]+))?\s*\)/,
  )
  if (!m) return null
  return {
    deg: parseFloat(m[1]),
    cx: m[2] ? parseFloat(m[2]) : 0,
    cy: m[3] ? parseFloat(m[3]) : 0,
  }
}

// ── Collect icon layer geometry from DOM ──────────────────────────────────────

function collectIconTris(svgEl: SVGSVGElement, font: opentype.Font): number[] {
  const vb = svgEl.viewBox.baseVal
  const W = vb.width
  const H = vb.height
  const Z0 = 0
  const Z1 = EXTRUDE_H

  const tris: number[] = []

  function addRings(rings: [number, number][][]) {
    if (rings.length === 0) return

    // Largest area ring is the outer contour; others are holes
    const areas = rings.map((r) => Math.abs(signedArea(r)))
    let outerIdx = 0
    for (let i = 1; i < rings.length; i++) {
      if (areas[i] > areas[outerIdx]) outerIdx = i
    }

    const outer = svgRingToWorld(rings[outerIdx], W, H)
    const holes = rings
      .filter((_, i) => i !== outerIdx)
      .map((r) => svgRingToWorld(r, W, H))

    const extruded = extrudePolygon(outer, holes, Z0, Z1)
    tris.push(...extruded)
  }

  // ── MDI icon <path> elements (inside transformed <g>) ──────────────────────
  const iconPaths = svgEl.querySelectorAll<SVGPathElement>(
    'g[clip-path] g[transform] > path',
  )
  for (const pathEl of iconPaths) {
    const rings = samplePathRings(pathEl, svgEl)
    addRings(rings)
  }

  // ── Dot / double-dot indicators (<circle>) ──────────────────────────────────
  const circles = svgEl.querySelectorAll<SVGCircleElement>(
    'g[clip-path] circle',
  )
  for (const circ of circles) {
    const cx = parseFloat(circ.getAttribute('cx') ?? '0')
    const cy = parseFloat(circ.getAttribute('cy') ?? '0')
    const r = parseFloat(circ.getAttribute('r') ?? '0')
    const poly = svgRingToWorld(circlePolygon(cx, cy, r, 20), W, H)
    tris.push(...extrudePolygon(poly, [], Z0, Z1))
  }

  // ── Dash indicators (<rect>) ────────────────────────────────────────────────
  const rects = svgEl.querySelectorAll<SVGRectElement>('g[clip-path] rect')
  for (const rect of rects) {
    const x = parseFloat(rect.getAttribute('x') ?? '0')
    const y = parseFloat(rect.getAttribute('y') ?? '0')
    const w = parseFloat(rect.getAttribute('width') ?? '0')
    const h = parseFloat(rect.getAttribute('height') ?? '0')
    const poly = svgRingToWorld(rectPolygon(x, y, w, h), W, H)
    tris.push(...extrudePolygon(poly, [], Z0, Z1))
  }

  // ── Text labels (<text>) ────────────────────────────────────────────────────
  const texts = svgEl.querySelectorAll<SVGTextElement>('g[clip-path] text')
  for (const textEl of texts) {
    const content = (textEl.textContent ?? '').trim()
    if (!content) continue

    const cx = parseFloat(textEl.getAttribute('x') ?? '0')
    const cy = parseFloat(textEl.getAttribute('y') ?? '0')
    const fontSize = parseFloat(textEl.getAttribute('font-size') ?? '3')
    const transformAttr = textEl.getAttribute('transform')
    const rot = parseRotateTransform(transformAttr)

    // Measure the glyph bounding box to center it at (cx, cy)
    const tmpPath = font.getPath(content, 0, 0, fontSize)
    const bb = tmpPath.getBoundingBox()
    if (bb.x1 === bb.x2 || bb.y1 === bb.y2) continue

    const startX = cx - (bb.x1 + bb.x2) / 2
    const startY = cy - (bb.y1 + bb.y2) / 2

    const glyphPath = font.getPath(content, startX, startY, fontSize)
    const rings = opentypePathToRings(glyphPath)

    for (const ring of rings) {
      let worldRing = svgRingToWorld(ring, W, H)
      if (rot) {
        // Rotation pivot in world space
        const [pivotX, pivotY] = svgRingToWorld([[rot.cx, rot.cy]], W, H)[0]
        worldRing = rotateRing(worldRing, rot.deg, pivotX, pivotY)
      }
      tris.push(...extrudePolygon(worldRing, [], Z0, Z1))
    }
  }

  return tris
}

// ── 3MF XML builder ───────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(4)

function buildObjectXml(id: number, tris: number[]): string {
  const triCount = tris.length / 9
  let vertsXml = ''
  let trisXml = ''

  for (let i = 0; i < triCount; i++) {
    const b = i * 9
    for (let v = 0; v < 3; v++) {
      const vb = b + v * 3
      vertsXml += `        <vertex x="${fmt(tris[vb])}" y="${fmt(tris[vb + 1])}" z="${fmt(tris[vb + 2])}" />\n`
    }
    trisXml += `        <triangle v1="${i * 3}" v2="${i * 3 + 1}" v3="${i * 3 + 2}" />\n`
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

function build3mfModel(plateTris: number[], iconTris: number[]): string {
  const objects: string[] = [buildObjectXml(1, plateTris)]
  const buildItems = ['    <item objectid="1" />']

  if (iconTris.length > 0) {
    objects.push(buildObjectXml(2, iconTris))
    buildItems.push('    <item objectid="2" />')
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join('\n')}
  </resources>
  <build>
${buildItems.join('\n')}
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

    const modelXml = build3mfModel(plateTris, iconTris)

    const zipped = fflate.zipSync({
      '[Content_Types].xml': enc.encode(contentTypes),
      '_rels/.rels': enc.encode(rels),
      '3D/3dmodel.model': enc.encode(modelXml),
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
