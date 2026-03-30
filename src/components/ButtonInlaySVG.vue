<script setup lang="ts">
/**
 * ButtonInlaySVG — renders a single Somrig button inlay as an SVG.
 *
 * Physical dimensions (extracted from Aasikki PDF template):
 *   Outer shape: 41.2mm × 71.9mm
 *   Horizontal divider: y = 36.0mm
 *   Vertical center: x = 20.2mm
 *   Dot indicator: 1.5mm diameter circle
 *   Dash indicator: 4.5mm × 1.5mm rounded rect
 */

export type ZoneCount = 1 | 2 | 3
export type IndicatorType = 'dot' | 'double-dot' | 'dash' | 'none'

export interface ZoneConfig {
  /** MDI icon path string (from @mdi/js) */
  icon?: string
  /** Action type indicator shown at bottom of zone */
  indicator?: IndicatorType
}

const props = withDefaults(defineProps<{
  /** Number of zones: 1 = full, 2 = split in half, 3 = split in thirds */
  zones?: ZoneCount
  /** Per-zone config (index 0 = first zone from left) */
  zoneConfig?: ZoneConfig[]
  /** Stroke color for outlines/dividers */
  strokeColor?: string
  /** Fill color for the inlay background */
  fillColor?: string
  /** Icon fill color */
  iconColor?: string
  /** Scale factor applied to the viewBox (1 = 1px per mm) */
  scale?: number
}>(), {
  zones: 1,
  zoneConfig: () => [],
  strokeColor: '#000000',
  fillColor: '#ffffff',
  iconColor: '#000000',
  scale: 1,
})

// ── Physical dimensions (mm) ─────────────────────────────────────────────────
const W = 41.2
const H = 71.9
const DIVIDER_Y = 36.0
const CENTER_X = 20.2

// Indicator dimensions (mm)
const DOT_R = 0.75          // radius = diameter/2
const DASH_W = 4.5
const DASH_H = 1.5
const DASH_R = DASH_H / 2   // fully rounded ends
const INDICATOR_MARGIN_BOTTOM = 3.5  // mm from bottom of zone to indicator center

// Icon size (mm) inscribed in each zone — slightly smaller than zone width
const ICON_SIZE = 12  // mm — MDI icons are 24×24 user units, scaled to this

// Exact outline path extracted from template PDF (mm units, origin 0,0)
const OUTLINE_PATH =
  'M 20.59 0.09 C 27.92 0.09 30.72 0.74 30.72 0.74 C 30.72 0.74 33.07 1.03 35.15 2.67 ' +
  'C 37.24 4.32 39.12 5.81 39.96 11.66 C 40.81 17.51 41.09 35.97 41.09 35.97 ' +
  'C 41.09 35.97 40.81 54.43 39.96 60.27 C 39.12 66.12 37.24 67.61 35.15 69.26 ' +
  'C 33.07 70.91 30.72 71.19 30.72 71.19 C 30.72 71.19 27.92 71.84 20.59 71.84 ' +
  'C 13.26 71.84 10.45 71.19 10.45 71.19 C 10.45 71.19 8.11 70.91 6.02 69.26 ' +
  'C 3.94 67.61 2.06 66.12 1.22 60.27 C 0.37 54.43 0.09 35.97 0.09 35.97 ' +
  'C 0.09 35.97 0.37 17.51 1.22 11.66 C 2.06 5.81 3.94 4.32 6.02 2.67 ' +
  'C 8.11 1.03 10.45 0.74 10.45 0.74 C 10.45 0.74 13.26 0.09 20.59 0.09 Z'

// Unique clip-path ID (needed when multiple instances on same page)
const uid = Math.random().toString(36).slice(2, 8)
const clipId = `inlay-clip-${uid}`

// ── Zone geometry ─────────────────────────────────────────────────────────────
interface Zone {
  x: number   // left edge (mm)
  y: number   // top edge (mm)
  w: number   // width (mm)
  h: number   // height (mm)
  cx: number  // center x
  cy: number  // center y
}

function computeZones(): Zone[] {
  // Each physical button has a top half and bottom half split by DIVIDER_Y.
  // The issue calls the split sections "halves" and zones are subdivisions of
  // the top half.  For simplicity we treat the whole height and split the
  // width within each of top and bottom halves identically.
  //
  // Per the issue description:
  //   1 zone  — full width, single action indicator
  //   2 zones — split at CENTER_X
  //   3 zones — split into thirds
  //
  // We apply the same vertical division to both top and bottom halves so icons
  // and indicators align.

  const topH = DIVIDER_Y          // 0 → 36
  const botH = H - DIVIDER_Y      // 36 → 71.9

  if (props.zones === 1) {
    return [
      { x: 0, y: 0,        w: W, h: topH, cx: W / 2, cy: topH / 2 },
      { x: 0, y: DIVIDER_Y, w: W, h: botH, cx: W / 2, cy: DIVIDER_Y + botH / 2 },
    ]
  }

  if (props.zones === 2) {
    const lw = CENTER_X
    const rw = W - CENTER_X
    return [
      { x: 0,   y: 0,         w: lw, h: topH, cx: lw / 2,       cy: topH / 2 },
      { x: lw,  y: 0,         w: rw, h: topH, cx: lw + rw / 2,  cy: topH / 2 },
      { x: 0,   y: DIVIDER_Y, w: lw, h: botH, cx: lw / 2,       cy: DIVIDER_Y + botH / 2 },
      { x: lw,  y: DIVIDER_Y, w: rw, h: botH, cx: lw + rw / 2,  cy: DIVIDER_Y + botH / 2 },
    ]
  }

  // 3 zones — split into thirds by width
  const zw = W / 3
  const zones: Zone[] = []
  for (let row = 0; row < 2; row++) {
    const zy = row === 0 ? 0 : DIVIDER_Y
    const zh = row === 0 ? topH : botH
    for (let col = 0; col < 3; col++) {
      zones.push({
        x: col * zw,
        y: zy,
        w: zw,
        h: zh,
        cx: col * zw + zw / 2,
        cy: zy + zh / 2,
      })
    }
  }
  return zones
}

