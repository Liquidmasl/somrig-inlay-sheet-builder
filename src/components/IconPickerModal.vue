<script setup lang="ts">
import { mdiClose, mdiMagnify } from '@mdi/js'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { IconOption } from '../data/mdiIcons'

const props = defineProps<{
  open: boolean
  currentIcon?: string | null
}>()

const emit = defineEmits<{
  close: []
  select: [path: string]
}>()

// --- Icon data (lazy-loaded on first open) ---
const allIcons = ref<IconOption[]>([])
const iconsLoading = ref(false)
const iconsLoaded = ref(false)

async function loadIcons() {
  if (iconsLoaded.value || iconsLoading.value) return
  iconsLoading.value = true
  const { MDI_ALL_ICONS } = await import('../data/mdiAllIcons')
  allIcons.value = MDI_ALL_ICONS
  iconsLoaded.value = true
  iconsLoading.value = false
}

// --- Search with debounce ---
const searchInput = ref('')
const search = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchInput, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search.value = val
    // Reset scroll to top when search changes
    if (gridScrollRef.value) gridScrollRef.value.scrollTop = 0
    scrollTop.value = 0
  }, 300)
})

const filteredIcons = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allIcons.value
  return allIcons.value.filter((i) => i.name.toLowerCase().includes(q))
})

// --- Virtual scrolling ---
const COLS = 6
const ITEM_HEIGHT = 72 // px — fixed height for each icon button
const ROW_GAP = 4 // gap-1 = 4px
const ROW_HEIGHT = ITEM_HEIGHT + ROW_GAP // 76px per row slot
const OVERSCAN = 4 // extra rows to render above/below viewport

const gridScrollRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerH = ref(380)
let ro: ResizeObserver | null = null

function onScroll() {
  scrollTop.value = gridScrollRef.value?.scrollTop ?? 0
}

const totalRows = computed(() => Math.ceil(filteredIcons.value.length / COLS))
const totalHeight = computed(() => totalRows.value * ROW_HEIGHT)

const startRow = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN),
)
const endRow = computed(() =>
  Math.min(
    totalRows.value,
    Math.ceil((scrollTop.value + containerH.value) / ROW_HEIGHT) + OVERSCAN,
  ),
)

const visibleIcons = computed(() =>
  filteredIcons.value.slice(startRow.value * COLS, endRow.value * COLS),
)

const gridOffsetTop = computed(() => startRow.value * ROW_HEIGHT)

// --- Modal lifecycle ---
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await loadIcons()
      await nextTick()
      if (gridScrollRef.value) {
        containerH.value = gridScrollRef.value.clientHeight
        ro = new ResizeObserver(() => {
          containerH.value = gridScrollRef.value?.clientHeight ?? 380
        })
        ro.observe(gridScrollRef.value)
      }
    } else {
      ro?.disconnect()
      ro = null
    }
  },
)

onUnmounted(() => {
  ro?.disconnect()
  clearTimeout(debounceTimer)
})

// --- Actions ---
function handleSelect(path: string) {
  emit('select', path)
  emit('close')
  searchInput.value = ''
  search.value = ''
  scrollTop.value = 0
}

function handleClose() {
  emit('close')
  searchInput.value = ''
  search.value = ''
  scrollTop.value = 0
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="handleClose"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
        style="max-height: 80vh"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span class="font-semibold text-gray-900 dark:text-white">Pick Icon</span>
          <button
            class="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
            @click="handleClose"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor">
              <path :d="mdiClose" />
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-gray-400 shrink-0" fill="currentColor">
              <path :d="mdiMagnify" />
            </svg>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Search icons..."
              autofocus
              class="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="iconsLoading"
          class="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm"
        >
          Loading icons…
        </div>

        <!-- Virtual icon grid -->
        <div
          v-else
          ref="gridScrollRef"
          class="flex-1 min-h-0 overflow-y-auto relative"
          @scroll.passive="onScroll"
        >
          <!-- No results -->
          <div
            v-if="filteredIcons.length === 0"
            class="text-center text-gray-400 py-8 text-sm"
          >
            No icons found
          </div>

          <!-- Full scroll height container -->
          <div v-else :style="{ height: totalHeight + 'px', position: 'relative' }">
            <!-- Visible rows positioned at the correct offset -->
            <div
              class="absolute left-0 right-0 px-3"
              :style="{ top: gridOffsetTop + 'px' }"
            >
              <div class="grid grid-cols-6 gap-1">
                <button
                  v-for="icon in visibleIcons"
                  :key="icon.name"
                  :title="icon.name"
                  class="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg transition-colors group h-[72px]"
                  :class="
                    icon.path === currentIcon
                      ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-inset ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  "
                  @click="handleSelect(icon.path)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="w-7 h-7 shrink-0 transition-colors"
                    :class="
                      icon.path === currentIcon
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    "
                    fill="currentColor"
                  >
                    <path :d="icon.path" />
                  </svg>
                  <span class="text-[9px] text-gray-400 text-center leading-tight line-clamp-2 w-full">
                    {{ icon.name }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Result count footer -->
        <div
          v-if="!iconsLoading && allIcons.length > 0"
          class="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 shrink-0"
        >
          <span class="text-xs text-gray-400">
            {{ filteredIcons.length.toLocaleString() }} icon{{ filteredIcons.length === 1 ? '' : 's' }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
