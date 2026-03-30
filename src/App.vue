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
  mdiMusicNote,
  mdiTelevision,
} from '@mdi/js'

const { init, isDark } = useDarkMode()
onMounted(() => init())
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
    <AppHeader />
    <main class="p-6 space-y-10">

      <!-- 1 Zone top + 1 Zone bottom -->
      <section>
        <h2 class="text-lg font-semibold mb-4">1 Zone (top) + 1 Zone (bottom)</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="1"
              :bot-zones="1"
              :top-zone-config="[{ icon: mdiLightbulbOutline, indicator: 'dot' }]"
              :bot-zone-config="[{ icon: mdiFan, indicator: 'dash' }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">light (dot) / fan (dash)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="1"
              :bot-zones="1"
              :top-zone-config="[{ icon: mdiVolumeHigh, indicator: 'double-dot' }]"
              :bot-zone-config="[{ icon: mdiPower, indicator: 'dot' }]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">volume (double-dot) / power (dot)</span>
          </div>
        </div>
      </section>

      <!-- 2 Zones top + 2 Zones bottom -->
      <section>
        <h2 class="text-lg font-semibold mb-4">2 Zones (top) + 2 Zones (bottom)</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="2"
              :bot-zones="2"
              :top-zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
              ]"
              :bot-zone-config="[
                { icon: mdiThermostat, indicator: 'double-dot' },
                { icon: mdiVolumeHigh, indicator: 'dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">light+fan / thermo+volume</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="2"
              :bot-zones="2"
              :top-zone-config="[
                { icon: mdiPower, indicator: 'dot' },
                { icon: mdiHomeLightbulb, indicator: 'dash' },
              ]"
              :bot-zone-config="[
                { icon: mdiMusicNote, indicator: 'dot' },
                { icon: mdiTelevision, indicator: 'double-dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">power+home / music+tv</span>
          </div>
        </div>
      </section>

      <!-- 3 Zones top + 3 Zones bottom -->
      <section>
        <h2 class="text-lg font-semibold mb-4">3 Zones (top) + 3 Zones (bottom)</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="3"
              :bot-zones="3"
              :top-zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
                { icon: mdiHomeLightbulb, indicator: 'double-dot' },
              ]"
              :bot-zone-config="[
                { icon: mdiPower, indicator: 'dot' },
                { icon: mdiThermostat, indicator: 'dash' },
                { icon: mdiVolumeHigh, indicator: 'double-dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">light+fan+home / power+thermo+volume</span>
          </div>
        </div>
      </section>

      <!-- Mixed: 3 Zones top + 1 Zone bottom -->
      <section>
        <h2 class="text-lg font-semibold mb-4">Mixed: 3 Zones (top) + 1 Zone (bottom)</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="3"
              :bot-zones="1"
              :top-zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
                { icon: mdiHomeLightbulb, indicator: 'double-dot' },
              ]"
              :bot-zone-config="[
                { icon: mdiPower, indicator: 'dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">3 top zones / 1 bottom zone</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="1"
              :bot-zones="3"
              :top-zone-config="[
                { icon: mdiThermostat, indicator: 'dot' },
              ]"
              :bot-zone-config="[
                { icon: mdiMusicNote, indicator: 'dot' },
                { icon: mdiTelevision, indicator: 'dash' },
                { icon: mdiVolumeHigh, indicator: 'double-dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">1 top zone / 3 bottom zones</span>
          </div>
        </div>
      </section>

      <!-- Mixed: 2 Zones top + 3 Zones bottom -->
      <section>
        <h2 class="text-lg font-semibold mb-4">Mixed: 2 Zones (top) + 3 Zones (bottom)</h2>
        <div class="flex gap-8 flex-wrap">
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="2"
              :bot-zones="3"
              :top-zone-config="[
                { icon: mdiLightbulbOutline, indicator: 'dot' },
                { icon: mdiFan, indicator: 'dash' },
              ]"
              :bot-zone-config="[
                { icon: mdiPower, indicator: 'dot' },
                { icon: mdiThermostat, indicator: 'dash' },
                { icon: mdiVolumeHigh, indicator: 'double-dot' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">2 top zones / 3 bottom zones</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <ButtonInlaySVG
              :top-zones="3"
              :bot-zones="2"
              :top-zone-config="[
                { icon: mdiHomeLightbulb, indicator: 'dot' },
                { icon: mdiMusicNote, indicator: 'dash' },
                { icon: mdiTelevision, indicator: 'double-dot' },
              ]"
              :bot-zone-config="[
                { icon: mdiPower, indicator: 'dot' },
                { icon: mdiVolumeHigh, indicator: 'dash' },
              ]"
              :stroke-color="isDark ? '#ffffff' : '#000000'"
              :icon-color="isDark ? '#ffffff' : '#000000'"
              :fill-color="isDark ? '#1f2937' : '#ffffff'"
              :scale="4"
            />
            <span class="text-sm text-gray-500">3 top zones / 2 bottom zones</span>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>
