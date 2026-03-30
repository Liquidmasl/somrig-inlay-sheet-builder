import { ref, computed } from 'vue'
import type { ActionZone, ButtonInlay, Sheet } from '../types'

function createDefaultZone(): ActionZone {
  return {
    type: 'single',
    icon: null,
    iconSize: 20,
    iconColor: '#000000',
  }
}

function createDefaultButtonInlay(id: string): ButtonInlay {
  return {
    id,
    top: { zones: [createDefaultZone()] },
    bottom: { zones: [createDefaultZone()] },
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
  }
}
