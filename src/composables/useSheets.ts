import { computed, ref, watch } from 'vue'
import type {
  ActionType,
  ActionZone,
  ButtonInlay,
  ButtonType,
  IndicatorPosition,
  SeparatorStyle,
  Sheet,
} from '../types'

const DEFAULT_ZONE_TYPES: ActionType[] = ['single', 'hold', 'double']
const STORAGE_KEY = 'button-customizer-state-v1'
const SAVE_FILE_VERSION = 1

interface PersistedState {
  version: number
  nextId: number
  sheets: Sheet[]
  activeSheetId: string
  activeButtonId: string | null
  savedAt: string
}

function createDefaultZone(type: ActionType = 'single'): ActionZone {
  return {
    type,
    icon: null,
    iconSize: 12,
    iconColor: '#000000',
    iconRotation: 0,
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

function createDefaultSheet(
  id: string,
  name: string,
  buttonType: ButtonType = 'somrig',
): Sheet {
  return {
    id,
    name,
    buttonType,
    buttons: [createDefaultButtonInlay(`${id}-btn-1`)],
  }
}

let _nextId = 1
function nextId(): string {
  return String(_nextId++)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSheetArray(value: unknown): value is Sheet[] {
  return Array.isArray(value)
}

function createInitialState(): PersistedState {
  const firstSheet = createDefaultSheet(nextId(), 'Sheet 1')
  return {
    version: SAVE_FILE_VERSION,
    nextId: _nextId,
    sheets: [firstSheet],
    activeSheetId: firstSheet.id,
    activeButtonId: firstSheet.buttons[0]?.id ?? null,
    savedAt: new Date().toISOString(),
  }
}

function normalizeState(value: unknown): PersistedState | null {
  if (!isObject(value)) return null

  const importedSheets = value.sheets
  if (!isSheetArray(importedSheets) || importedSheets.length === 0) return null

  const importedActiveSheetId =
    typeof value.activeSheetId === 'string'
      ? value.activeSheetId
      : importedSheets[0].id
  const activeSheet =
    importedSheets.find((sheet) => sheet.id === importedActiveSheetId) ??
    importedSheets[0]

  const importedActiveButtonId =
    typeof value.activeButtonId === 'string' ? value.activeButtonId : null
  const activeButtonId = activeSheet.buttons.some(
    (button) => button.id === importedActiveButtonId,
  )
    ? importedActiveButtonId
    : (activeSheet.buttons[0]?.id ?? null)

  return {
    version:
      typeof value.version === 'number' ? value.version : SAVE_FILE_VERSION,
    nextId: typeof value.nextId === 'number' ? value.nextId : _nextId,
    sheets: importedSheets,
    activeSheetId: activeSheet.id,
    activeButtonId,
    savedAt:
      typeof value.savedAt === 'string'
        ? value.savedAt
        : new Date().toISOString(),
  }
}

function loadStoredState(): PersistedState {
  if (typeof window === 'undefined') return createInitialState()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return createInitialState()

  try {
    return normalizeState(JSON.parse(raw)) ?? createInitialState()
  } catch {
    return createInitialState()
  }
}

// Shared reactive state (module-level singleton)
const initialState = loadStoredState()
_nextId = Math.max(initialState.nextId, _nextId)
const sheets = ref<Sheet[]>(initialState.sheets)
const activeSheetId = ref<string>(initialState.activeSheetId)
const activeButtonId = ref<string | null>(initialState.activeButtonId)

function exportState(): PersistedState {
  return {
    version: SAVE_FILE_VERSION,
    nextId: _nextId,
    sheets: sheets.value,
    activeSheetId: activeSheetId.value,
    activeButtonId: activeButtonId.value,
    savedAt: new Date().toISOString(),
  }
}

function persistState(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exportState()))
}

function importState(value: unknown): boolean {
  const imported = normalizeState(value)
  if (!imported) return false

  sheets.value = imported.sheets
  activeSheetId.value = imported.activeSheetId
  activeButtonId.value = imported.activeButtonId
  _nextId = Math.max(imported.nextId, _nextId)
  persistState()
  return true
}

watch(
  [sheets, activeSheetId, activeButtonId],
  () => {
    persistState()
  },
  { deep: true },
)

export function useSheets() {
  const activeSheet = computed(
    () => sheets.value.find((s) => s.id === activeSheetId.value) ?? null,
  )

  const activeButton = computed(() => {
    if (!activeButtonId.value) return null
    return (
      activeSheet.value?.buttons.find((b) => b.id === activeButtonId.value) ??
      null
    )
  })

  function addSheet(name?: string): Sheet {
    const id = nextId()
    const sheet = createDefaultSheet(
      id,
      name ?? `Sheet ${sheets.value.length + 1}`,
    )
    sheets.value.push(sheet)
    return sheet
  }

  function removeSheet(sheetId: string): void {
    const idx = sheets.value.findIndex((s) => s.id === sheetId)
    if (idx === -1) return
    sheets.value.splice(idx, 1)
    if (activeSheetId.value === sheetId) {
      activeSheetId.value = sheets.value[0]?.id ?? ''
      activeButtonId.value = sheets.value[0]?.buttons[0]?.id ?? null
    }
  }

  function addButton(sheetId: string): ButtonInlay | null {
    const sheet = sheets.value.find((s) => s.id === sheetId)
    if (!sheet) return null
    const btn = createDefaultButtonInlay(`${sheetId}-btn-${nextId()}`)
    sheet.buttons.push(btn)
    return btn
  }

  function duplicateButton(
    sheetId: string,
    buttonId: string,
  ): ButtonInlay | null {
    const sheet = sheets.value.find((s) => s.id === sheetId)
    if (!sheet) return null

    const idx = sheet.buttons.findIndex((b) => b.id === buttonId)
    if (idx === -1) return null

    const sourceButton = sheet.buttons[idx]
    const clonedButton: ButtonInlay = JSON.parse(JSON.stringify(sourceButton))
    clonedButton.id = `${sheetId}-btn-${nextId()}`

    sheet.buttons.splice(idx + 1, 0, clonedButton)
    return clonedButton
  }

  function removeButton(sheetId: string, buttonId: string): void {
    const sheet = sheets.value.find((s) => s.id === sheetId)
    if (!sheet) return

    const idx = sheet.buttons.findIndex((b) => b.id === buttonId)
    if (idx === -1) return

    sheet.buttons.splice(idx, 1)

    if (activeButtonId.value === buttonId) {
      const nextIndex = Math.min(idx, sheet.buttons.length - 1)
      activeButtonId.value =
        nextIndex >= 0 ? (sheet.buttons[nextIndex]?.id ?? null) : null
    }
  }

  function findButton(buttonId: string): ButtonInlay | null {
    for (const sheet of sheets.value) {
      const btn = sheet.buttons.find((b) => b.id === buttonId)
      if (btn) return btn
    }
    return null
  }

  function setZoneCount(
    buttonId: string,
    half: 'top' | 'bottom',
    count: 1 | 2 | 3,
  ): void {
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
    const separator =
      separatorType === 'horizontal'
        ? button.horizontalSeparator
        : button.verticalSeparator
    Object.assign(separator, patch)
  }

  function setButtonType(sheetId: string, buttonType: ButtonType): void {
    const sheet = sheets.value.find((s) => s.id === sheetId)
    if (!sheet) return
    sheet.buttonType = buttonType
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
    duplicateButton,
    removeButton,
    setZoneCount,
    updateZone,
    setIndicatorPosition,
    updateSeparator,
    setButtonType,
    exportState,
    importState,
  }
}
