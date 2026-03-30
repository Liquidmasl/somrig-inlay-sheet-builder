<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { mdiPlus } from '@mdi/js'
import AppHeader from './components/AppHeader.vue'
import ButtonInlaySVG, { type ZoneConfig } from './components/ButtonInlaySVG.vue'
import ButtonEditorPanel from './components/ButtonEditorPanel.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useSheets } from './composables/useSheets'
import type { ActionType, ActionZone } from './types'

const { init, isDark } = useDarkMode()
onMounted(() => init())

const { activeSheet, activeSheetId, activeButtonId, addButton } = useSheets()

const strokeColor = computed(() => (isDark.value ? '#ffffff' : '#000000'))
const fillColor = computed(() => (isDark.value ? '#1f2937' : '#ffffff'))

function actionTypeToIndicator(type: ActionType): 'dot' | 'double-dot' | 'dash' {
  if (type === 'single') return 'dot'
  if (type === 'double') return 'double-dot'
  return 'dash'
}

function toZoneConfigs(zones: ActionZone[]): ZoneConfig[] {
  return zones.map(z => ({
    icon: z.icon ?? undefined,
    indicator: actionTypeToIndicator(z.type),
    iconSize: z.iconSize,
    iconColor: z.iconColor,
  }))
}

function selectButton(buttonId: string) {
  activeButtonId.value = buttonId
}

function handleAddButton() {
  const btn = addButton(activeSheetId.value)
  if (btn) activeButtonId.value = btn.id
}
</script>

<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors overflow-hidden">
    <AppHeader />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sheet canvas -->
      <main class="flex-1 overflow-auto p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300">
            {{ activeSheet?.name ?? 'Sheet' }}
          </h2>
        </div>

        <div id="print-area" class="flex flex-wrap gap-5 items-start">
          <!-- Button inlays -->
          <button
            v-for="btn in activeSheet?.buttons"
            :key="btn.id"
            class="relative rounded-xl p-2 transition-all focus:outline-none"
            :class="
              activeButtonId === btn.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            "
            :aria-label="`Select button ${btn.id}`"
            @click="selectButton(btn.id)"
          >
            <ButtonInlaySVG
              :top-zones="(btn.top.zones.length as 1 | 2 | 3)"
              :bot-zones="(btn.bottom.zones.length as 1 | 2 | 3)"
              :top-zone-config="toZoneConfigs(btn.top.zones)"
              :bot-zone-config="toZoneConfigs(btn.bottom.zones)"
              :stroke-color="strokeColor"
              :fill-color="fillColor"
              :scale="1.5"
            />
          </button>

          <!-- Add button — hidden in print -->
          <button
            class="no-print flex items-center justify-center w-[calc(41.2mm*1.5)] h-[calc(71.9mm*1.5)] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            title="Add button"
            @click="handleAddButton"
          >
            <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
              <path :d="mdiPlus" />
            </svg>
          </button>
        </div>
      </main>

      <!-- Editor panel -->
      <aside class="w-80 shrink-0 border-l border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        <ButtonEditorPanel />
      </aside>
    </div>
  </div>
</template>
