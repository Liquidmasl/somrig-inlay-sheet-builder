<script setup lang="ts">
import { mdiWeatherNight, mdiWeatherSunny, mdiPrinter, mdiDownload } from '@mdi/js'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark, toggle } = useDarkMode()

function handlePrint() {
  window.print()
}
</script>

<template>
  <header class="no-print flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
      Somrig Inlay Sheet Builder
    </h1>
    <div class="flex items-center gap-2">
      <button
        @click="handlePrint"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
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
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
        aria-label="Download as PDF"
        title="Download PDF"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path :d="mdiDownload" />
        </svg>
        <span>Download PDF</span>
      </button>
      <button
        @click="toggle"
        class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path :d="isDark ? mdiWeatherSunny : mdiWeatherNight" />
        </svg>
      </button>
    </div>
  </header>
</template>
