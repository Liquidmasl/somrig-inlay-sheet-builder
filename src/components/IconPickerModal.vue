<script setup lang="ts">
import { ref, computed } from 'vue'
import { mdiMagnify, mdiClose } from '@mdi/js'
import { MDI_ICONS } from '../data/mdiIcons'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  select: [path: string]
}>()

const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return MDI_ICONS
  return MDI_ICONS.filter(i => i.name.toLowerCase().includes(q))
})

function handleSelect(path: string) {
  emit('select', path)
  emit('close')
  search.value = ''
}

function handleClose() {
  emit('close')
  search.value = ''
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="handleClose"
    >
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
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
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-gray-400 shrink-0" fill="currentColor">
              <path :d="mdiMagnify" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="Search icons..."
              class="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <!-- Icon Grid -->
        <div class="overflow-y-auto p-3">
          <div v-if="filtered.length === 0" class="text-center text-gray-400 py-8 text-sm">
            No icons found
          </div>
          <div class="grid grid-cols-6 gap-1">
            <button
              v-for="icon in filtered"
              :key="icon.name"
              :title="icon.name"
              class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              @click="handleSelect(icon.path)"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-7 h-7 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                fill="currentColor"
              >
                <path :d="icon.path" />
              </svg>
              <span class="text-[9px] text-gray-400 text-center leading-tight line-clamp-2">{{ icon.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
