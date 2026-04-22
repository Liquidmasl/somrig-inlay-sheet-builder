<script setup lang="ts">
import { computed } from 'vue'
/**
 * ButtonInlaySVG — renders a button inlay as an SVG.
 *
 * Supports two button types via the `buttonType` prop:
 *
 * 'somrig'  (default) — portrait 41.2 × 71.9 mm, horizontal divider at y=36mm.
 *   Physical dimensions from Aasikki PDF template. Zones split left/right within
 *   each top/bottom half.
 *
 * 'bilresa' — landscape 63.3 × 36.3 mm, vertical divider at x=31.65mm (centre).
 *   Stadium outline (fully-rounded rectangle, r=18.15mm). Zones split top/bottom
 *   within each left/right half. 'top' prop/half = left; 'bottom' = right.
 *
 * Indicators (dot/dash/double-dot) are positioned near the inner or outer edge
 * of each half, axis-correct for the button orientation.
 */

export type ZoneCount = 1 | 2 | 3
export type IndicatorType = 'dot' | 'double-dot' | 'dash' | 'none'
export type ButtonType = 'somrig' | 'bilresa'

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
    /** Button model — controls shape, dimensions and layout orientation */
    buttonType?: ButtonType
    /** Number of zones in the top/left half: 1 = full, 2 = split, 3 = thirds */
    topZones?: ZoneCount
    /** Number of zones in the bottom/right half: 1 = full, 2 = split, 3 = thirds */
    botZones?: ZoneCount
    /** Per-zone config for top/left half (index 0 = first zone) */
    topZoneConfig?: ZoneConfig[]
    /** Per-zone config for bottom/right half (index 0 = first zone) */
    botZoneConfig?: ZoneConfig[]
    /** Indicator position for top/left half: 'inner' = near divider, 'outer' = near edge */
    topIndicatorPos?: 'inner' | 'outer'
    /** Indicator position for bottom/right half: 'inner' = near divider, 'outer' = near edge */
    botIndicatorPos?: 'inner' | 'outer'
    /** Separator style between the two halves */
    horizontalSeparator?: SeparatorStyleProp
    /** Zone sub-divider style */
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
    buttonType: 'somrig',
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

// ── Button geometry configs ───────────────────────────────────────────────────

interface ButtonConfig {
  W: number
  H: number
  outlinePath: string
  /** 'portrait'  → halves are top/bottom, divided by a horizontal line at dividerPos (Y).
   *               Zones within each half split left/right using zoneCenter (X).
   *  'landscape' → halves are left/right, divided by a vertical line at dividerPos (X).
   *               Zones within each half split top/bottom using zoneCenter (Y). */
  layout: 'portrait' | 'landscape'
  dividerPos: number // Y for portrait, X for landscape
  zoneCenter: number // X for portrait (left/right zone split), Y for landscape (top/bottom zone split)
}

const SOMRIG_OUTLINE =
  'M 20.59 0.09 C 27.92 0.09 30.72 0.74 30.72 0.74 C 30.72 0.74 33.07 1.03 35.15 2.67 ' +
  'C 37.24 4.32 39.12 5.81 39.96 11.66 C 40.81 17.51 41.09 35.97 41.09 35.97 ' +
  'C 41.09 35.97 40.81 54.43 39.96 60.27 C 39.12 66.12 37.24 67.61 35.15 69.26 ' +
  'C 33.07 70.91 30.72 71.19 30.72 71.19 C 30.72 71.19 27.92 71.84 20.59 71.84 ' +
  'C 13.26 71.84 10.45 71.19 10.45 71.19 C 10.45 71.19 8.11 70.91 6.02 69.26 ' +
  'C 3.94 67.61 2.06 66.12 1.22 60.27 C 0.37 54.43 0.09 35.97 0.09 35.97 ' +
  'C 0.09 35.97 0.37 17.51 1.22 11.66 C 2.06 5.81 3.94 4.32 6.02 2.67 ' +
  'C 8.11 1.03 10.45 0.74 10.45 0.74 C 10.45 0.74 13.26 0.09 20.59 0.09 Z'

// Vertical stadium outline: W=36.3, H=63.3, r=18.15 (= W/2 — fully rounded top/bottom)
// Top arc:    (0,18.15) → (36.3,18.15) sweep=1 clockwise → bulges upward    ✓
// Bottom arc: (36.3,45.15) → (0,45.15) sweep=1 clockwise → bulges downward  ✓
const BILRESA_OUTLINE =
  'M 0 18.15 A 18.15 18.15 0 0 1 36.3 18.15 L 36.3 45.15 A 18.15 18.15 0 0 1 0 45.15 Z'

