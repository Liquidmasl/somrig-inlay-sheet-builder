<script setup lang="ts">
import { computed } from 'vue'
/**
 * ButtonInlaySVG — renders a single Somrig button inlay as an SVG.
 *
 * Physical dimensions (extracted from Aasikki PDF template):
 *   Outer shape: 41.2mm × 71.9mm
 *   Horizontal divider: y = 36.0mm
 *   Vertical center: x = 20.2mm
 *   Dot indicator: 1.5mm diameter circle
 *   Dash indicator: 4.5mm × 1.5mm rounded rect
 *
 * Each button has a top half and a bottom half, each independently configurable:
 *   - topZones / botZones: number of zones (1, 2, or 3) for that half
 *   - topZoneConfig / botZoneConfig: per-zone icon + indicator config
 *
 * Each function kind (single=dot, long=dash, double=double-dot) should appear
 * at most once per half — this is a design constraint enforced by the caller.
 */

export type ZoneCount = 1 | 2 | 3
export type IndicatorType = 'dot' | 'double-dot' | 'dash' | 'none'

export interface ZoneConfig {
  /** MDI icon path string (from @mdi/js) */
  icon?: string
  /** Action type indicator shown at bottom of zone */
  indicator?: IndicatorType
  /** Icon size in mm — overrides component-level ICON_SIZE */
  iconSize?: number
  /** Icon color — overrides component-level iconColor prop */
  iconColor?: string
  /** Icon rotation in degrees clockwise, default 0, applied after scaling */
  iconRotation?: number
  /** Label text */
  label?: string
  /** Label font size in mm, default 3 */
  labelSize?: number
  /** Label color — defaults to iconColor at render time */
  labelColor?: string
  /** Label rotation in degrees, independent of iconRotation, default 0 */
  labelRotation?: number
  /** Label position relative to icon: 'below' (default) or 'above'. Ignored when no icon. */
  labelPosition?: 'below' | 'above'
  /** Shift icon toward opposite edge to share zone space with label, default false */
  labelShiftIcon?: boolean
}

export interface SeparatorStyleProp {
  thickness?: number
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
}

const props = withDefaults(
  defineProps<{
    /** Number of zones in the top half: 1 = full, 2 = split, 3 = thirds */
    topZones?: ZoneCount
    /** Number of zones in the bottom half: 1 = full, 2 = split, 3 = thirds */
    botZones?: ZoneCount
    /** Per-zone config for top half (index 0 = first zone from left) */
    topZoneConfig?: ZoneConfig[]
    /** Per-zone config for bottom half (index 0 = first zone from left) */
    botZoneConfig?: ZoneConfig[]
    /** Indicator position for top half: 'inner' = near divider, 'outer' = near edge */
    topIndicatorPos?: 'inner' | 'outer'
    /** Indicator position for bottom half: 'inner' = near divider, 'outer' = near edge */
    botIndicatorPos?: 'inner' | 'outer'
    /** Horizontal separator style (divider between top and bottom) */
    horizontalSeparator?: SeparatorStyleProp
    /** Vertical separator style (zone dividers) */
    verticalSeparator?: SeparatorStyleProp
    /** Stroke color for outlines/dividers */
    strokeColor?: string
    /** Fill color for the inlay background */
    fillColor?: string
    /** Icon fill color */
    iconColor?: string
    /** Scale factor applied to the viewBox (1 = 1px per mm) */
    scale?: number
  }>(),
  {
    topZones: 1,
    botZones: 1,
    topZoneConfig: () => [],
    botZoneConfig: () => [],
    topIndicatorPos: 'inner',
    botIndicatorPos: 'inner',
    horizontalSeparator: () => ({
      thickness: 0.3,
      color: '#000000',
      style: 'solid' as const,
    }),
    verticalSeparator: () => ({
      thickness: 0.3,
      color: '#000000',
      style: 'solid' as const,
    }),
    strokeColor: '#000000',
    fillColor: '#ffffff',
    iconColor: '#000000',
    scale: 1,
  },
)

