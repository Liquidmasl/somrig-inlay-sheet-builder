<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import { useDarkMode } from './composables/useDarkMode'

const { init } = useDarkMode()
onMounted(() => init())
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
    <AppHeader />
    <main class="p-6">
      <slot />
    </main>
  </div>
</template>
