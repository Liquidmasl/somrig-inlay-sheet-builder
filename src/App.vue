<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ButtonInlaySVG from './components/ButtonInlaySVG.vue'
import { useDarkMode } from './composables/useDarkMode'
import {
  mdiLightbulbOutline,
  mdiFan,
  mdiThermostat,
  mdiVolumeHigh,
  mdiPower,
  mdiHomeLightbulb,
} from '@mdi/js'

const { init, isDark } = useDarkMode()
onMounted(() => init())
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
    <AppHeader />
    <main class="p-6 space-y-10">

      <section>
        <h2 class="text-lg font-semibold mb-4">1 Zone</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="1"
              :zone-config="[{ icon: mdiLightbulbOutline, indicator: 'dot' }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">dot indicator</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="1"
              :zone-config="[{ icon: mdiFan, indicator: 'dash' }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">dash indicator</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="1"
              :zone-config="[{ icon: mdiVolumeHigh, indicator: 'double-dot' }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">double-dot indicator</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="1"
              :zone-config="[{ icon: mdiPower }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">no indicator</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-4">2 Zones</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="2"
              :zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">light + fan</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="2"
              :zone-config="[
                { icon: mdiThermostat, indicator: 'double-dot' },
                { icon: mdiVolumeHigh, indicator: 'dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">thermo + volume</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-4">3 Zones</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="3"
              :zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
                { icon: mdiHomeLightbulb, indicator: 'double-dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">light + fan + home light</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :zones="3"
              :zone-config="[
                { icon: mdiPower, indicator: 'dot' },
                { icon: mdiThermostat, indicator: 'dot' },
                { icon: mdiVolumeHigh, indicator: 'dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">power + thermo + volume</span>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>