/** Convert line style to stroke-dasharray value */
function getDashArray(
  style: 'solid' | 'dashed' | 'dotted' | undefined,
  thickness: number,
): string | undefined {
  if (!style || style === 'solid') return undefined
  if (style === 'dashed') return `${thickness * 4} ${thickness * 2}`
  if (style === 'dotted') return `${thickness} ${thickness * 2}`
  return undefined
}

// ── Physical dimensions (mm) ─────────────────────────────────────────────────
const W = 41.2
const H = 71.9
const DIVIDER_Y = 36.0
const CENTER_X = 20.2

// Indicator dimensions (mm)
const DOT_R = 0.75 // radius = diameter/2
const DASH_W = 4.5
const DASH_H = 1.5
const DASH_R = DASH_H / 2 // fully rounded ends
const INDICATOR_MARGIN_BOTTOM = 3.5 // mm from bottom of zone to indicator center

// Icon size (mm) inscribed in each zone — slightly smaller than zone width
const ICON_SIZE = 12 // mm — MDI icons are 24×24 user units, scaled to this

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
  x: number // left edge (mm)
  y: number // top edge (mm)
  w: number // width (mm)
  h: number // height (mm)
  cx: number // center x
  cy: number // center y
}

function computeHalfZones(
  count: ZoneCount,
  yStart: number,
  height: number,
): Zone[] {
  if (count === 1) {
    return [
      { x: 0, y: yStart, w: W, h: height, cx: W / 2, cy: yStart + height / 2 },
    ]
  }
  if (count === 2) {
    const lw = CENTER_X
    const rw = W - CENTER_X
    return [
      {
        x: 0,
        y: yStart,
        w: lw,
        h: height,
        cx: lw / 2,
        cy: yStart + height / 2,
      },
      {
        x: lw,
        y: yStart,
        w: rw,
        h: height,
        cx: lw + rw / 2,
        cy: yStart + height / 2,
      },
    ]
  }
  // 3 zones — split into thirds
  const zw = W / 3
  return [0, 1, 2].map((col) => ({
    x: col * zw,
    y: yStart,
    w: zw,
    h: height,
    cx: col * zw + zw / 2,
    cy: yStart + height / 2,
  }))
}

const topH = DIVIDER_Y // 0 → 36
const botH = H - DIVIDER_Y // 36 → 71.9

const topZoneList = computed(() => computeHalfZones(props.topZones, 0, topH))
const botZoneList = computed(() =>
  computeHalfZones(props.botZones, DIVIDER_Y, botH),
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * cy for the indicator in a zone
 * @param zone - The zone geometry
 * @param half - 'top' or 'bottom' half of the button
 * @param position - 'inner' (near divider) or 'outer' (near edge)
 */
function indicatorCY(
  zone: Zone,
  half: 'top' | 'bottom',
  position: 'inner' | 'outer',
): number {
  // Inner = towards the horizontal divider, Outer = towards the button edge
  const atBottom =
    (half === 'top' && position === 'inner') ||
    (half === 'bottom' && position === 'outer')
  if (atBottom) {
    return zone.y + zone.h - INDICATOR_MARGIN_BOTTOM
  } else {
    return zone.y + INDICATOR_MARGIN_BOTTOM
  }
}

/** SVG transform to center a 24×24 MDI icon path at (cx, cy) scaled to given size (mm) */
function iconTransform(
  cx: number,
  cy: number,
  sizeMm?: number,
  rotation?: number,
): string {
  const s = (sizeMm ?? ICON_SIZE) / 24
  const tx = cx - (24 * s) / 2
  const ty = cy - (24 * s) / 2
  const rot = rotation ?? 0
  return `translate(${tx},${ty}) scale(${s}) rotate(${rot},12,12)`
}

/** Vertical divider X positions for a given zone count */
function vertDividers(count: ZoneCount): number[] {
  if (count === 1) return []
  if (count === 2) return [CENTER_X]
  return [W / 3, (W / 3) * 2]
}

const topDividers = computed(() => vertDividers(props.topZones))
const botDividers = computed(() => vertDividers(props.botZones))

// ── Label layout helpers ──────────────────────────────────────────────────────

const LABEL_GAP = 1 // mm gap between icon edge and label center

/**
 * Compute the Y center for the icon, shifted when labelShiftIcon is enabled.
 * When no label or labelShiftIcon is false, icon stays at zone.cy.
 */
function computeIconCY(zone: Zone, cfg: ZoneConfig): number {
  if (!cfg.label || !cfg.labelShiftIcon) return zone.cy
  const labelSize = cfg.labelSize ?? 3
  const pos = cfg.labelPosition ?? 'below'
  const shift = (LABEL_GAP + labelSize) / 2
  return pos === 'below' ? zone.cy - shift : zone.cy + shift
}

/**
 * Rotate point (x, y) around (cx, cy) by deg degrees clockwise (SVG convention).
 */
function rotatePoint(x: number, y: number, cx: number, cy: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]
}

