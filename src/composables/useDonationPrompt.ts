/**
 * useDonationPrompt — proactively (but gently) surfaces the donation modal after the
 * user has gotten value from the tool, while respecting their attention.
 *
 * Triggers:
 *   - 3 combined SVG/3mf downloads, OR
 *   - one sheet-level action (save design / print / PDF export).
 *
 * Gates:
 *   - shows at most once per 24h (`lastShownAt`),
 *   - any support-button click mutes the auto-popup for 7 days (`mutedUntil`).
 *
 * The manual header button (`openManually`) bypasses all gates.
 *
 * This composable decides only *when* the modal opens; the modal itself always
 * shows the same content.
 *
 * State persists in localStorage. A module-level singleton so the header and App.vue
 * share one instance.
 */

import { ref } from 'vue'

const STORAGE_KEY = 'donation-prompt'

const DOWNLOAD_THRESHOLD = 3
const DAY_MS = 86_400_000
const MUTE_MS = 7 * DAY_MS

interface PersistedState {
  downloadCount: number
  lastShownAt: number
  mutedUntil: number
}

function load(): PersistedState {
  const fallback: PersistedState = {
    downloadCount: 0,
    lastShownAt: 0,
    mutedUntil: 0,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as Partial<PersistedState>) }
  } catch {
    return fallback
  }
}

const state = ref<PersistedState>(load())

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  } catch {
    // private mode / quota — non-fatal, popup just won't persist its gates
  }
}

const isOpen = ref(false)

function open() {
  isOpen.value = true
  state.value.lastShownAt = Date.now()
  state.value.downloadCount = 0
  save()
}

function maybeShow() {
  const now = Date.now()
  if (now <= state.value.mutedUntil) return
  if (now - state.value.lastShownAt <= DAY_MS) return
  open()
}

export function useDonationPrompt() {
  function recordDownload() {
    state.value.downloadCount += 1
    save()
    if (state.value.downloadCount >= DOWNLOAD_THRESHOLD) maybeShow()
  }

  function recordSheetAction() {
    maybeShow()
  }

  function openManually() {
    open()
  }

  function mute() {
    state.value.mutedUntil = Date.now() + MUTE_MS
    save()
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen,
    recordDownload,
    recordSheetAction,
    openManually,
    mute,
    close,
  }
}
