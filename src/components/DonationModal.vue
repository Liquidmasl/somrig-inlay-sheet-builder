<script setup lang="ts">
import { mdiClose, mdiHeart } from '@mdi/js'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const PAYPAL_DONATE_URL =
  'https://www.paypal.com/donate/?hosted_button_id=PESLSWZB9S2UG'
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
            No ads. No tracking. Just vibes.
          </h2>

          <!-- Body text -->
          <p class="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
            I hate ads as much as you do — that's why you won't find any here.
            If this tool saved you some time (or just made you smile), a small donation
            sends me a little dopamine and helps offset my
            <span class="text-orange-500 font-medium">insane Claude token costs</span>.
            No pressure, truly — but if you feel like it&nbsp;:)
          </p>

          <!-- PayPal donate button: white chip holds the full-color logo
               (invisible on blue), blue body holds the label -->
          <a
            :href="PAYPAL_DONATE_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-stretch rounded-xl overflow-hidden bg-[#0070BA] hover:bg-[#005EA6] active:bg-[#004A87] text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
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
