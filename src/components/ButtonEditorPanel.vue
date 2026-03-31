<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { mdiImageOffOutline, mdiChevronDown, mdiChevronUp, mdiPlus } from '@mdi/js'
import { useSheets } from '../composables/useSheets'
import IconPickerModal from './IconPickerModal.vue'
import type { ActionType, IndicatorPosition, LineStyle, SeparatorStyle } from '../types'

const props = withDefaults(defineProps<{
  /** Layout mode: 'vertical' (sidebar) or 'horizontal' (floating bottom panel) */
  layout?: 'vertical' | 'horizontal'
}>(), {
  layout: 'vertical',
})

const { activeButton, setZoneCount, updateZone, setIndicatorPosition, updateSeparator } = useSheets()

// Active zone for pagination (0-indexed: 0, 1, or 2)
const activeTopZone = ref(0)
const activeBotZone = ref(0)

// Active tab for mobile (top, bottom, or separators)
const activeHalf = ref<'top' | 'bottom' | 'separators'>('top')

// Watch for button changes and reset zone indices if out of bounds
watch(activeButton, (newButton) => {
  if (!newButton) return

  // Reset top zone if current index is out of bounds
  if (activeTopZone.value >= newButton.top.zones.length) {
    activeTopZone.value = 0
  }

  // Reset bottom zone if current index is out of bounds
  if (activeBotZone.value >= newButton.bottom.zones.length) {
    activeBotZone.value = 0
  }
})

// Collapsible separators section for horizontal layout
const separatorsExpanded = ref(false)

// Icon picker state
const pickerOpen = ref(false)
const pickerTarget = ref<{ half: 'top' | 'bottom'; zoneIndex: number } | null>(null)

const currentPickerIcon = computed(() => {
  if (!activeButton.value || !pickerTarget.value) return null
  const { half, zoneIndex } = pickerTarget.value
  return activeButton.value[half].zones[zoneIndex]?.icon ?? null
})

function openIconPicker(half: 'top' | 'bottom', zoneIndex: number) {
  pickerTarget.value = { half, zoneIndex }
  pickerOpen.value = true
}

function handleIconSelect(path: string) {
  if (!activeButton.value || !pickerTarget.value) return
  updateZone(activeButton.value.id, pickerTarget.value.half, pickerTarget.value.zoneIndex, {
    icon: path,
  })
}

function clearIcon(half: 'top' | 'bottom', zoneIndex: number) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { icon: null })
}

function actionTypeLabel(type: ActionType): string {
  if (type === 'single') return 'Single'
  if (type === 'double') return 'Double'
  return 'Hold'
}


const topZoneCount = computed(() => (activeButton.value?.top.zones.length ?? 1) as 1 | 2 | 3)
const botZoneCount = computed(() => (activeButton.value?.bottom.zones.length ?? 1) as 1 | 2 | 3)

const ACTION_TYPES: ActionType[] = ['single', 'hold', 'double']

function onSelectZone(half: 'top' | 'bottom', zoneIndex: number) {
  // Just switch to the selected zone, don't change zone count
  if (half === 'top') {
    activeTopZone.value = zoneIndex
  } else {
    activeBotZone.value = zoneIndex
  }
}

function onAddZone(half: 'top' | 'bottom') {
  if (!activeButton.value) return
  const currentCount = half === 'top' ? topZoneCount.value : botZoneCount.value
  const newCount = Math.min(currentCount + 1, 3) as 1 | 2 | 3

  if (newCount > currentCount) {
    setZoneCount(activeButton.value.id, half, newCount)
    // Switch to the newly added zone
    if (half === 'top') {
      activeTopZone.value = newCount - 1
    } else {
      activeBotZone.value = newCount - 1
    }
  }
}

function onRemoveZone(half: 'top' | 'bottom', zoneIndex: number) {
  if (!activeButton.value || zoneIndex === 0) return // Can't remove zone 1

  // Get the zones array and splice out the specific zone
  const phys = half === 'top' ? activeButton.value.top : activeButton.value.bottom
  phys.zones.splice(zoneIndex, 1)

  // Update the zone count to match the new length
  const newCount = phys.zones.length as 1 | 2 | 3
  setZoneCount(activeButton.value.id, half, newCount)

  // Switch to the zone that's now at the removed index (or the last zone if we removed the last one)
  const newActiveIndex = Math.min(zoneIndex, phys.zones.length - 1)
  if (half === 'top') {
    activeTopZone.value = newActiveIndex
  } else {
    activeBotZone.value = newActiveIndex
  }
}

