<script setup lang="ts">
import {
  mdiChevronDown,
  mdiChevronUp,
  mdiImageOffOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useSheets } from '../composables/useSheets'
import type {
  ActionType,
  ActionZone,
  IndicatorPosition,
  LineStyle,
  SeparatorStyle,
} from '../types'
import IconPickerModal from './IconPickerModal.vue'

const props = withDefaults(
  defineProps<{
    /** Layout mode: 'vertical' (sidebar) or 'horizontal' (floating bottom panel) */
    layout?: 'vertical' | 'horizontal'
  }>(),
  {
    layout: 'vertical',
  },
)

const {
  activeButton,
  setZoneCount,
  updateZone,
  setIndicatorPosition,
  updateSeparator,
} = useSheets()

// Active zone for pagination (0-indexed: 0, 1, or 2)
const activeTopZone = ref(0)
const activeBotZone = ref(0)

// Active sub-tab within zone card: 'icon' or 'label'
const activeTopZoneTab = ref<'icon' | 'label'>('icon')
const activeBotZoneTab = ref<'icon' | 'label'>('icon')

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
const pickerTarget = ref<{ half: 'top' | 'bottom'; zoneIndex: number } | null>(
  null,
)

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
  updateZone(
    activeButton.value.id,
    pickerTarget.value.half,
    pickerTarget.value.zoneIndex,
    {
      icon: path,
    },
  )
}

function clearIcon(half: 'top' | 'bottom', zoneIndex: number) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { icon: null })
}

function actionTypeLabel(type: ActionType): string {
  if (type === 'single') return 'Single'
  if (type === 'double') return 'Double'
  if (type === 'hold') return 'Hold'
  return 'None'
}

const topZoneCount = computed(
  () => (activeButton.value?.top.zones.length ?? 1) as 1 | 2 | 3,
)
const botZoneCount = computed(
  () => (activeButton.value?.bottom.zones.length ?? 1) as 1 | 2 | 3,
)

const ACTION_TYPES: ActionType[] = ['single', 'double', 'hold', 'none']

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
  const phys =
    half === 'top' ? activeButton.value.top : activeButton.value.bottom
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
  field: keyof ActionZone,
  value: string | number | boolean,
) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { [field]: value } as Partial<ActionZone>)
}

function onSetZoneType(
  half: 'top' | 'bottom',
  zoneIndex: number,
  type: ActionType,
) {
  if (!activeButton.value) return
  updateZone(activeButton.value.id, half, zoneIndex, { type })
}

