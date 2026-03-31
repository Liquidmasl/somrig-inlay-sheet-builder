import { ref, computed } from 'vue'
import type { ActionType, ActionZone, ButtonInlay, IndicatorPosition, SeparatorStyle, Sheet } from '../types'

const DEFAULT_ZONE_TYPES: ActionType[] = ['single', 'hold', 'double']

function createDefaultZone(type: ActionType = 'single'): ActionZone {
  return {
    type,
    icon: null,
    iconSize: 12,
    iconColor: '#000000',
  }
}

const DEFAULT_SEPARATOR: SeparatorStyle = {
  thickness: 0.3,
  color: '#000000',
  style: 'solid',
}

function createDefaultButtonInlay(id: string): ButtonInlay {
  return {
    id,
    top: { zones: [createDefaultZone()], indicatorPosition: 'inner' },
    bottom: { zones: [createDefaultZone()], indicatorPosition: 'inner' },
    horizontalSeparator: { ...DEFAULT_SEPARATOR },
    verticalSeparator: { ...DEFAULT_SEPARATOR },
  }
}

function createDefaultSheet(id: string, name: string): Sheet {
  return {
    id,
    name,
    buttons: [createDefaultButtonInlay(`${id}-btn-1`)],
  }
}

let _nextId = 1
function nextId(): string {
  return String(_nextId++)
}

// Shared reactive state (module-level singleton)
const sheets = ref<Sheet[]>([createDefaultSheet(nextId(), 'Sheet 1')])
const activeSheetId = ref<string>(sheets.value[0].id)
const activeButtonId = ref<string | null>(sheets.value[0].buttons[0].id)

export function useSheets() {
  const activeSheet = computed(() =>
    sheets.value.find(s => s.id === activeSheetId.value) ?? null
  )

  const activeButton = computed(() => {
    if (!activeButtonId.value) return null
    return activeSheet.value?.buttons.find(b => b.id === activeButtonId.value) ?? null
  })

  function addSheet(name?: string): Sheet {
    const id = nextId()
    const sheet = createDefaultSheet(id, name ?? `Sheet ${sheets.value.length + 1}`)
    sheets.value.push(sheet)
    return sheet
  }

  function removeSheet(sheetId: string): void {
    const idx = sheets.value.findIndex(s => s.id === sheetId)
    if (idx === -1) return
    sheets.value.splice(idx, 1)
    if (activeSheetId.value === sheetId) {
      activeSheetId.value = sheets.value[0]?.id ?? ''
      activeButtonId.value = sheets.value[0]?.buttons[0]?.id ?? null
    }
  }

  function addButton(sheetId: string): ButtonInlay | null {
    const sheet = sheets.value.find(s => s.id === sheetId)
    if (!sheet) return null
    const btn = createDefaultButtonInlay(`${sheetId}-btn-${nextId()}`)
    sheet.buttons.push(btn)
    return btn
  }

  function removeButton(sheetId: string, buttonId: string): void {
    const sheet = sheets.value.find(s => s.id === sheetId)
    if (!sheet) return
    const idx = sheet.buttons.findIndex(b => b.id === buttonId)
    if (idx === -1) return
    sheet.buttons.splice(idx, 1)
    if (activeButtonId.value === buttonId) {
      activeButtonId.value = sheet.buttons[0]?.id ?? null
    }
  }

  function findButton(buttonId: string): ButtonInlay | null {
    for (const sheet of sheets.value) {
      const btn = sheet.buttons.find(b => b.id === buttonId)
      if (btn) return btn
    }
    return null
  }

  function setZoneCount(buttonId: string, half: 'top' | 'bottom', count: 1 | 2 | 3): void {
    const button = findButton(buttonId)
    if (!button) return
    const phys = half === 'top' ? button.top : button.bottom
    const current = phys.zones
    phys.zones = Array.from({ length: count }, (_, i) => {
      if (i < current.length) return current[i]
      return createDefaultZone(DEFAULT_ZONE_TYPES[i] ?? 'single')
    })
  }

  function updateZone(
    buttonId: string,
    half: 'top' | 'bottom',
    zoneIndex: number,
    patch: Partial<ActionZone>,
  ): void {
    const button = findButton(buttonId)
    if (!button) return
    const phys = half === 'top' ? button.top : button.bottom
    if (zoneIndex >= 0 && zoneIndex < phys.zones.length) {
      Object.assign(phys.zones[zoneIndex], patch)
    }
  }

  function setIndicatorPosition(
    buttonId: string,
    half: 'top' | 'bottom',
    position: IndicatorPosition,
  ): void {
    const button = findButton(buttonId)
    if (!button) return
    const phys = half === 'top' ? button.top : button.bottom
    phys.indicatorPosition = position
  }

  function updateSeparator(
    buttonId: string,
    separatorType: 'horizontal' | 'vertical',
    patch: Partial<SeparatorStyle>,
  ): void {
    const button = findButton(buttonId)
    if (!button) return
    const separator = separatorType === 'horizontal' ? button.horizontalSeparator : button.verticalSeparator
    Object.assign(separator, patch)
  }

  return {
    sheets,
    activeSheetId,
    activeButtonId,
    activeSheet,
    activeButton,
    addSheet,
    removeSheet,
    addButton,
    removeButton,
    setZoneCount,
    updateZone,
    setIndicatorPosition,
    updateSeparator,
  }
}
