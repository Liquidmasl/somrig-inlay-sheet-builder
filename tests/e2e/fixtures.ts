/**
 * Shared e2e fixtures.
 *
 * Every fresh browser context starts with empty localStorage, which means the
 * welcome/"what's new" popup opens over the app and swallows all clicks. Seed
 * the dismissal keys before any page script runs so specs land on the real UI.
 *
 * Import `test` from here instead of `@playwright/test` in any spec that
 * interacts with the app. Specs that want to assert on the popups themselves
 * can clear these keys and reload.
 */

import { test as base } from '@playwright/test'
import { WHATS_NEW_VERSION } from '../../src/composables/useWhatsNew'

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((version: string) => {
      localStorage.setItem('whats-new-seen', version)
      // Mute the donation auto-popup for the same reason.
      localStorage.setItem(
        'donation-prompt',
        JSON.stringify({ mutedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      )
    }, WHATS_NEW_VERSION)
    await use(page)
  },
})

export { expect } from '@playwright/test'