/**
 * Final render center for the icon.
 * When labelShiftIcon + labelRotation, the icon's *position* is rotated around
 * zone center so it stays in the "above/below" relationship with the label in the
 * rotated frame — without affecting the icon's own visual orientation.
 */
function iconRenderCenter(zone: Zone, cfg: ZoneConfig): [number, number] {
  const baseCY = computeIconCY(zone, cfg)
  if (!cfg.label || !cfg.labelShiftIcon || !cfg.labelRotation) return [zone.cx, baseCY]
  return rotatePoint(zone.cx, baseCY, zone.cx, zone.cy, cfg.labelRotation)
}

/**
 * Compute the Y center for the label text.
 * - No icon: centered at zone.cy
 * - Icon present, labelShiftIcon false: placed at icon edge + gap
 * - Icon present, labelShiftIcon true: shifted symmetrically with icon
 */
function computeLabelY(zone: Zone, cfg: ZoneConfig): number {
  const labelSize = cfg.labelSize ?? 3
  const iconSize = cfg.iconSize ?? ICON_SIZE
  const pos = cfg.labelPosition ?? 'below'
  const hasIcon = !!cfg.icon

  if (!hasIcon) return zone.cy

  if (!cfg.labelShiftIcon) {
    const offset = iconSize / 2 + LABEL_GAP + labelSize / 2
    return pos === 'below' ? zone.cy + offset : zone.cy - offset
  }

  const shift = (iconSize + LABEL_GAP) / 2
  return pos === 'below' ? zone.cy + shift : zone.cy - shift
}
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
        :stroke="horizontalSeparator?.color ?? strokeColor"
        :stroke-width="horizontalSeparator?.thickness ?? 0.3"
        :stroke-dasharray="getDashArray(horizontalSeparator?.style, horizontalSeparator?.thickness ?? 0.3)"
      />

      <!-- Top-half vertical dividers (span top half only) -->
      <line
        v-for="vx in topDividers"
        :key="`top-vdiv-${vx}`"
        :x1="vx" y1="0"
        :x2="vx" :y2="DIVIDER_Y"
        :stroke="verticalSeparator?.color ?? strokeColor"
        :stroke-width="verticalSeparator?.thickness ?? 0.3"
        :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
      />

      <!-- Bottom-half vertical dividers (span bottom half only) -->
      <line
        v-for="vx in botDividers"
        :key="`bot-vdiv-${vx}`"
        :x1="vx" :y1="DIVIDER_Y"
        :x2="vx" :y2="H"
        :stroke="verticalSeparator?.color ?? strokeColor"
        :stroke-width="verticalSeparator?.thickness ?? 0.3"
        :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
      />

      <!-- Top-half zones: icon + label + indicator -->
      <g v-for="(zone, i) in topZoneList" :key="`top-${i}`">
        <!-- MDI Icon: position computed via iconRenderCenter so the shift is in the rotated frame without spinning the icon visually -->
        <g
          v-if="topZoneConfig[i]?.icon"
          :transform="iconTransform(iconRenderCenter(zone, topZoneConfig[i])[0], iconRenderCenter(zone, topZoneConfig[i])[1], topZoneConfig[i].iconSize, topZoneConfig[i].iconRotation)"
          :fill="topZoneConfig[i].iconColor ?? iconColor"
        >
          <path :d="topZoneConfig[i].icon" />
        </g>

        <!-- Label text -->
        <text
          v-if="topZoneConfig[i]?.label"
          :x="zone.cx"
          :y="computeLabelY(zone, topZoneConfig[i])"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="topZoneConfig[i].labelSize ?? 3"
          :fill="topZoneConfig[i].labelColor ?? topZoneConfig[i].iconColor ?? iconColor"
          :transform="topZoneConfig[i].labelRotation
            ? `rotate(${topZoneConfig[i].labelRotation},${zone.cx},${zone.cy})`
            : undefined"
        >{{ topZoneConfig[i].label }}</text>

        <!-- Indicator: dot -->
        <circle
          v-if="topZoneConfig[i]?.indicator === 'dot'"
          :cx="zone.cx"
          :cy="indicatorCY(zone, 'top', topIndicatorPos)"
          :r="DOT_R"
          :fill="iconColor"
        />

        <!-- Indicator: double-dot -->
        <g v-else-if="topZoneConfig[i]?.indicator === 'double-dot'">
          <circle
            :cx="zone.cx - DOT_R * 2"
            :cy="indicatorCY(zone, 'top', topIndicatorPos)"
            :r="DOT_R"
            :fill="iconColor"
          />
          <circle
            :cx="zone.cx + DOT_R * 2"
            :cy="indicatorCY(zone, 'top', topIndicatorPos)"
            :r="DOT_R"
            :fill="iconColor"
          />
        </g>

        <!-- Indicator: dash -->
        <rect
          v-else-if="topZoneConfig[i]?.indicator === 'dash'"
          :x="zone.cx - DASH_W / 2"
          :y="indicatorCY(zone, 'top', topIndicatorPos) - DASH_H / 2"
          :width="DASH_W"
          :height="DASH_H"
          :rx="DASH_R"
          :ry="DASH_R"
          :fill="iconColor"
        />
      </g>

      <!-- Bottom-half zones: icon + label + indicator -->
      <g v-for="(zone, i) in botZoneList" :key="`bot-${i}`">
        <!-- MDI Icon: position computed via iconRenderCenter so the shift is in the rotated frame without spinning the icon visually -->
        <g
          v-if="botZoneConfig[i]?.icon"
          :transform="iconTransform(iconRenderCenter(zone, botZoneConfig[i])[0], iconRenderCenter(zone, botZoneConfig[i])[1], botZoneConfig[i].iconSize, botZoneConfig[i].iconRotation)"
          :fill="botZoneConfig[i].iconColor ?? iconColor"
        >
          <path :d="botZoneConfig[i].icon" />
        </g>

        <!-- Label text -->
        <text
          v-if="botZoneConfig[i]?.label"
          :x="zone.cx"
          :y="computeLabelY(zone, botZoneConfig[i])"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="botZoneConfig[i].labelSize ?? 3"
          :fill="botZoneConfig[i].labelColor ?? botZoneConfig[i].iconColor ?? iconColor"
          :transform="botZoneConfig[i].labelRotation
            ? `rotate(${botZoneConfig[i].labelRotation},${zone.cx},${zone.cy})`
            : undefined"
        >{{ botZoneConfig[i].label }}</text>

        <!-- Indicator: dot -->
        <circle
          v-if="botZoneConfig[i]?.indicator === 'dot'"
          :cx="zone.cx"
          :cy="indicatorCY(zone, 'bottom', botIndicatorPos)"
          :r="DOT_R"
          :fill="iconColor"
        />

        <!-- Indicator: double-dot -->
        <g v-else-if="botZoneConfig[i]?.indicator === 'double-dot'">
          <circle
            :cx="zone.cx - DOT_R * 2"
            :cy="indicatorCY(zone, 'bottom', botIndicatorPos)"
            :r="DOT_R"
            :fill="iconColor"
          />
          <circle
            :cx="zone.cx + DOT_R * 2"
            :cy="indicatorCY(zone, 'bottom', botIndicatorPos)"
            :r="DOT_R"
            :fill="iconColor"
          />
        </g>

        <!-- Indicator: dash -->
        <rect
          v-else-if="botZoneConfig[i]?.indicator === 'dash'"
          :x="zone.cx - DASH_W / 2"
          :y="indicatorCY(zone, 'bottom', botIndicatorPos) - DASH_H / 2"
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
