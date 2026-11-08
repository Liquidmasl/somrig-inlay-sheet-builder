import { onMounted, onUnmounted, ref } from 'vue'
import type { ActionType, ActionZone, ButtonLayout } from '../types'
import { useAnalytics } from './useAnalytics'
import { isObject, useSheets } from './useSheets'

const HASH_PARAM = 'layout'
const FORMAT_VERSION = 1
const MAX_ZONES = 3
const ACTION_TYPES: ActionType[] = ['single', 'double', 'hold', 'none']

const isNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
const isString = (value: unknown) => typeof value === 'string'
const isColor = (value: unknown) =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

const ZONE_FIELDS: Record<keyof ActionZone, (value: unknown) => boolean> = {
  type: (value) => ACTION_TYPES.includes(value as ActionType),
  icon: (value) => value === null || isString(value),
  iconSize: isNumber,
  iconColor: isColor,
  iconRotation: isNumber,
  label: isString,
  labelSize: isNumber,
  labelColor: isColor,
  labelRotation: isNumber,
  labelPosition: (value) => value === 'below' || value === 'above',
  labelShiftIcon: (value) => typeof value === 'boolean',
}

function parseZone(value: unknown, where: string): Partial<ActionZone> {
  if (!isObject(value)) throw new Error(`${where} must be an object`)
  for (const [field, fieldValue] of Object.entries(value)) {
    if (!Object.hasOwn(ZONE_FIELDS, field))
      throw new Error(`${where} has unknown field "${field}"`)
    if (!ZONE_FIELDS[field as keyof ActionZone](fieldValue))
      throw new Error(`${where} has invalid ${field}`)
  }
  return value
}

function parseZones(value: unknown, where: string): Partial<ActionZone>[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_ZONES)
    throw new Error(`${where} needs 1 to ${MAX_ZONES} zones`)
  return value.map((zone, i) => parseZone(zone, `${where} zone ${i + 1}`))
}

function parseLayout(raw: string): ButtonLayout[] {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('it is not valid JSON')
  }
  if (!isObject(value) || value.v !== FORMAT_VERSION)
    throw new Error(`it must have "v": ${FORMAT_VERSION}`)
  const { buttons } = value
  if (!Array.isArray(buttons) || buttons.length === 0)
    throw new Error('it has no buttons')

  return buttons.map((button: unknown, i) => {
    const where = `button ${i + 1}`
    if (!isObject(button)) throw new Error(`${where} must be an object`)
    return {
      top: parseZones(button.top, `${where} top`),
      bottom: parseZones(button.bottom, `${where} bottom`),
    }
  })
}

/**
 * Picker display names ("Battery10", "Alpha A Box") and MDI names ("battery-10",
 * "alpha-a-box") only agree once separators and case are gone. This key is
 * unique across every icon in @mdi/js.
 */
function iconKey(name: string): string {
  return name
    .replace(/^mdi:/, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

/** Replaces MDI names with the SVG path data that `ActionZone.icon` stores. */
async function resolveIcons(buttons: ButtonLayout[]): Promise<void> {
  const zones = buttons.flatMap((button) => [...button.top, ...button.bottom])
  if (!zones.some((zone) => zone.icon)) return

  const { MDI_ALL_ICONS } = await import('../data/mdiAllIcons')
  const paths = new Map(
    MDI_ALL_ICONS.map(({ name, path }) => [iconKey(name), path]),
  )

  const unknown = new Set<string>()
  for (const zone of zones) {
    if (!zone.icon) continue
    const path = paths.get(iconKey(zone.icon))
    if (path) zone.icon = path
    else unknown.add(zone.icon)
  }
  if (unknown.size > 0)
    throw new Error(`unknown icons: ${[...unknown].join(', ')}`)
}

/** Appends the buttons described by a `#layout=` link to the active sheet. */
export function useLayoutLink() {
  const { activeSheetId, activeButtonId, appendButtons } = useSheets()
  const { track } = useAnalytics()
  const layoutLinkError = ref<string | null>(null)

  async function importFromHash(): Promise<void> {
    const raw = new URLSearchParams(window.location.hash.slice(1)).get(
      HASH_PARAM,
    )
    if (raw === null) return

    // Cleared before anything can fail, so a reload never imports twice.
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    )

    try {
      const layouts = parseLayout(raw)
      await resolveIcons(layouts)
      const [firstAdded] = appendButtons(activeSheetId.value, layouts)
      if (firstAdded) activeButtonId.value = firstAdded.id
      layoutLinkError.value = null
      track('import-layout-link')
    } catch (error) {
      layoutLinkError.value =
        error instanceof Error ? error.message : String(error)
    }
  }

  onMounted(() => {
    importFromHash()
    window.addEventListener('hashchange', importFromHash)
  })
  onUnmounted(() => window.removeEventListener('hashchange', importFromHash))

  function dismissLayoutLinkError(): void {
    layoutLinkError.value = null
  }

  return { layoutLinkError, dismissLayoutLinkError }
}