const allZones = computeZones()

// For icons/indicators we only need the top-row zones (indices 0..zones-1)
// Bottom-row zones mirror the same columns but may have their own config later.
const topZones = allZones.slice(0, props.zones)
const botZones = allZones.slice(props.zones)

function getConfig(zoneIndex: number): ZoneConfig {
  return props.zoneConfig[zoneIndex] ?? {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** cx,cy = center of indicator in mm */
function indicatorCY(zone: Zone): number {
  return zone.y + zone.h - INDICATOR_MARGIN_BOTTOM
}

/** SVG transform to center a 24×24 MDI icon path at (cx, cy) scaled to ICON_SIZE mm */
function iconTransform(cx: number, cy: number): string {
  const s = ICON_SIZE / 24
  const tx = cx - (24 * s) / 2
  const ty = cy - (24 * s) / 2
  return `translate(${tx},${ty}) scale(${s})`
}

// Vertical divider X positions (within top + bottom half)
const verticalDividers: number[] = (() => {
  if (props.zones === 1) return []
  if (props.zones === 2) return [CENTER_X]
  return [W / 3, (W / 3) * 2]
})()
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    :width="`${W * scale}mm`"
    :height="`${H * scale}mm`"
    xmlns="http://www.w3.org/2000/svg"
    overflow="visible"
  >
    <defs>
      <!-- Clip to the physical button outline -->
      <clipPath :id="clipId">
        <path :d="OUTLINE_PATH" />
      </clipPath>
    </defs>

    <!-- Background fill clipped to outline shape -->
    <path
      :d="OUTLINE_PATH"
      :fill="fillColor"
      :stroke="strokeColor"
      stroke-width="0.3"
    />

    <!-- Content group clipped to outline -->
    <g :clip-path="`url(#${clipId})`">

      <!-- Horizontal divider -->
      <line
        x1="0" :y1="DIVIDER_Y"
        :x2="W" :y2="DIVIDER_Y"
        :stroke="strokeColor"
        stroke-width="0.3"
      />

      <!-- Vertical dividers (same lines span full height) -->
      <line
        v-for="vx in verticalDividers"
        :key="vx"
        :x1="vx" y1="0"
        :x2="vx" :y2="H"
        :stroke="strokeColor"
        stroke-width="0.3"
      />

      <!-- Top-half zones: icon + indicator -->
      <g v-for="(zone, i) in topZones" :key="`top-${i}`">
        <!-- MDI Icon -->
        <g
          v-if="getConfig(i).icon"
          :transform="iconTransform(zone.cx, zone.cy)"
          :fill="iconColor"
        >
          <path :d="getConfig(i).icon" />
        </g>

        <!-- Indicator: dot -->
        <circle
          v-if="getConfig(i).indicator === 'dot'"
          :cx="zone.cx"
          :cy="indicatorCY(zone)"
          :r="DOT_R"
          :fill="iconColor"
        />

        <!-- Indicator: double-dot -->
        <g v-else-if="getConfig(i).indicator === 'double-dot'">
          <circle
            :cx="zone.cx - DOT_R * 2"
            :cy="indicatorCY(zone)"
            :r="DOT_R"
            :fill="iconColor"
          />
          <circle
            :cx="zone.cx + DOT_R * 2"
            :cy="indicatorCY(zone)"
            :r="DOT_R"
            :fill="iconColor"
          />
        </g>

        <!-- Indicator: dash -->
        <rect
          v-else-if="getConfig(i).indicator === 'dash'"
          :x="zone.cx - DASH_W / 2"
          :y="indicatorCY(zone) - DASH_H / 2"
          :width="DASH_W"
          :height="DASH_H"
          :rx="DASH_R"
          :ry="DASH_R"
          :fill="iconColor"
        />
      </g>

      <!-- Bottom-half zones: icon + indicator (same column config as top) -->
      <g v-for="(zone, i) in botZones" :key="`bot-${i}`">
        <!-- MDI Icon -->
        <g
          v-if="getConfig(i).icon"
          :transform="iconTransform(zone.cx, zone.cy)"
          :fill="iconColor"
        >
          <path :d="getConfig(i).icon" />
        </g>

        <!-- Indicator: dot -->
        <circle
          v-if="getConfig(i).indicator === 'dot'"
          :cx="zone.cx"
          :cy="indicatorCY(zone)"
          :r="DOT_R"
          :fill="iconColor"
        />

        <!-- Indicator: double-dot -->
        <g v-else-if="getConfig(i).indicator === 'double-dot'">
          <circle
            :cx="zone.cx - DOT_R * 2"
            :cy="indicatorCY(zone)"
            :r="DOT_R"
            :fill="iconColor"
          />
          <circle
            :cx="zone.cx + DOT_R * 2"
            :cy="indicatorCY(zone)"
            :r="DOT_R"
            :fill="iconColor"
          />
        </g>

        <!-- Indicator: dash -->
        <rect
          v-else-if="getConfig(i).indicator === 'dash'"
          :x="zone.cx - DASH_W / 2"
          :y="indicatorCY(zone) - DASH_H / 2"
          :width="DASH_W"
          :height="DASH_H"
          :rx="DASH_R"
          :ry="DASH_R"
          :fill="iconColor"
        />
      </g>

    </g>
  </svg>
</template>
