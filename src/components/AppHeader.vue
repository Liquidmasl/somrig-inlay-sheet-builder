<script setup lang="ts">
import { ref } from 'vue'
import { mdiWeatherNight, mdiWeatherSunny, mdiHeart } from '@mdi/js'
import { useDarkMode } from '../composables/useDarkMode'
import DonationModal from './DonationModal.vue'

const { isDark, toggle } = useDarkMode()
const showDonation = ref(false)
</script>

<template>
  <header class="no-print flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <h1 class="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
      Somrig Sheets
    </h1>
    <div class="flex items-center gap-1 md:gap-2">
      <!-- Donation button -->
      <button
        @click="showDonation = true"
        class="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs md:text-sm font-medium"
        aria-label="Support this project"
        title="Support this project"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 md:w-5 md:h-5 fill-current">
          <path :d="mdiHeart" />
        </svg>
        <span class="hidden sm:inline">Support</span>
      </button>

      <button
        @click="toggle"
        class="p-1.5 md:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 md:w-5 md:h-5 fill-current">
          <path :d="isDark ? mdiWeatherSunny : mdiWeatherNight" />
        </svg>
      </button>
    </div>
  </header>

  <DonationModal :open="showDonation" @close="showDonation = false" />
</template>
