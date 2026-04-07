<script setup lang="ts">
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiDownload,
  mdiPlus,
  mdiPrinter,
} from '@mdi/js'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ButtonEditorPanel from './components/ButtonEditorPanel.vue'
import ButtonInlaySVG, {
  type IndicatorType,
  type ZoneConfig,
} from './components/ButtonInlaySVG.vue'
import { useDarkMode } from './composables/useDarkMode'
import { useSheets } from './composables/useSheets'
import type { ActionType, ActionZone } from './types'

const { init } = useDarkMode()
onMounted(() => {
  init()
  scrollToActiveCard()
  window.addEventListener('resize', updateWindowHeight)

  // Set up ResizeObserver for editor panel
  if (editorPanelRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        editorPanelHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(editorPanelRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowHeight)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const { activeSheet, activeSheetId, activeButtonId, addButton } = useSheets()

// Mobile navigation
const carouselRef = ref<HTMLElement | null>(null)
const editorPanelRef = ref<HTMLElement | null>(null)
const windowHeight = ref(window.innerHeight)
const editorPanelHeight = ref(420) // Default fallback

// Update window height on resize
function updateWindowHeight() {
  windowHeight.value = window.innerHeight
}

// Set up ResizeObserver for editor panel
let resizeObserver: ResizeObserver | null = null

// Calculate responsive scale for mobile preview
// Available height = viewport - (header + print buttons + editor panel + margins)
const previewScale = computed(() => {
  const headerHeight = 56 // Approximate header height
  const printButtonsHeight = 56 // Print/Download buttons section
  const marginsAndGaps = 45 // Various margins
  const paginationDotsHeight = 8 // Height of pagination dots
  const chromeHeight =
    headerHeight +
    printButtonsHeight +
    editorPanelHeight.value +
    marginsAndGaps +
    paginationDotsHeight
  const availableHeight = windowHeight.value - chromeHeight

  const buttonHeightMm = 71.9 // Physical button height in mm
  const mmToPixels = 3.7795 // Conversion factor (96 DPI)
  const maxScale = availableHeight / (buttonHeightMm * mmToPixels)
  return Math.min(Math.max(maxScale, 0.5), 2) // Clamp between 0.5 and 2
})

const activeButtonIndex = computed(() => {
  if (!activeSheet.value || !activeButtonId.value) return 0
  return activeSheet.value.buttons.findIndex(
    (b) => b.id === activeButtonId.value,
  )
})

const canGoPrev = computed(() => activeButtonIndex.value > 0)
const canGoNext = computed(() => {
  if (!activeSheet.value) return false
  return activeButtonIndex.value < activeSheet.value.buttons.length - 1
})

function scrollToActiveCard() {
  nextTick(() => {
    if (!carouselRef.value) return
    const cards = carouselRef.value.querySelectorAll('.button-card')
    const activeCard = cards[activeButtonIndex.value]
    if (activeCard) {
      activeCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  })
}

function goToPrevButton() {
  if (!canGoPrev.value || !activeSheet.value) return
  activeButtonId.value =
    activeSheet.value.buttons[activeButtonIndex.value - 1].id
  scrollToActiveCard()
}

function goToNextButton() {
  if (!canGoNext.value || !activeSheet.value) return
  activeButtonId.value =
    activeSheet.value.buttons[activeButtonIndex.value + 1].id
  scrollToActiveCard()
}

// Watch for button selection changes and scroll to active card
watch(activeButtonId, () => {
  scrollToActiveCard()
})

// SVG preview always uses print-accurate colors (white bg, black ink)
const strokeColor = '#000000'
const fillColor = '#ffffff'

function actionTypeToIndicator(type: ActionType): IndicatorType {
  if (type === 'single') return 'dot'
  if (type === 'double') return 'double-dot'
  if (type === 'hold') return 'dash'
  return 'none'
}

function toZoneConfigs(zones: ActionZone[]): ZoneConfig[] {
  return zones.map((z) => ({
    icon: z.icon ?? undefined,
    indicator: actionTypeToIndicator(z.type),
    iconSize: z.iconSize,
    iconColor: z.iconColor,
    iconRotation: z.iconRotation,
    label: z.label,
    labelSize: z.labelSize,
    labelColor: z.labelColor,
    labelRotation: z.labelRotation,
    labelPosition: z.labelPosition,
    labelShiftIcon: z.labelShiftIcon,
  }))
}

function selectButton(buttonId: string) {
  activeButtonId.value = buttonId
}

function handleAddButton() {
  const btn = addButton(activeSheetId.value)
  if (btn) activeButtonId.value = btn.id
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
    <AppHeader />

    <!-- Main content area -->
    <main class="flex-1 overflow-auto pt-4 md:pb-[420px] md:pb-72">
      <div class=" mx-auto">
        <!-- Print/Download buttons -->
        <div class="flex items-center justify-center gap-2 mb-3">
          <button
            @click="handlePrint"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            aria-label="Print sheet"
            title="Print"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
              <path :d="mdiPrinter" />
            </svg>
            <span>Print</span>
          </button>
          <button
            @click="handlePrint"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            aria-label="Download as PDF"
            title="Download PDF"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
              <path :d="mdiDownload" />
            </svg>
            <span>Download PDF</span>
          </button>
        </div>

        <!-- Mobile: Carousel with centered button and arrows -->
        <div class="md:hidden relative">
          <!-- Carousel container (full width, viewport clips edges) -->
          <div ref="carouselRef" class="pt-1 pb-1 overflow-x-auto snap-x snap-mandatory scroll-smooth" style="scrollbar-width: none; -ms-overflow-style: none;">
            <div class="flex items-center justify-start" :style="`padding-left: calc(50vw - 41.2mm * ${previewScale} / 2 - 8px); padding-right: calc(50vw - 41.2mm * ${previewScale} / 2 - 8px); gap: calc((100vw - (1.5 * ((41.2mm * ${previewScale}) + 16px) ))/2)`">
              <!-- Button cards -->
              <button
                v-for="btn in activeSheet?.buttons"
                :key="btn.id"
                class="button-card flex-shrink-0 snap-center rounded-xl p-2 transition-all focus:outline-none"
                :class="
                  activeButtonId === btn.id
                    ? 'bg-white dark:bg-gray-900 ring-2 ring-blue-500 shadow-lg scale-100'
                    : 'bg-white dark:bg-gray-900 shadow-md opacity-60 scale-95'
                "
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
                  :scale="previewScale"
                />
              </button>

              <!-- Add button card -->
              <button
                class="button-card flex-shrink-0 snap-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white/50 dark:bg-gray-900/50 flex items-center justify-center opacity-60 px-8"
                :style="{ width: `calc(41.2mm * ${previewScale} + 16px)`, height: `calc(71.9mm * ${previewScale} + 16px)` }"
                title="Add button"
                @click="handleAddButton"
              >
                <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
                  <path :d="mdiPlus" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Arrow buttons overlaid on carousel -->
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md disabled:opacity-30 disabled:cursor-not-allowed z-10"
            :disabled="!canGoPrev"
            @click="goToPrevButton"
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
              <path :d="mdiChevronLeft" />
            </svg>
          </button>

          <button
            v-if="canGoNext"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md z-10"
            @click="goToNextButton"
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
              <path :d="mdiChevronRight" />
            </svg>
          </button>
          <button
            v-else
            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-blue-500 z-10"
            title="Add button"
            @click="handleAddButton"
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor">
              <path :d="mdiPlus" />
            </svg>
          </button>

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
              :scale="previewScale"
            />
          </button>

          <!-- Add button -->
          <button
            class="no-print flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white/50 dark:bg-gray-900/50"
            :style="{ width: `calc(41.2mm * ${previewScale} + 16px)`, height: `calc(71.9mm * ${previewScale} + 16px)` }"
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
      <aside
        ref="editorPanelRef"
        class="pointer-events-auto w-full max-w-4xl bg-white/80 dark:bg-gray-900/80 rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[50vh] md:max-h-none overflow-y-auto"
        style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
      >
        <ButtonEditorPanel class="md:hidden" layout="vertical" />
        <ButtonEditorPanel class="hidden md:block" layout="horizontal" />
      </aside>
    </div>
  </div>
</template>
