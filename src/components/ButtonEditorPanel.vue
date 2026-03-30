<script setup lang="ts">
import { ref, computed } from 'vue'
import { mdiImageOffOutline, mdiChevronDown, mdiChevronUp } from '@mdi/js'
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

function indicatorSymbol(type: ActionType): string {
  if (type === 'single') return '●'
  if (type === 'double') return '●●'
  return '▬'
}

const topZoneCount = computed(() => (activeButton.value?.top.zones.length ?? 1) as 1 | 2 | 3)
const botZoneCount = computed(() => (activeButton.value?.bottom.zones.length ?? 1) as 1 | 2 | 3)

const ACTION_TYPES: ActionType[] = ['single', 'hold', 'double']

function onSetZoneCount(half: 'top' | 'bottom', count: 1 | 2 | 3) {
  if (!activeButton.value) return
  setZoneCount(activeButton.value.id, half, count)
}

function onUpdateZone(
  half: 'top' | 'bottom',
  zoneIndex: number,
  field: 'iconSize' | 'iconColor',
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
      <!-- Controls container: vertical stack or horizontal grid -->
      <div
        :class="layout === 'horizontal'
          ? 'grid grid-cols-2 gap-4 p-4'
          : 'flex-1 overflow-y-auto p-4 space-y-6'"
      >
        <!-- Top half -->
        <section :class="layout === 'horizontal' ? 'space-y-4' : ''">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Top Half
          </h3>

          <!-- Zone count and indicator position -->
          <div class="flex items-end gap-4 mb-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Zones</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="n in [1, 2, 3]"
                  :key="n"
                  class="px-4 py-1.5 text-sm font-medium transition-colors"
                  :class="
                    topZoneCount === n
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onSetZoneCount('top', n as 1 | 2 | 3)"
                >
                  {{ n }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Indicator</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="pos in INDICATOR_POSITIONS"
                  :key="pos"
                  class="px-3 py-1.5 text-xs font-medium transition-colors"
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

          <!-- Per-zone controls -->
          <div class="space-y-4">
            <div
              v-for="(zone, i) in activeButton.top.zones"
              :key="i"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3"
            >
              <!-- Zone header with type selector -->
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                  Zone {{ i + 1 }}
                </span>
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    v-for="t in ACTION_TYPES"
                    :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="
                      zone.type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    "
                    :aria-label="`Set zone ${i + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('top', i, t)"
                  >
                    {{ indicatorSymbol(t) }}
                  </button>
                </div>
              </div>

              <!-- Icon picker -->
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800"
                  :title="zone.icon ? 'Change icon' : 'Pick icon'"
                  @click="openIconPicker('top', i)"
                >
                  <svg
                    v-if="zone.icon"
                    viewBox="0 0 24 24"
                    class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300"
                    fill="currentColor"
                  >
                    <path :d="zone.icon" />
                  </svg>
                  <span class="text-gray-400 text-xs" :class="{ 'text-gray-700 dark:text-gray-300': zone.icon }">
                    {{ zone.icon ? 'Change icon' : 'No icon — click to add' }}
                  </span>
                </button>
                <button
                  v-if="zone.icon"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove icon"
                  @click="clearIcon('top', i)"
                >
                  ×
                </button>
              </div>

              <!-- Icon size -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs text-gray-500">Size</label>
                  <span class="text-xs text-gray-500">{{ zone.iconSize }} mm</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="0.5"
                  :value="zone.iconSize"
                  class="w-full accent-blue-600"
                  @input="onUpdateZone('top', i, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))"
                />
              </div>

              <!-- Icon color -->
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500 w-10 shrink-0">Color</label>
                <input
                  type="color"
                  :value="zone.iconColor"
                  class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                  @input="onUpdateZone('top', i, 'iconColor', ($event.target as HTMLInputElement).value)"
                />
                <span class="text-xs text-gray-400 font-mono">{{ zone.iconColor }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bottom half -->
        <section :class="layout === 'horizontal' ? 'space-y-4' : ''">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Bottom Half
          </h3>

          <!-- Zone count and indicator position -->
          <div class="flex items-end gap-4 mb-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Zones</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="n in [1, 2, 3]"
                  :key="n"
                  class="px-4 py-1.5 text-sm font-medium transition-colors"
                  :class="
                    botZoneCount === n
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @click="onSetZoneCount('bottom', n as 1 | 2 | 3)"
                >
                  {{ n }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Indicator</label>
              <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  v-for="pos in INDICATOR_POSITIONS"
                  :key="pos"
                  class="px-3 py-1.5 text-xs font-medium transition-colors"
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

          <!-- Per-zone controls -->
          <div class="space-y-4">
            <div
              v-for="(zone, i) in activeButton.bottom.zones"
              :key="i"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3"
            >
              <!-- Zone header with type selector -->
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                  Zone {{ i + 1 }}
                </span>
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    v-for="t in ACTION_TYPES"
                    :key="t"
                    class="px-2 py-0.5 text-xs font-medium transition-colors"
                    :class="
                      zone.type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    "
                    :aria-label="`Set zone ${i + 1} type to ${actionTypeLabel(t)}`"
                    @click="onSetZoneType('bottom', i, t)"
                  >
                    {{ indicatorSymbol(t) }}
                  </button>
                </div>
              </div>

              <!-- Icon picker -->
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-sm text-left transition-colors bg-white dark:bg-gray-800"
                  :title="zone.icon ? 'Change icon' : 'Pick icon'"
                  @click="openIconPicker('bottom', i)"
                >
                  <svg
                    v-if="zone.icon"
                    viewBox="0 0 24 24"
                    class="w-5 h-5 shrink-0 text-gray-700 dark:text-gray-300"
                    fill="currentColor"
                  >
                    <path :d="zone.icon" />
                  </svg>
                  <span class="text-gray-400 text-xs" :class="{ 'text-gray-700 dark:text-gray-300': zone.icon }">
                    {{ zone.icon ? 'Change icon' : 'No icon — click to add' }}
                  </span>
                </button>
                <button
                  v-if="zone.icon"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove icon"
                  @click="clearIcon('bottom', i)"
                >
                  ×
                </button>
              </div>

              <!-- Icon size -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs text-gray-500">Size</label>
                  <span class="text-xs text-gray-500">{{ zone.iconSize }} mm</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="0.5"
                  :value="zone.iconSize"
                  class="w-full accent-blue-600"
                  @input="onUpdateZone('bottom', i, 'iconSize', parseFloat(($event.target as HTMLInputElement).value))"
                />
              </div>

              <!-- Icon color -->
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500 w-10 shrink-0">Color</label>
                <input
                  type="color"
                  :value="zone.iconColor"
                  class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                  @input="onUpdateZone('bottom', i, 'iconColor', ($event.target as HTMLInputElement).value)"
                />
                <span class="text-xs text-gray-400 font-mono">{{ zone.iconColor }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Separators section -->
        <section :class="layout === 'horizontal' ? 'col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4' : ''">
          <button
            v-if="layout === 'horizontal'"
            class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 hover:text-gray-700 dark:hover:text-gray-300"
            @click="separatorsExpanded = !separatorsExpanded"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
              <path :d="separatorsExpanded ? mdiChevronUp : mdiChevronDown" />
            </svg>
            Separators
          </button>
          <h3 v-else class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Separators
          </h3>

          <!-- Separator controls (collapsible in horizontal mode) -->
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
                min="0.1"
                max="1.5"
                step="0.1"
                :value="activeButton.horizontalSeparator.thickness"
                class="w-full accent-blue-600"
                @input="onUpdateSeparator('horizontal', 'thickness', parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>

            <!-- Color -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 w-14 shrink-0">Color</label>
              <input
                type="color"
                :value="activeButton.horizontalSeparator.color"
                class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                @input="onUpdateSeparator('horizontal', 'color', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-gray-400 font-mono">{{ activeButton.horizontalSeparator.color }}</span>
            </div>

            <!-- Line style -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 w-14 shrink-0">Style</label>
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
                min="0.1"
                max="1.5"
                step="0.1"
                :value="activeButton.verticalSeparator.thickness"
                class="w-full accent-blue-600"
                @input="onUpdateSeparator('vertical', 'thickness', parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>

            <!-- Color -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 w-14 shrink-0">Color</label>
              <input
                type="color"
                :value="activeButton.verticalSeparator.color"
                class="h-7 w-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
                @input="onUpdateSeparator('vertical', 'color', ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-gray-400 font-mono">{{ activeButton.verticalSeparator.color }}</span>
            </div>

            <!-- Line style -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 w-14 shrink-0">Style</label>
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
