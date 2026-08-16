/**
 * useWhatsNew — shows a welcome / "what changed" popup once per minor/major release.
 *
 * The gate is keyed to WHATS_NEW_VERSION (major.minor), which is maintained by hand
 * alongside the popup copy in WhatsNewModal.vue. Bump it whenever you write new
 * "what's new" content; the popup then re-appears once for every visitor. Patch
 * releases intentionally do NOT re-trigger it.
 *
 * Last-seen version persists in localStorage. Module-level singleton, mirroring
 * useDonationPrompt.
 */

import { ref } from 'vue'

// Bump (and refresh the copy in WhatsNewModal.vue) on each minor/major release.
export const WHATS_NEW_VERSION = '2.1'

const STORAGE_KEY = 'whats-new-seen'

function seenCurrent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION
  } catch {
    // No storage access (private mode) — treat as seen so we don't nag every load.
    return true
  }
}

const isOpen = ref(!seenCurrent())

export function useWhatsNew() {
  function dismiss() {
    isOpen.value = false
    try {
      localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION)
    } catch {
      // non-fatal
    }
  }

  return { isOpen, dismiss }
}
