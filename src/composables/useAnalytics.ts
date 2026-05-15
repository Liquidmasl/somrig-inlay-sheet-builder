import type { Sheet } from '../types'

function sheetStats(sheet: Sheet) {
  const buttons = sheet.buttons
  let hasLabel = false
  let hasIcon = false
  let hasInner = false
  let hasOuter = false
  const topZones: number[] = []
  const bottomZones: number[] = []

  for (const btn of buttons) {
    topZones.push(btn.top.zones.length)
    bottomZones.push(btn.bottom.zones.length)
    if (
      btn.top.indicatorPosition === 'inner' ||
      btn.bottom.indicatorPosition === 'inner'
    )
      hasInner = true
    if (
      btn.top.indicatorPosition === 'outer' ||
      btn.bottom.indicatorPosition === 'outer'
    )
      hasOuter = true
    for (const zone of [...btn.top.zones, ...btn.bottom.zones]) {
      if (zone.label) hasLabel = true
      if (zone.icon) hasIcon = true
    }
  }

  const indicator =
    hasInner && hasOuter ? 'mixed' : hasInner ? 'inner' : 'outer'

  return {
    button_count: buttons.length,
    button_type: sheet.buttonType,
    top_zones: topZones.join(','),
    bottom_zones: bottomZones.join(','),
    indicator,
    has_labels: hasLabel,
    has_icons: hasIcon,
  }
}

export function useAnalytics() {
  function track(event: string, data?: Record<string, unknown>) {
    window.umami?.track(event, data)
  }

  function trackSheetEvent(event: string, sheet: Sheet) {
    track(event, sheetStats(sheet))
  }

  return { track, trackSheetEvent }
}