function onSetIndicatorPosition(
  half: 'top' | 'bottom',
  position: IndicatorPosition,
) {
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
    :class="layout === 'horizontal' ? 'bg-white dark:bg-gray-900' : 'min-h-[280px] md:h-full flex flex-col bg-gray-50 dark:bg-gray-900'"
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
          class="flex-1 px-4 py-1 text-sm font-medium transition-colors"
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
          class="flex-1 px-4 py-1 text-sm font-medium transition-colors"
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
          class="flex-1 px-4 py-1 text-sm font-medium transition-colors"
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
          <!-- Top Half header (horizontal only) -->
          <h3
            v-if="layout === 'horizontal'"
            class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3"
          >Top Half</h3>

          <!-- Zone tabs (left) + Indicator (right) — both belong to this half -->
          <div class="flex items-center justify-between mb-0 mt-2">
            <!-- Zone tabs on LEFT (index-card, connecting to zone card below) -->
            <div class="flex items-end">
              <button
                v-for="n in topZoneCount" :key="n"
                class="px-3 py-2 text-xs font-medium border transition-colors relative -mb-px z-10 flex items-center gap-1"
                :class="[
                  n === 1 ? 'rounded-tl-md' : 'border-l-0',
                  n === topZoneCount && topZoneCount === 3 ? 'rounded-tr-md' : '',
                  n - 1 === activeTopZone
                    ? 'border-gray-200 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
                ]"
                @click="onSelectZone('top', n - 1)"
              >
                {{ n }}<span v-if="n > 1 && n - 1 === activeTopZone" class="text-red-500 font-bold leading-none" @click.stop="onRemoveZone('top', n - 1)" title="Remove zone">×</span>
              </button>
              <button
                v-if="topZoneCount < 3"
                class="px-2 py-2 text-xs font-medium border border-l-0 rounded-tr-md transition-colors relative -mb-px z-10 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Add zone"
                @click="onAddZone('top')"
              >+</button>
            </div>
            <!-- Indicator on RIGHT (self-start so it doesn't touch the zone card) -->
            <div class="self-start inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                v-for="pos in INDICATOR_POSITIONS" :key="pos"
                class="px-2 py-1 text-xs font-medium transition-colors"
                :class="activeButton.top.indicatorPosition === pos ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                :title="pos === 'inner' ? 'Near center divider' : 'Near button edge'"
                @click="onSetIndicatorPosition('top', pos)"
              >{{ indicatorPosLabel(pos) }}</button>
            </div>
          </div>

          <!-- Zone card -->
          <div v-if="activeButton.top.zones[activeTopZone]" class="border border-gray-200 dark:border-gray-700 rounded-b-lg rounded-tr-lg bg-white dark:bg-gray-800">

              <div class="flex items-end justify-between px-3 pt-2">
                <!-- Action type selector -->
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden self-start">
                  <button
                    v-for="t in ACTION_TYPES" :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="activeButton.top.zones[activeTopZone].type === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                    :aria-label="`Set zone ${activeTopZone + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('top', activeTopZone, t)"
                  >
                    <svg v-if="t === 'single'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                    <svg v-else-if="t === 'double'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><circle :cx="12+7" cy="12" r="4" /><circle :cx="12-7" cy="12" r="4" /></svg>
                    <svg v-else-if="t === 'hold'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><rect x="2" y="8" width="20" height="8" rx="4" ry="4" /></svg>
                    <span v-else-if="t === 'none'" class="text-xs">none</span>
                  </button>
                </div>
                <!-- Icon/Label index-card tabs -->
                 <div v-if="activeButton.top.zones[activeTopZone].icon" class="flex self-center">
                                     <label class="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" :checked="activeButton.top.zones[activeTopZone].labelShiftIcon ?? false" class="rounded accent-blue-600" @change="onUpdateZone('top', activeTopZone, 'labelShiftIcon', ($event.target as HTMLInputElement).checked)" />
                      <span class="text-xs text-gray-500">Shift icon</span>
                    </label>
                  </div>

                <div class="flex items-end">
                  <button
                    class="px-3 pt-1 pb-2 text-xs font-medium border rounded-tl-md transition-colors relative -mb-px z-10"
                    :class="activeTopZoneTab === 'icon'
                      ? 'border-gray-200 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
                    @click="activeTopZoneTab = 'icon'"
                  >Icon</button>
                  <button
                    class="px-3 pt-1 pb-2 text-xs font-medium border border-l-0 rounded-tr-md transition-colors relative -mb-px z-10"
                    :class="activeTopZoneTab === 'label'
                      ? 'border-gray-200 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
                    @click="activeTopZoneTab = 'label'"
                  >Label</button>
                </div>
              </div>
                            <!-- Content connected via border-t -->

              <div class="px-3 pb-2">
              <div class="border border-gray-200 dark:bg-gray-900 dark:border-gray-600 p-3 space-y-3 rounded-b-lg rounded-tl-lg">

                <template v-if="activeTopZoneTab === 'icon'">
                  <div class="flex items-center gap-2">
                    <button class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800"
                      :title="activeButton.top.zones[activeTopZone].icon ? 'Change icon' : 'Pick icon'"
                      @click="openIconPicker('top', activeTopZone)"
                    >
                      <svg v-if="activeButton.top.zones[activeTopZone].icon" viewBox="0 0 24 24" class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300" fill="currentColor">
                        <path :d="activeButton.top.zones[activeTopZone].icon!" />
                      </svg>
                      <span class="text-gray-400 text-xs truncate" :class="{ 'text-gray-700 dark:text-gray-300': activeButton.top.zones[activeTopZone].icon }">
                        {{ activeButton.top.zones[activeTopZone].icon ? 'Change icon' : 'No icon — click to add' }}
                      </span>
                    </button>
                    <button v-if="activeButton.top.zones[activeTopZone].icon" class="rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove icon" @click="clearIcon('top', activeTopZone)">×</button>
                  </div>
                  <div class="flex items-center gap-3 justify-between">
                    <div class="flex-4 min-w-0">
                      <div class="flex items-center justify-between mb-1"><label class="text-xs text-gray-500">Size</label><span class="text-xs text-gray-500">{{ activeButton.top.zones[activeTopZone].iconSize }} mm</span></div>
                      <input type="range" min="0" max="25" step="0.5" :value="activeButton.top.zones[activeTopZone].iconSize" class="w-full accent-blue-600" @input="onUpdateZone('top', activeTopZone, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))" />
                    </div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Rotation</label><div class="flex items-center gap-1"><input type="number" min="-360" max="360" :value="activeButton.top.zones[activeTopZone].iconRotation ?? 0" class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0" @input="onUpdateZone('top', activeTopZone, 'iconRotation', parseFloat(($event.target as HTMLInputElement).value))" /><span class="text-xs text-gray-400">°</span></div></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Color</label><input type="color" :value="activeButton.top.zones[activeTopZone].iconColor" class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0" @input="onUpdateZone('top', activeTopZone, 'iconColor', ($event.target as HTMLInputElement).value)" /></div>
                  </div>
                </template>
                <template v-else>
                                    <div class="flex items-center gap-3 justify-between">

                  <input type="text" :value="activeButton.top.zones[activeTopZone].label ?? ''" placeholder="Add label…" class="flex-4 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs" @input="onUpdateZone('top', activeTopZone, 'label', ($event.target as HTMLInputElement).value)" />
                                    <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button class="px-2 py-0.5 text-xs font-medium transition-colors" :class="(activeButton.top.zones[activeTopZone].labelPosition ?? 'below') === 'below' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'" @click="onUpdateZone('top', activeTopZone, 'labelPosition', 'below')">Below</button>
                      <button class="px-2 py-0.5 text-xs font-medium transition-colors" :class="activeButton.top.zones[activeTopZone].labelPosition === 'above' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'" @click="onUpdateZone('top', activeTopZone, 'labelPosition', 'above')">Above</button>
                    </div>
  
                </div>
                  <div class="flex items-center gap-3 justify-between">
                    <div class="flex-4 min-w-0">
                      <div class="flex items-center justify-between mb-1"><label class="text-xs text-gray-500">Size</label><span class="text-xs text-gray-500">{{ activeButton.top.zones[activeTopZone].labelSize ?? 3 }} mm</span></div>
                      <input type="range" min="1" max="10" step="0.5" :value="activeButton.top.zones[activeTopZone].labelSize ?? 3" class="w-full accent-blue-600" @input="onUpdateZone('top', activeTopZone, 'labelSize', parseFloat(($event.target as HTMLInputElement).value))" />
                    </div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Rotation</label><div class="flex items-center gap-1"><input type="number" min="-360" max="360" :value="activeButton.top.zones[activeTopZone].labelRotation ?? 0" class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0" @input="onUpdateZone('top', activeTopZone, 'labelRotation', parseFloat(($event.target as HTMLInputElement).value))" /><span class="text-xs text-gray-400">°</span></div></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Color</label><input type="color" :value="activeButton.top.zones[activeTopZone].labelColor ?? activeButton.top.zones[activeTopZone].iconColor" class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0" @input="onUpdateZone('top', activeTopZone, 'labelColor', ($event.target as HTMLInputElement).value)" /></div>
                  </div>
                </template>
              </div>
              </div>


          </div>
        </section>

        <!-- Bottom half -->
        <section
          v-if="layout === 'horizontal' || activeHalf === 'bottom'"
          :class="layout === 'horizontal' ? 'space-y-4' : ''"
        >
          <!-- Bottom Half header (horizontal only) -->
          <h3
            v-if="layout === 'horizontal'"
            class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3"
          >Bottom Half</h3>

          <!-- Zone tabs (left) + Indicator (right) -->
          <div class="flex items-center justify-between mb-0 mt-2">
            <!-- Zone tabs on LEFT -->
            <div class="flex items-end">
              <button
                v-for="n in botZoneCount" :key="n"
                class="px-3 py-2 text-xs font-medium border transition-colors relative -mb-px z-10 flex items-center gap-1"
                :class="[
                  n === 1 ? 'rounded-tl-md' : 'border-l-0',
                  n === botZoneCount && botZoneCount === 3 ? 'rounded-tr-md' : '',
                  n - 1 === activeBotZone
                    ? 'border-gray-200 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
                ]"
                @click="onSelectZone('bottom', n - 1)"
              >
                {{ n }}<span v-if="n > 1 && n - 1 === activeBotZone" class="text-red-500 font-bold leading-none" @click.stop="onRemoveZone('bottom', n - 1)" title="Remove zone">×</span>
              </button>
              <button
                v-if="botZoneCount < 3"
                class="px-2 py-2 text-xs font-medium border border-l-0 rounded-tr-md transition-colors relative -mb-px z-10 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Add zone"
                @click="onAddZone('bottom')"
              >+</button>
            </div>
            <!-- Indicator on RIGHT -->
            <div class="self-start inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                v-for="pos in INDICATOR_POSITIONS" :key="pos"
                class="px-2 py-1 text-xs font-medium transition-colors"
                :class="activeButton.bottom.indicatorPosition === pos ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                :title="pos === 'inner' ? 'Near center divider' : 'Near button edge'"
                @click="onSetIndicatorPosition('bottom', pos)"
              >{{ indicatorPosLabel(pos) }}</button>
            </div>
          </div>

          <!-- Zone card -->
          <div v-if="activeButton.bottom.zones[activeBotZone]" class="border border-gray-200 dark:border-gray-700 rounded-b-lg rounded-tr-lg bg-white dark:bg-gray-800">

              <div class="flex items-end justify-between px-3 pt-2">
                <div class="self-start inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    v-for="t in ACTION_TYPES" :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="activeButton.bottom.zones[activeBotZone].type === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                    :aria-label="`Set zone ${activeBotZone + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('bottom', activeBotZone, t)"
                  >
                    <svg v-if="t === 'single'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                    <svg v-else-if="t === 'double'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><circle :cx="12+7" cy="12" r="4" /><circle :cx="12-7" cy="12" r="4" /></svg>
                    <svg v-else-if="t === 'hold'" viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><rect x="2" y="8" width="20" height="8" rx="4" ry="4" /></svg>
                    <span v-else-if="t === 'none'" class="text-xs">none</span>
                                    </button>
                </div>
                <div v-if="activeButton.bottom.zones[activeBotZone].icon" class="flex self-center">
                                  <label class="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" :checked="activeButton.bottom.zones[activeBotZone].labelShiftIcon ?? false" class="rounded accent-blue-600" @change="onUpdateZone('bottom', activeBotZone, 'labelShiftIcon', ($event.target as HTMLInputElement).checked)" />
                      <span class="text-xs text-gray-400">Shift icon</span>
                    </label>
                  </div>
                <div class="flex items-end">
                  <button
                    class="px-3 pt-1 pb-2 text-xs font-medium border rounded-tl-md transition-colors relative -mb-px z-10"
                    :class="activeBotZoneTab === 'icon'
                      ? 'border-gray-200 dark:border-gray-600 border-b-0 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
                    @click="activeBotZoneTab = 'icon'"
                  >Icon</button>
                  <button
                    class="px-3 pt-1 pb-2 text-xs font-medium border border-l-0 rounded-tr-md transition-colors relative -mb-px z-10"
                    :class="activeBotZoneTab === 'label'
                      ? 'border-gray-200 dark:border-gray-600 border-b-0 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
                    @click="activeBotZoneTab = 'label'"
                  >Label</button>
                </div>
              </div>
              <div class="px-3 pb-2">
              <div class="border border-gray-200 dark:bg-gray-900 dark:border-gray-600 p-3 space-y-3 rounded-b-lg rounded-tl-lg">
                <template v-if="activeBotZoneTab === 'icon'">
                  <div class="flex items-center gap-2">
                    <button class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800" :title="activeButton.bottom.zones[activeBotZone].icon ? 'Change icon' : 'Pick icon'" @click="openIconPicker('bottom', activeBotZone)">
                      <svg v-if="activeButton.bottom.zones[activeBotZone].icon" viewBox="0 0 24 24" class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300" fill="currentColor"><path :d="activeButton.bottom.zones[activeBotZone].icon!" /></svg>
                      <span class="text-gray-400 text-xs truncate" :class="{ 'text-gray-700 dark:text-gray-300': activeButton.bottom.zones[activeBotZone].icon }">{{ activeButton.bottom.zones[activeBotZone].icon ? 'Change icon' : 'No icon — click to add' }}</span>
                    </button>
                    <button v-if="activeButton.bottom.zones[activeBotZone].icon" class=" rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove icon" @click="clearIcon('bottom', activeBotZone)">×</button>
                  </div>
                  <div class="flex items-center gap-3 justify-between">
                    <div class="flex-4 min-w-0"><div class="flex items-center justify-between mb-1"><label class="text-xs text-gray-500">Size</label><span class="text-xs text-gray-500">{{ activeButton.bottom.zones[activeBotZone].iconSize }} mm</span></div><input type="range" min="0" max="25" step="0.5" :value="activeButton.bottom.zones[activeBotZone].iconSize" class="w-full accent-blue-600" @input="onUpdateZone('bottom', activeBotZone, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))" /></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Rotation</label><div class="flex items-center gap-1"><input type="number" min="-360" max="360" :value="activeButton.bottom.zones[activeBotZone].iconRotation ?? 0" class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0" @input="onUpdateZone('bottom', activeBotZone, 'iconRotation', parseFloat(($event.target as HTMLInputElement).value))" /><span class="text-xs text-gray-400">°</span></div></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Color</label><input type="color" :value="activeButton.bottom.zones[activeBotZone].iconColor" class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0" @input="onUpdateZone('bottom', activeBotZone, 'iconColor', ($event.target as HTMLInputElement).value)" /></div>
                  </div>
                </template>
                <template v-else>
                                    <div class="flex items-center gap-3 justify-between">

                  <input type="text" :value="activeButton.bottom.zones[activeBotZone].label ?? ''" placeholder="Add label…" class="flex-4 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs" @input="onUpdateZone('bottom', activeBotZone, 'label', ($event.target as HTMLInputElement).value)" />
                                    <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button class="px-2 py-0.5 text-xs font-medium transition-colors" :class="(activeButton.bottom.zones[activeBotZone].labelPosition ?? 'below') === 'below' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'" @click="onUpdateZone('bottom', activeBotZone, 'labelPosition', 'below')">Below</button>
                      <button class="px-2 py-0.5 text-xs font-medium transition-colors" :class="activeButton.bottom.zones[activeBotZone].labelPosition === 'above' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'" @click="onUpdateZone('bottom', activeBotZone, 'labelPosition', 'above')">Above</button>
                    </div>
  
                </div>
                  <div class="flex items-center gap-3 justify-between">
                    <div class="flex-4 min-w-0"><div class="flex items-center justify-between mb-1"><label class="text-xs text-gray-500">Size</label><span class="text-xs text-gray-500">{{ activeButton.bottom.zones[activeBotZone].labelSize ?? 3 }} mm</span></div><input type="range" min="1" max="10" step="0.5" :value="activeButton.bottom.zones[activeBotZone].labelSize ?? 3" class="w-full accent-blue-600" @input="onUpdateZone('bottom', activeBotZone, 'labelSize', parseFloat(($event.target as HTMLInputElement).value))" /></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Rotation</label><div class="flex items-center gap-1"><input type="number" min="-360" max="360" :value="activeButton.bottom.zones[activeBotZone].labelRotation ?? 0" class="h-7 w-10 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-center shrink-0" @input="onUpdateZone('bottom', activeBotZone, 'labelRotation', parseFloat(($event.target as HTMLInputElement).value))" /><span class="text-xs text-gray-400">°</span></div></div>
                    <div class="min-w-0 pl-2"><label class="block text-xs text-gray-500 mb-1">Color</label><input type="color" :value="activeButton.bottom.zones[activeBotZone].labelColor ?? activeButton.bottom.zones[activeBotZone].iconColor" class="h-7 w-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent shrink-0" @input="onUpdateZone('bottom', activeBotZone, 'labelColor', ($event.target as HTMLInputElement).value)" /></div>
                  </div>
                </template>
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