function onUpdateZone(
  half: 'top' | 'bottom',
  zoneIndex: number,
  field: 'iconSize' | 'iconColor' | 'iconRotation',
  value: string | number,
) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { [field]: value })
}

function onSetZoneType(half: 'top' | 'bottom', zoneIndex: number, type: ActionType) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { type })
}

function onSetIndicatorPosition(half: 'top' | 'bottom', position: IndicatorPosition) {
  if (!activeButton.value) return
  setIndicatorPosition(activeButton.value.id, half, position)
}

const INDICATOR_POSITIONS: IndicatorPosition[] = ['inner', 'outer']

function indicatorPosLabel(pos: IndicatorPosition): string {
  return pos === 'inner' ? 'Inner' : 'Outer'
}

const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'dotted']

function lineStyleLabel(style: LineStyle): string {
  return style.charAt(0).toUpperCase() + style.slice(1)
}

function onUpdateSeparator(
  separatorType: 'horizontal' | 'vertical',
  field: keyof SeparatorStyle,
  value: string | number,
) {
  if (!activeButton.value) return
  updateSeparator(activeButton.value.id, separatorType, { [field]: value })
}
</script>

<template>
  <div
    class="text-gray-900 dark:text-white"
    :class="layout === 'horizontal' ? 'bg-white dark:bg-gray-900' : 'min-h-[300px] md:h-full flex flex-col bg-gray-50 dark:bg-gray-900'"
  >
    <!-- Empty state -->
    <div
      v-if="!activeButton"
      class="flex flex-col items-center justify-center gap-3 text-gray-400 p-8"
      :class="layout === 'horizontal' ? 'py-6' : 'flex-1'"
    >
      <svg viewBox="0 0 24 24" class="w-12 h-12 opacity-30" fill="currentColor">
        <path :d="mdiImageOffOutline" />
      </svg>
      <p class="text-sm text-center">Click a button to edit</p>
    </div>

    <!-- Editor -->
    <template v-else>
      <!-- Mobile tabs (only for vertical layout) -->
      <div
        v-if="layout === 'vertical'"
        class="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
      >
        <button
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="
            activeHalf === 'top'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          @click="activeHalf = 'top'"
        >
          Top Half
        </button>
        <button
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="
            activeHalf === 'bottom'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          @click="activeHalf = 'bottom'"
        >
          Bottom Half
        </button>
        <button
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="
            activeHalf === 'separators'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          @click="activeHalf = 'separators'"
        >
          Separators
        </button>
      </div>

      <!-- Controls container: vertical stack or horizontal grid -->
      <div
        :class="layout === 'horizontal'
          ? 'grid grid-cols-2 gap-4 p-4'
          : 'flex-1 overflow-y-auto p-4 space-y-6'"
      >
        <!-- Top half -->
        <section
          v-if="layout === 'horizontal' || activeHalf === 'top'"
          :class="layout === 'horizontal' ? 'space-y-4' : ''"
        >
          <h3
            v-if="layout === 'horizontal'"
            class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3"
          >
            Top Half
          </h3>

          <!-- Zone count and indicator position -->
          <div class="flex items-end gap-4 mb-4 justify-between">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Zones</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Existing zone buttons -->
                <button
                  v-for="n in topZoneCount"
                  :key="n"
                  class="px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-medium transition-colors"
                  :class="
                    n - 1 === activeTopZone
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onSelectZone('top', n - 1)"
                >
                  {{ n }}
                </button>
                <!-- Add zone button (only if < 3 zones) -->
                <button
                  v-if="topZoneCount < 3"
                  class="px-2 py-1 md:px-3 md:py-1.5 text-sm font-medium transition-colors bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                  title="Add zone"
                  @click="onAddZone('top')"
                >
                  <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
                    <path :d="mdiPlus" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="ml-auto">
              <label class="block text-xs text-gray-500 mb-1 text-right">Indicator</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="pos in INDICATOR_POSITIONS"
                  :key="pos"
                  class="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium transition-colors"
                  :class="
                    activeButton.top.indicatorPosition === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  :title="pos === 'inner' ? 'Near center divider' : 'Near button edge'"
                  @click="onSetIndicatorPosition('top', pos)"
                >
                  {{ indicatorPosLabel(pos) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Per-zone controls (paginated - only show active zone) -->
          <div
            v-if="activeButton.top.zones[activeTopZone]"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3"
          >
              <!-- Zone header with type selector and remove button -->
              <div class="flex items-center justify-between gap-2">
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    v-for="t in ACTION_TYPES"
                    :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="
                      activeButton.top.zones[activeTopZone].type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    "
                    :aria-label="`Set zone ${activeTopZone + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('top', activeTopZone, t)"
                  >
                      <svg v-if="t === 'single'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
                        <circle cx="12" cy="12" r="5" />
                      </svg>
                      <svg v-else-if="t === 'double'" viewBox="0 0 24 24" class="w-6 h-4" fill="currentColor">
                        <circle :cx="12+8" cy="12" r="5" /> <circle :cx="12-8" cy="12" r="5" />
                      </svg>
                      <svg v-else-if="t === 'hold'" viewBox="0 0 24 24" class="w-6 h-4" fill="currentColor">
                        <rect
                          x="-3"
                          y="7"
                          width="30"
                          height="10"
                          rx="5"
                          ry="5"
                        />
                      </svg>
                      
                  </button>
                </div>
                <!-- Remove zone button (only for zones 2 and 3) -->
                <button
                  v-if="activeTopZone > 0"
                  class="px-2  rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove this zone"
                  @click="onRemoveZone('top', activeTopZone)"
                >
                  Remove
                </button>
              </div>

              <!-- Icon picker -->
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 flex items-center gap-2 px-2 py-1.5 min-h-[36px] rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800"
                  :title="activeButton.top.zones[activeTopZone].icon ? 'Change icon' : 'Pick icon'"
                  @click="openIconPicker('top', activeTopZone)"
                >
                  <svg
                    v-if="activeButton.top.zones[activeTopZone].icon"
                    viewBox="0 0 24 24"
                    class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300"
                    fill="currentColor"
                  >
                    <path :d="activeButton.top.zones[activeTopZone].icon!" />
                  </svg>
                  <span class="text-gray-400 text-xs truncate" :class="{ 'text-gray-700 dark:text-gray-300': activeButton.top.zones[activeTopZone].icon }">
                    {{ activeButton.top.zones[activeTopZone].icon ? 'Change icon' : 'No icon — click to add' }}
                  </span>
                </button>
                <button
                  v-if="activeButton.top.zones[activeTopZone].icon"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove icon"
                  @click="clearIcon('top', activeTopZone)"
                >
                  ×
                </button>
              </div>

              <!-- Icon size and color (side-by-side) -->
              <div class="flex items-center gap-3 justify-between">
                <!-- Icon size (left half) -->
                <div class="flex-4 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs text-gray-500">Size</label>
                    <span class="text-xs text-gray-500">{{ activeButton.top.zones[activeTopZone].iconSize }} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    :value="activeButton.top.zones[activeTopZone].iconSize"
                    class="w-full accent-blue-600"
                    @input="onUpdateZone('top', activeTopZone, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))"
                  />
                </div>

                <!-- Icon rotation -->
                <div class="min-w-0 pl-2">
                  <label class="block text-xs text-gray-500 mb-1 text-left">Rotation</label>
                  <div class="flex items-center gap-1 justify-start">
                    <input
                      type="number"
                      min="-360"
                      max="360"
                      :value="activeButton.top.zones[activeTopZone].iconRotation ?? 0"
                      class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0"
                      @input="onUpdateZone('top', activeTopZone, 'iconRotation', parseFloat(($event.target as HTMLInputElement).value))"
                    />
                    <span class="text-xs text-gray-400">°</span>
                  </div>
                </div>

                <!-- Icon color (right half) -->
                <div class="min-w-0 pl-2">
                  <label class="block text-xs text-gray-500 mb-1 text-left">Color</label>
                  <div class="flex items-center gap-2 justify-start">
                    <input
                      type="color"
                      :value="activeButton.top.zones[activeTopZone].iconColor"
                      class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0"
                      @input="onUpdateZone('top', activeTopZone, 'iconColor', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
          </div>
        </section>

        <!-- Bottom half -->
        <section
          v-if="layout === 'horizontal' || activeHalf === 'bottom'"
          :class="layout === 'horizontal' ? 'space-y-4' : ''"
        >
          <h3
            v-if="layout === 'horizontal'"
            class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3"
          >
            Bottom Half
          </h3>

          <!-- Zone count and indicator position -->
          <div class="flex items-end gap-4 mb-4 justify-between">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Zones</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Existing zone buttons -->
                <button
                  v-for="n in botZoneCount"
                  :key="n"
                  class="px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-medium transition-colors"
                  :class="
                    n - 1 === activeBotZone
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onSelectZone('bottom', n - 1)"
                >
                  {{ n }}
                </button>
                <!-- Add zone button (only if < 3 zones) -->
                <button
                  v-if="botZoneCount < 3"
                  class="px-2 py-1 md:px-3 md:py-1.5 text-sm font-medium transition-colors bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                  title="Add zone"
                  @click="onAddZone('bottom')"
                >
                  <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
                    <path :d="mdiPlus" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="ml-auto">
              <label class="block text-xs text-gray-500 mb-1">Indicator</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="pos in INDICATOR_POSITIONS"
                  :key="pos"
                  class="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium transition-colors"
                  :class="
                    activeButton.bottom.indicatorPosition === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  :title="pos === 'inner' ? 'Near center divider' : 'Near button edge'"
                  @click="onSetIndicatorPosition('bottom', pos)"
                >
                  {{ indicatorPosLabel(pos) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Per-zone controls (paginated - only show active zone) -->
          <div
            v-if="activeButton.bottom.zones[activeBotZone]"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3"
          >
              <!-- Zone header with type selector and remove button -->
              <div class="flex items-center justify-between gap-2">
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    v-for="t in ACTION_TYPES"
                    :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="
                      activeButton.bottom.zones[activeBotZone].type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    "
                    :aria-label="`Set zone ${activeBotZone + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('bottom', activeBotZone, t)"
                  >
                      <svg v-if="t === 'single'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
                        <circle cx="12" cy="12" r="5" />
                      </svg>
                      <svg v-else-if="t === 'double'" viewBox="0 0 24 24" class="w-6 h-4" fill="currentColor">
                        <circle :cx="12+8" cy="12" r="5" /> <circle :cx="12-8" cy="12" r="5" />
                      </svg>
                      <svg v-else-if="t === 'hold'" viewBox="0 0 24 24" class="w-6 h-4" fill="currentColor">
                        <rect
                          x="-3"
                          y="7"
                          width="30"
                          height="10"
                          rx="5"
                          ry="5"
                        />
                      </svg>
                  </button>
                </div>
                <!-- Remove zone button (only for zones 2 and 3) -->
                <button
                  v-if="activeBotZone > 0"
                  class="px-2 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove this zone"
                  @click="onRemoveZone('bottom', activeBotZone)"
                >
                  Remove
                </button>
              </div>

              <!-- Icon picker -->
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 flex items-center gap-2 px-2 py-1.5 min-h-[36px] rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800"
                  :title="activeButton.bottom.zones[activeBotZone].icon ? 'Change icon' : 'Pick icon'"
                  @click="openIconPicker('bottom', activeBotZone)"
                >
                  <svg
                    v-if="activeButton.bottom.zones[activeBotZone].icon"
                    viewBox="0 0 24 24"
                    class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300"
                    fill="currentColor"
                  >
                    <path :d="activeButton.bottom.zones[activeBotZone].icon!" />
                  </svg>
                  <span class="text-gray-400 text-xs truncate" :class="{ 'text-gray-700 dark:text-gray-300': activeButton.bottom.zones[activeBotZone].icon }">
                    {{ activeButton.bottom.zones[activeBotZone].icon ? 'Change icon' : 'No icon — click to add' }}
                  </span>
                </button>
                <button
                  v-if="activeButton.bottom.zones[activeBotZone].icon"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove icon"
                  @click="clearIcon('bottom', activeBotZone)"
                >
                  ×
                </button>
              </div>

              <!-- Icon size and color (side-by-side) -->
              <div class="flex items-center gap-3 justify-between">
                <!-- Icon size (left half) -->
                <div class="flex-4 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs text-gray-500">Size</label>
                    <span class="text-xs text-gray-500">{{ activeButton.bottom.zones[activeBotZone].iconSize }} mm</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    step="0.5"
                    :value="activeButton.bottom.zones[activeBotZone].iconSize"
                    class="w-full accent-blue-600"
                    @input="onUpdateZone('bottom', activeBotZone, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))"
                  />
                </div>

                <!-- Icon rotation -->
                <div class="min-w-0 pl-2">
                  <label class="block text-xs text-gray-500 mb-1 text-left">Rotation</label>
                  <div class="flex items-center gap-1 justify-start">
                    <input
                      type="number"
                      min="-360"
                      max="360"
                      :value="activeButton.bottom.zones[activeBotZone].iconRotation ?? 0"
                      class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0"
                      @input="onUpdateZone('bottom', activeBotZone, 'iconRotation', parseFloat(($event.target as HTMLInputElement).value))"
                    />
                    <span class="text-xs text-gray-400">°</span>
                  </div>
                </div>

                <!-- Icon color (right half) -->
                <div class="min-w-0 pl-2">
                  <label class="block text-xs text-gray-500 mb-1 text-left">Color</label>
                  <div class="flex items-center gap-2 justify-start">
                    <input
                      type="color"
                      :value="activeButton.bottom.zones[activeBotZone].iconColor"
                      class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0"
                      @input="onUpdateZone('bottom', activeBotZone, 'iconColor', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
          </div>
        </section>

        <!-- separators section -->
        <section
          v-if="layout === 'horizontal' || activeHalf === 'separators'"
          :class="layout === 'horizontal' ? 'col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4' : ''"
        >
          <button
            v-if="layout === 'horizontal'"
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 hover:text-gray-700 dark:hover:text-gray-300"
            @click="separatorsExpanded = !separatorsExpanded"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
              <path :d="separatorsExpanded ? mdiChevronUp : mdiChevronDown" />
            </svg>
            separators
          </button>

          <!-- separators controls (collapsible in horizontal mode) -->
          <div
            v-show="layout !== 'horizontal' || separatorsExpanded"
            :class="layout === 'horizontal' ? 'grid grid-cols-2 gap-4' : ''"
          >
          <!-- Horizontal separator -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3" :class="layout === 'horizontal' ? '' : 'mb-4'">
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Horizontal</span>

            <!-- Thickness -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-gray-500">Thickness</label>
                <span class="text-xs text-gray-500">{{ activeButton.horizontalSeparator.thickness }} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="4.0"
                step="0.1"
                :value="activeButton.horizontalSeparator.thickness"
                class="w-full accent-blue-600"
                @input="onUpdateSeparator('horizontal', 'thickness', parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
                         <div class="flex items-center gap-3 justify-between">

            <!-- Line style -->
            <div class="flex items-center gap-2">
              <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="style in LINE_STYLES"
                  :key="style"
                  class="px-2 py-0.5 text-xs font-medium transition-colors"
                  :class="
                    activeButton.horizontalSeparator.style === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onUpdateSeparator('horizontal', 'style', style)"
                >
                  {{ lineStyleLabel(style) }}
                </button>
              </div>
            </div>
            <!-- Color -->
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="activeButton.horizontalSeparator.color"
                class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                @input="onUpdateSeparator('horizontal', 'color', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-gray-400 font-mono">{{ activeButton.horizontalSeparator.color }}</span>

            </div>


            </div>
          </div>

          <!-- Vertical separator -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Vertical</span>

            <!-- Thickness -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs text-gray-500">Thickness</label>
                <span class="text-xs text-gray-500">{{ activeButton.verticalSeparator.thickness }} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="4.0"
                step="0.1"
                :value="activeButton.verticalSeparator.thickness"
                class="w-full accent-blue-600"
                @input="onUpdateSeparator('vertical', 'thickness', parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
             <div class="flex items-center gap-3 justify-between">

            <!-- Line style -->
            <div class="flex items-center gap-2">
              <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="style in LINE_STYLES"
                  :key="style"
                  class="px-2 py-0.5 text-xs font-medium transition-colors"
                  :class="
                    activeButton.verticalSeparator.style === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onUpdateSeparator('vertical', 'style', style)"
                >
                  {{ lineStyleLabel(style) }}
                </button>
              </div>
            </div>

            <!-- Color -->
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="activeButton.verticalSeparator.color"
                class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                @input="onUpdateSeparator('vertical', 'color', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-gray-400 font-mono">{{ activeButton.verticalSeparator.color }}</span>
            </div>


             </div>
          </div>
          </div>
        </section>
      </div>
    </template>

    <!-- Icon picker modal -->
    <IconPickerModal
      :open="pickerOpen"
      :current-icon="currentPickerIcon"
      @close="pickerOpen = false"
      @select="handleIconSelect"
    />
  </div>
</template>
