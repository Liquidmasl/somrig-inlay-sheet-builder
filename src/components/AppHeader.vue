<script setup lang="ts">
import { ref } from 'vue'
import { mdiWeatherNight, mdiWeatherSunny, mdiPrinter, mdiDownload, mdiHeart } from '@mdi/js'
import { useDarkMode } from '../composables/useDarkMode'
import DonationModal from './DonationModal.vue'

const { isDark, toggle } = useDarkMode()
const showDonation = ref(false)

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
      <!-- Donation button -->
      <button
        @click="showDonation = true"
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
        aria-label="Support this project"
        title="Support this project"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path :d="mdiHeart" />
        </svg>
        <span class="hidden sm:inline">Support</span>
      </button>

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

  <DonationModal :open="showDonation" @close="showDonation = false" />
</template>
