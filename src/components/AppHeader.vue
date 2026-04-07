<script setup lang="ts">
import { mdiHeart, mdiWeatherNight, mdiWeatherSunny } from '@mdi/js'
import { ref } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'
import DonationModal from './DonationModal.vue'

const { isDark, toggle } = useDarkMode()
const showDonation = ref(false)
</script>

<template>
  <header class="no-print flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div class="flex items-center gap-2">
      <img src="/lambda_icon.png" alt="Logo" class="h-7 w-auto" />
      <h1 class="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
        Somrig & Rodret Inlays
      </h1>
    </div>
    <div class="flex items-center gap-1 md:gap-2">
      <!-- GitHub link -->
      <a
        href="https://github.com/Liquidmasl/somrig-inlay-sheet-builder"
        target="_blank"
        rel="noopener noreferrer"
        class="p-1.5 md:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="View on GitHub"
        title="View on GitHub"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 md:w-5 md:h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      </a>

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
        <div class="flex items-center flex-col">
                            <span class="hidden sm:inline">No Ads, send me joy!</span>

                  <span class="hidden sm:inline">€1 = Dev Dopamine ⚡</span>
          </div>
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
