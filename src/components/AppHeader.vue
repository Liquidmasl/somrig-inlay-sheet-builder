<script setup lang="ts">
import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark, toggle } = useDarkMode()
</script>

<template>
  <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
      Somrig Inlay Sheet Builder
    </h1>
    <button
      @click="toggle"
      class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
        <path :d="isDark ? mdiWeatherSunny : mdiWeatherNight" />
      </svg>
    </button>
  </header>
</template>
