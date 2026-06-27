<script setup lang="ts">
import { mdiClose, mdiHeart, mdiPrinter3d } from '@mdi/js'
import { useAnalytics } from '../composables/useAnalytics'

defineProps<{ open: boolean; show3dPrint?: boolean }>()
const emit = defineEmits<{ close: []; support: [] }>()

const PAYPAL_DONATE_URL =
  'https://www.paypal.com/donate/?hosted_button_id=PESLSWZB9S2UG'

const MAKERWORLD_BOOST_URL = 'https://makerworld.com/en/@liquidmasl'

// Served from public/ at runtime (bound, so the bundler doesn't try to resolve it).
// TODO(marcel): drop the real prototype photo at public/prototype-prints.jpg, then
// re-enable the <img> in the 3D-print section below.
// const PROTOTYPE_IMAGE_URL = '/prototype-prints.jpg'

const { track } = useAnalytics()

// Any support click counts as engagement: track it and let the parent mute the
// auto-popup for a week.
function onSupport(event = 'donation-click') {
  track(event)
  emit('support')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Modal card -->
        <div class="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5">
          <!-- Close button -->
          <button
            class="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
              <path :d="mdiClose" />
            </svg>
          </button>

          <!-- Heart icon -->
          <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-9 h-9 fill-red-500">
              <path :d="mdiHeart" />
            </svg>
          </div>

          <!-- Heading -->
          <h2 id="donation-title" class="text-xl font-bold text-gray-900 dark:text-white text-center">
            No ads. No cookies. Just vibes.
          </h2>

          <!-- Body text -->
          <p class="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
            I hate ads as much as you do — that's why you won't find any here.
            If this tool saved you some time (or just made you smile), a small donation
            sends me a little dopamine.
            No pressure, truly — but if you feel like it&nbsp;:)
          </p>

          <!-- PayPal donate button: white chip holds the full-color logo
               (invisible on blue), blue body holds the label -->
          <a
            :href="PAYPAL_DONATE_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-stretch rounded-xl overflow-hidden bg-[#0070BA] hover:bg-[#005EA6] active:bg-[#004A87] text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
            @click="onSupport()"
          >
            <span class="flex items-center bg-white px-3">
              <!-- Official 2024 PayPal monogram (from PayPal's brand package) -->
              <img src="/paypal-monogram.png" alt="PayPal" class="h-5 w-auto" />
            </span>
            <span class="flex items-center px-5 py-3">Donate with PayPal</span>
          </a>

          <!-- Buy Me a Coffee -->
          <a
            href="https://www.buymeacoffee.com/liquidmasl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-transform hover:scale-[1.03]"
            @click="onSupport()"
          >
            <img
              src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=liquidmasl&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
              alt="Buy me a coffee"
              class="h-[51px] w-auto rounded-xl shadow-md"
            />
          </a>

          <p class="text-xs text-gray-400 dark:text-gray-600 text-center">
            You'll be redirected to an external page. Every amount helps!
          </p>

          <!-- 3D-print variant: extra context + free Makerworld boost, only shown
               once the user has actually downloaded a 3mf -->
          <template v-if="show3dPrint">
            <div class="w-full border-t border-gray-200 dark:border-gray-800 pt-5 flex flex-col items-center gap-4">
              <div class="flex items-center gap-2 text-gray-900 dark:text-white">
                <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
                  <path :d="mdiPrinter3d" />
                </svg>
                <h3 class="font-semibold text-base">Printing these yourself?</h3>
              </div>

              <p class="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
                Modelling, measuring and dialling these inlays in for a great fit and
                feel without breakage took a stack of prototypes, a lot of failed prints
                and a fair bit of filament to get right. If they save you that hassle,
                a boost or a coffee means a lot.
              </p>

              <p class="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
                Heads up: models you download here don't earn me any Makerworld points —
                I didn't want to break your workflow just to chase them. So if you'd like
                to support me for free, please boost any (or several!) of my models over
                on Makerworld instead&nbsp;:)
              </p>

              <!-- TODO(marcel): re-enable once public/prototype-prints.jpg exists
              <img
                :src="PROTOTYPE_IMAGE_URL"
                alt="Prototype 3D prints"
                class="w-full rounded-xl shadow-md object-cover"
              />
              -->

              <!-- Free Makerworld boost — costs the user nothing -->
              <a
                :href="MAKERWORLD_BOOST_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 rounded-xl px-5 py-3 bg-[#00AE42] hover:bg-[#009939] active:bg-[#00822F] text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                @click="onSupport('makerworld-boost-click')"
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
                  <path :d="mdiPrinter3d" />
                </svg>
                Boost me for free on Makerworld!
              </a>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