const BUTTON_CONFIGS: Record<ButtonType, ButtonConfig> = {
  somrig: {
    W: 41.2,
    H: 71.9,
    outlinePath: SOMRIG_OUTLINE,
    layout: 'portrait',
    dividerPos: 36.0,
    zoneCenter: 20.2,
  },
  bilresa: {
    W: 36.3,
    H: 63.3,
    outlinePath: BILRESA_OUTLINE,
    layout: 'portrait',
    dividerPos: 31.65, // H / 2
    zoneCenter: 18.15, // W / 2
  },
}

const config = computed(() => BUTTON_CONFIGS[props.buttonType])

// ── Indicator + icon constants (mm) ──────────────────────────────────────────
const DOT_R = 0.75
const DASH_W = 4.5
const DASH_H = 1.5
const DASH_R = DASH_H / 2
const INDICATOR_MARGIN = 3.5 // mm from half-edge to indicator centre
const ICON_SIZE = 12 // default MDI icon size in mm

// Unique clip-path ID (needed when multiple instances on same page)
const uid = Math.random().toString(36).slice(2, 8)
const clipId = `inlay-clip-${uid}`

// ── Zone geometry ─────────────────────────────────────────────────────────────
interface Zone {
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

/**
 * Compute zones for one half of the button.
 *
 * Portrait  (Somrig):  halfStart = yStart, halfLength = half height.
 *                      Zones are vertical slices (different X, same Y span).
 * Landscape (BILRESA): halfStart = xStart, halfLength = half width.
 *                      Zones are horizontal slices (different Y, same X span).
 */
function computeHalfZones(
  count: ZoneCount,
  halfStart: number,
  halfLength: number,
): Zone[] {
  const cfg = config.value
  if (cfg.layout === 'portrait') {
    const yStart = halfStart
    const height = halfLength
    const { W, zoneCenter } = cfg
    if (count === 1) {
      return [
        {
          x: 0,
          y: yStart,
          w: W,
          h: height,
          cx: W / 2,
          cy: yStart + height / 2,
        },
      ]
    }
    if (count === 2) {
      const lw = zoneCenter
      const rw = W - zoneCenter
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
    const zw = W / 3
    return [0, 1, 2].map((col) => ({
      x: col * zw,
      y: yStart,
      w: zw,
      h: height,
      cx: col * zw + zw / 2,
      cy: yStart + height / 2,
    }))
  } else {
    const xStart = halfStart
    const width = halfLength
    const { H, zoneCenter } = cfg
    if (count === 1) {
      return [
        { x: xStart, y: 0, w: width, h: H, cx: xStart + width / 2, cy: H / 2 },
      ]
    }
    if (count === 2) {
      const th = zoneCenter
      const bh = H - zoneCenter
      return [
        {
          x: xStart,
          y: 0,
          w: width,
          h: th,
          cx: xStart + width / 2,
          cy: th / 2,
        },
        {
          x: xStart,
          y: th,
          w: width,
          h: bh,
          cx: xStart + width / 2,
          cy: th + bh / 2,
        },
      ]
    }
    const zh = H / 3
    return [0, 1, 2].map((row) => ({
      x: xStart,
      y: row * zh,
      w: width,
      h: zh,
      cx: xStart + width / 2,
      cy: row * zh + zh / 2,
    }))
  }
}

// Top half = left half for landscape
const topHalfLength = computed(() => config.value.dividerPos)
// Bottom half = right half for landscape; its start = dividerPos
const botHalfStart = computed(() => config.value.dividerPos)
const botHalfLength = computed(() => {
  const cfg = config.value
  return cfg.layout === 'portrait'
    ? cfg.H - cfg.dividerPos
    : cfg.W - cfg.dividerPos
})

const topZoneList = computed(() =>
  computeHalfZones(props.topZones, 0, topHalfLength.value),
)
const botZoneList = computed(() =>
  computeHalfZones(props.botZones, botHalfStart.value, botHalfLength.value),
)

// ── Sub-divider positions ─────────────────────────────────────────────────────

/**
 * Portrait:  returns X positions for vertical lines spanning the given half.
 * Landscape: returns Y positions for horizontal lines spanning the given half.
 */
function halfSubDividers(count: ZoneCount): number[] {
  const cfg = config.value
  if (count === 1) return []
  if (cfg.layout === 'portrait') {
    return count === 2 ? [cfg.zoneCenter] : [cfg.W / 3, (cfg.W / 3) * 2]
  } else {
    return count === 2 ? [cfg.zoneCenter] : [cfg.H / 3, (cfg.H / 3) * 2]
  }
}

const topSubDividers = computed(() => halfSubDividers(props.topZones))
const botSubDividers = computed(() => halfSubDividers(props.botZones))

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the {cx, cy} centre of an indicator for a zone.
 *
 * Portrait:  indicator moves along Y (near top or bottom edge of zone),
 *            centred on zone X.
 * Landscape: indicator moves along X (near left or right edge of zone),
 *            centred on zone Y.
 *
 * 'inner' means towards the centre divider; 'outer' means towards the
 * outer button edge.
 */
function indicatorPos(
  zone: Zone,
  half: 'top' | 'bottom',
  position: 'inner' | 'outer',
): { cx: number; cy: number } {
  const cfg = config.value
  if (cfg.layout === 'portrait') {
    const atBottom =
      (half === 'top' && position === 'inner') ||
      (half === 'bottom' && position === 'outer')
    return {
      cx: zone.cx,
      cy: atBottom
        ? zone.y + zone.h - INDICATOR_MARGIN
        : zone.y + INDICATOR_MARGIN,
    }
  } else {
    // Landscape: 'top' half = left half, inner = towards centre (right side)
    const atRight =
      (half === 'top' && position === 'inner') ||
      (half === 'bottom' && position === 'outer')
    return {
      cx: atRight
        ? zone.x + zone.w - INDICATOR_MARGIN
        : zone.x + INDICATOR_MARGIN,
      cy: zone.cy,
    }
  }
}

/**
 * Returns the two dot positions for a double-dot indicator.
 * Offset axis matches the button orientation so the dots sit side-by-side
 * along the same edge as a single dot would.
 */
function doubleDotPositions(
  zone: Zone,
  half: 'top' | 'bottom',
  position: 'inner' | 'outer',
): [{ cx: number; cy: number }, { cx: number; cy: number }] {
  const { cx, cy } = indicatorPos(zone, half, position)
  if (config.value.layout === 'portrait') {
    return [
      { cx: cx - DOT_R * 2, cy },
      { cx: cx + DOT_R * 2, cy },
    ]
  } else {
    return [
      { cx, cy: cy - DOT_R * 2 },
      { cx, cy: cy + DOT_R * 2 },
    ]
  }
}

/**
 * Returns x/y/width/height for the dash indicator rect.
 * In portrait the dash is horizontal; in landscape it is rotated 90° (vertical).
 */
function dashRect(
  zone: Zone,
  half: 'top' | 'bottom',
  position: 'inner' | 'outer',
): { x: number; y: number; width: number; height: number } {
  const { cx, cy } = indicatorPos(zone, half, position)
  if (config.value.layout === 'portrait') {
    return {
      x: cx - DASH_W / 2,
      y: cy - DASH_H / 2,
      width: DASH_W,
      height: DASH_H,
    }
  } else {
    return {
      x: cx - DASH_H / 2,
      y: cy - DASH_W / 2,
      width: DASH_H,
      height: DASH_W,
    }
  }
}

/** SVG transform to centre a 24×24 MDI icon path at (cx, cy) scaled to given size (mm) */
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
function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  deg: number,
): [number, number] {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return [
    cx + (x - cx) * cos - (y - cy) * sin,
    cy + (x - cx) * sin + (y - cy) * cos,
  ]
}

/**
 * Final render center for the icon.
 * When labelShiftIcon + labelRotation, the icon's *position* is rotated around
 * zone center so it stays in the "above/below" relationship with the label in the
 * rotated frame — without affecting the icon's own visual orientation.
 */
function iconRenderCenter(zone: Zone, cfg: ZoneConfig): [number, number] {
  const baseCY = computeIconCY(zone, cfg)
  if (!cfg.label || !cfg.labelShiftIcon || !cfg.labelRotation)
    return [zone.cx, baseCY]
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
    :viewBox="`0 0 ${config.W} ${config.H}`"
    :width="`${config.W * scale}mm`"
    :height="`${config.H * scale}mm`"
    xmlns="http://www.w3.org/2000/svg"
    overflow="visible"
  >
    <defs>
      <clipPath :id="clipId">
        <path :d="config.outlinePath" />
      </clipPath>
    </defs>

    <!-- Button outline + background -->
    <path
      :d="config.outlinePath"
      :fill="fillColor"
      :stroke="strokeColor"
      stroke-width="0.1"
      stroke-dasharray="0.1, 0.6"
    />

    <g :clip-path="`url(#${clipId})`">

      <!-- ── Centre divider ─────────────────────────────────────── -->
      <!-- Portrait: horizontal line -->
      <line
        v-if="config.layout === 'portrait'"
        x1="0" :y1="config.dividerPos"
        :x2="config.W" :y2="config.dividerPos"
        :stroke="horizontalSeparator?.color ?? strokeColor"
        :stroke-width="horizontalSeparator?.thickness ?? 0.3"
        :stroke-dasharray="getDashArray(horizontalSeparator?.style, horizontalSeparator?.thickness ?? 0.3)"
      />
      <!-- Landscape: vertical line -->
      <line
        v-else
        :x1="config.dividerPos" y1="0"
        :x2="config.dividerPos" :y2="config.H"
        :stroke="horizontalSeparator?.color ?? strokeColor"
        :stroke-width="horizontalSeparator?.thickness ?? 0.3"
        :stroke-dasharray="getDashArray(horizontalSeparator?.style, horizontalSeparator?.thickness ?? 0.3)"
      />

      <!-- ── Top/left-half zone sub-dividers ───────────────────── -->
      <template v-if="config.layout === 'portrait'">
        <!-- Vertical lines spanning the top half -->
        <line
          v-for="vx in topSubDividers"
          :key="`top-vdiv-${vx}`"
          :x1="vx" y1="0"
          :x2="vx" :y2="config.dividerPos"
          :stroke="verticalSeparator?.color ?? strokeColor"
          :stroke-width="verticalSeparator?.thickness ?? 0.3"
          :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
        />
      </template>
      <template v-else>
        <!-- Horizontal lines spanning the left half -->
        <line
          v-for="hy in topSubDividers"
          :key="`top-hdiv-${hy}`"
          x1="0" :y1="hy"
          :x2="config.dividerPos" :y2="hy"
          :stroke="verticalSeparator?.color ?? strokeColor"
          :stroke-width="verticalSeparator?.thickness ?? 0.3"
          :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
        />
      </template>

      <!-- ── Bottom/right-half zone sub-dividers ───────────────── -->
      <template v-if="config.layout === 'portrait'">
        <!-- Vertical lines spanning the bottom half -->
        <line
          v-for="vx in botSubDividers"
          :key="`bot-vdiv-${vx}`"
          :x1="vx" :y1="config.dividerPos"
          :x2="vx" :y2="config.H"
          :stroke="verticalSeparator?.color ?? strokeColor"
          :stroke-width="verticalSeparator?.thickness ?? 0.3"
          :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
        />
      </template>
      <template v-else>
        <!-- Horizontal lines spanning the right half -->
        <line
          v-for="hy in botSubDividers"
          :key="`bot-hdiv-${hy}`"
          :x1="config.dividerPos" :y1="hy"
          :x2="config.W" :y2="hy"
          :stroke="verticalSeparator?.color ?? strokeColor"
          :stroke-width="verticalSeparator?.thickness ?? 0.3"
          :stroke-dasharray="getDashArray(verticalSeparator?.style, verticalSeparator?.thickness ?? 0.3)"
        />
      </template>

      <!-- ── Top/left-half zones ───────────────────────────────── -->
      <g v-for="(zone, i) in topZoneList" :key="`top-${i}`">
        <g
          v-if="topZoneConfig[i]?.icon"
          :transform="iconTransform(iconRenderCenter(zone, topZoneConfig[i])[0], iconRenderCenter(zone, topZoneConfig[i])[1], topZoneConfig[i].iconSize, topZoneConfig[i].iconRotation)"
          :fill="topZoneConfig[i].iconColor ?? iconColor"
        >
          <path :d="topZoneConfig[i].icon" />
        </g>

        <text
          v-if="topZoneConfig[i]?.label"
          :x="zone.cx"
          :y="computeLabelY(zone, topZoneConfig[i])"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'DejaVu Sans', sans-serif"
          :font-size="topZoneConfig[i].labelSize ?? 3"
          :fill="topZoneConfig[i].labelColor ?? topZoneConfig[i].iconColor ?? iconColor"
          :transform="topZoneConfig[i].labelRotation
            ? `rotate(${topZoneConfig[i].labelRotation},${zone.cx},${zone.cy})`
            : undefined"
        >{{ topZoneConfig[i].label }}</text>

        <circle
          v-if="topZoneConfig[i]?.indicator === 'dot'"
          :cx="indicatorPos(zone, 'top', topIndicatorPos).cx"
          :cy="indicatorPos(zone, 'top', topIndicatorPos).cy"
          :r="DOT_R"
          :fill="iconColor"
        />
        <g v-else-if="topZoneConfig[i]?.indicator === 'double-dot'">
          <circle
            :cx="doubleDotPositions(zone, 'top', topIndicatorPos)[0].cx"
            :cy="doubleDotPositions(zone, 'top', topIndicatorPos)[0].cy"
            :r="DOT_R" :fill="iconColor"
          />
          <circle
            :cx="doubleDotPositions(zone, 'top', topIndicatorPos)[1].cx"
            :cy="doubleDotPositions(zone, 'top', topIndicatorPos)[1].cy"
            :r="DOT_R" :fill="iconColor"
          />
        </g>
        <rect
          v-else-if="topZoneConfig[i]?.indicator === 'dash'"
          :x="dashRect(zone, 'top', topIndicatorPos).x"
          :y="dashRect(zone, 'top', topIndicatorPos).y"
          :width="dashRect(zone, 'top', topIndicatorPos).width"
          :height="dashRect(zone, 'top', topIndicatorPos).height"
          :rx="DASH_R" :ry="DASH_R"
          :fill="iconColor"
        />
      </g>

      <!-- ── Bottom/right-half zones ───────────────────────────── -->
      <g v-for="(zone, i) in botZoneList" :key="`bot-${i}`">
        <g
          v-if="botZoneConfig[i]?.icon"
          :transform="iconTransform(iconRenderCenter(zone, botZoneConfig[i])[0], iconRenderCenter(zone, botZoneConfig[i])[1], botZoneConfig[i].iconSize, botZoneConfig[i].iconRotation)"
          :fill="botZoneConfig[i].iconColor ?? iconColor"
        >
          <path :d="botZoneConfig[i].icon" />
        </g>

        <text
          v-if="botZoneConfig[i]?.label"
          :x="zone.cx"
          :y="computeLabelY(zone, botZoneConfig[i])"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'DejaVu Sans', sans-serif"
          :font-size="botZoneConfig[i].labelSize ?? 3"
          :fill="botZoneConfig[i].labelColor ?? botZoneConfig[i].iconColor ?? iconColor"
          :transform="botZoneConfig[i].labelRotation
            ? `rotate(${botZoneConfig[i].labelRotation},${zone.cx},${zone.cy})`
            : undefined"
        >{{ botZoneConfig[i].label }}</text>

        <circle
          v-if="botZoneConfig[i]?.indicator === 'dot'"
          :cx="indicatorPos(zone, 'bottom', botIndicatorPos).cx"
          :cy="indicatorPos(zone, 'bottom', botIndicatorPos).cy"
          :r="DOT_R"
          :fill="iconColor"
        />
        <g v-else-if="botZoneConfig[i]?.indicator === 'double-dot'">
          <circle
            :cx="doubleDotPositions(zone, 'bottom', botIndicatorPos)[0].cx"
            :cy="doubleDotPositions(zone, 'bottom', botIndicatorPos)[0].cy"
            :r="DOT_R" :fill="iconColor"
          />
          <circle
            :cx="doubleDotPositions(zone, 'bottom', botIndicatorPos)[1].cx"
            :cy="doubleDotPositions(zone, 'bottom', botIndicatorPos)[1].cy"
            :r="DOT_R" :fill="iconColor"
          />
        </g>
        <rect
          v-else-if="botZoneConfig[i]?.indicator === 'dash'"
          :x="dashRect(zone, 'bottom', botIndicatorPos).x"
          :y="dashRect(zone, 'bottom', botIndicatorPos).y"
          :width="dashRect(zone, 'bottom', botIndicatorPos).width"
          :height="dashRect(zone, 'bottom', botIndicatorPos).height"
          :rx="DASH_R" :ry="DASH_R"
          :fill="iconColor"
        />
      </g>

    </g>
  </svg>
</template>
