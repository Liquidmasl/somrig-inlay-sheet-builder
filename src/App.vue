<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { mdiPlus, mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import AppHeader from './components/AppHeader.vue'
import ButtonInlaySVG, { type ZoneConfig } from './components/ButtonInlaySVG.vue'
import ButtonEditorPanel from './components/ButtonEditorPanel.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useSheets } from './composables/useSheets'
import type { ActionType, ActionZone } from './types'

const { init } = useDarkMode()
onMounted(() => init())

const { activeSheet, activeSheetId, activeButtonId, addButton } = useSheets()

// Mobile navigation
const activeButtonIndex = computed(() => {
  if (!activeSheet.value || !activeButtonId.value) return 0
  return activeSheet.value.buttons.findIndex(b => b.id === activeButtonId.value)
})

const canGoPrev = computed(() => activeButtonIndex.value > 0)
const canGoNext = computed(() => {
  if (!activeSheet.value) return false
  return activeButtonIndex.value < activeSheet.value.buttons.length - 1
})

function goToPrevButton() {
  if (!canGoPrev.value || !activeSheet.value) return
  activeButtonId.value = activeSheet.value.buttons[activeButtonIndex.value - 1].id
}

function goToNextButton() {
  if (!canGoNext.value || !activeSheet.value) return
  activeButtonId.value = activeSheet.value.buttons[activeButtonIndex.value + 1].id
}

// SVG preview always uses print-accurate colors (white bg, black ink)
const strokeColor = '#000000'
const fillColor = '#ffffff'

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
  <div class="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
    <AppHeader />

    <!-- Main content area -->
    <main class="flex-1 overflow-auto p-4 md:p-8 pb-[420px] md:pb-72">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-center mb-4 md:mb-6">
          <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300">
            {{ activeSheet?.name ?? 'Sheet' }}
          </h2>
        </div>

        <!-- Mobile: Single button with navigation -->
        <div class="md:hidden">
          <div class="flex items-center justify-center gap-2">
            <!-- Prev button -->
            <button
              class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="!canGoPrev"
              @click="goToPrevButton"
            >
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
                <path :d="mdiChevronLeft" />
              </svg>
            </button>

            <!-- Active button preview -->
            <div
              v-if="activeSheet?.buttons.find(b => b.id === activeButtonId)"
              class="rounded-xl p-2 bg-white dark:bg-gray-900 ring-2 ring-blue-500 shadow-lg"
            >
              <ButtonInlaySVG
                :top-zones="(activeSheet.buttons.find(b => b.id === activeButtonId)!.top.zones.length as 1 | 2 | 3)"
                :bot-zones="(activeSheet.buttons.find(b => b.id === activeButtonId)!.bottom.zones.length as 1 | 2 | 3)"
                :top-zone-config="toZoneConfigs(activeSheet.buttons.find(b => b.id === activeButtonId)!.top.zones)"
                :bot-zone-config="toZoneConfigs(activeSheet.buttons.find(b => b.id === activeButtonId)!.bottom.zones)"
                :top-indicator-pos="activeSheet.buttons.find(b => b.id === activeButtonId)!.top.indicatorPosition"
                :bot-indicator-pos="activeSheet.buttons.find(b => b.id === activeButtonId)!.bottom.indicatorPosition"
                :horizontal-separator="activeSheet.buttons.find(b => b.id === activeButtonId)!.horizontalSeparator"
                :vertical-separator="activeSheet.buttons.find(b => b.id === activeButtonId)!.verticalSeparator"
                :stroke-color="strokeColor"
                :fill-color="fillColor"
                :scale="1"
              />
            </div>

            <!-- Next/Add button -->
            <button
              v-if="canGoNext"
              class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md"
              @click="goToNextButton"
            >
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
                <path :d="mdiChevronRight" />
              </svg>
            </button>
            <button
              v-else
              class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-blue-500"
              title="Add button"
              @click="handleAddButton"
            >
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
                <path :d="mdiPlus" />
              </svg>
            </button>
          </div>

          <!-- Button indicator dots -->
          <div class="flex justify-center gap-1.5 mt-3">
            <button
              v-for="btn in activeSheet?.buttons"
              :key="btn.id"
              class="w-2 h-2 rounded-full transition-colors"
              :class="activeButtonId === btn.id ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
              @click="selectButton(btn.id)"
            />
          </div>
        </div>

        <!-- Desktop: All buttons in grid -->
        <div id="print-area" class="hidden md:flex flex-wrap gap-5 items-start justify-center">
          <button
            v-for="btn in activeSheet?.buttons"
            :key="btn.id"
            class="relative rounded-xl p-2 transition-all focus:outline-none bg-white dark:bg-gray-900"
            :class="
              activeButtonId === btn.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md hover:shadow-lg'
            "
            :aria-label="`Select button ${btn.id}`"
            @click="selectButton(btn.id)"
          >
            <ButtonInlaySVG
              :top-zones="(btn.top.zones.length as 1 | 2 | 3)"
              :bot-zones="(btn.bottom.zones.length as 1 | 2 | 3)"
              :top-zone-config="toZoneConfigs(btn.top.zones)"
              :bot-zone-config="toZoneConfigs(btn.bottom.zones)"
              :top-indicator-pos="btn.top.indicatorPosition"
              :bot-indicator-pos="btn.bottom.indicatorPosition"
              :horizontal-separator="btn.horizontalSeparator"
              :vertical-separator="btn.verticalSeparator"
              :stroke-color="strokeColor"
              :fill-color="fillColor"
              :scale="1.5"
            />
          </button>

          <!-- Add button -->
          <button
            class="no-print flex items-center justify-center w-[calc(41.2mm*1.5)] h-[calc(71.9mm*1.5)] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white/50 dark:bg-gray-900/50"
            title="Add button"
            @click="handleAddButton"
          >
            <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
              <path :d="mdiPlus" />
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Floating editor panel - vertical on mobile, horizontal on desktop -->
    <div class="no-print fixed bottom-0 left-0 right-0 flex justify-center p-2 md:p-4 pointer-events-none">
      <aside class="pointer-events-auto w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[380px] md:max-h-none overflow-y-auto">
        <ButtonEditorPanel class="md:hidden" layout="vertical" />
        <ButtonEditorPanel class="hidden md:block" layout="horizontal" />
      </aside>
    </div>
  </div>
</template>
