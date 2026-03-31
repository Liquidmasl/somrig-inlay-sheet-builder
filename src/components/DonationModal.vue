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

          <!-- PayPal donate button -->
          <a
            :href="PAYPAL_DONATE_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center gap-3 px-6 py-3 rounded-xl bg-[#0070BA] hover:bg-[#005EA6] active:bg-[#004A87] text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
          >
            <!-- PayPal wordmark (inline SVG path) -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 124 33"
              class="h-5 fill-white"
              aria-hidden="true"
            >
              <path d="M46.2 9.7h-6.4c-.4 0-.8.3-.9.7l-2.6 16.5c-.1.3.2.6.5.6h3c.4 0 .8-.3.9-.7l.7-4.5c.1-.4.4-.7.9-.7h2c4.2 0 6.6-2 7.2-6 .3-1.7 0-3.1-.8-4-1-.9-2.6-1.9-4.5-1.9zm.7 5.9c-.3 2.1-2 2.1-3.6 2.1h-.9l.6-4c0-.2.2-.4.5-.4h.4c1.1 0 2.1 0 2.7.6.3.5.4 1 .3 1.7zM68 15.5h-3c-.3 0-.5.2-.5.4l-.1.9-.2-.3c-.6-.9-2-1.2-3.4-1.2-3.2 0-5.9 2.4-6.5 5.8-.3 1.7.1 3.3 1 4.4.9 1 2.1 1.4 3.6 1.4 2.6 0 4-.7 4-.7l-.1.9c0 .3.2.6.5.6h2.8c.4 0 .8-.3.9-.7l1.7-10.9c0-.3-.2-.6-.7-.6zm-4.3 5.6c-.3 1.6-1.5 2.7-3.1 2.7-.8 0-1.4-.3-1.8-.7-.4-.5-.5-1.1-.4-1.8.3-1.6 1.5-2.7 3.1-2.7.8 0 1.4.3 1.8.7.4.5.5 1.2.4 1.8zM87.2 15.5H84c-.4 0-.7.2-.9.5l-4.8 7-2-6.7c-.1-.5-.6-.8-1-.8h-3c-.4 0-.6.3-.5.7l3.9 11.4-3.6 5.1c-.3.4 0 .9.5.9h3.2c.4 0 .7-.2.9-.5l11.8-17c.3-.3 0-.9-.3-.9l.0.3z"/>
              <path d="M98.6 9.7h-6.4c-.4 0-.8.3-.9.7l-2.6 16.5c-.1.3.2.6.5.6h3.3c.3 0 .6-.2.6-.5l.7-4.7c.1-.4.4-.7.9-.7h2c4.2 0 6.6-2 7.2-6 .3-1.7 0-3.1-.8-4-1-.9-2.5-1.9-4.5-1.9zm.7 5.9c-.3 2.1-2 2.1-3.6 2.1h-.9l.6-4c0-.2.2-.4.5-.4h.4c1.1 0 2.1 0 2.7.6.3.5.4 1 .3 1.7zM120.4 15.5h-3c-.3 0-.5.2-.5.4l-.1.9-.2-.3c-.6-.9-2-1.2-3.4-1.2-3.2 0-5.9 2.4-6.5 5.8-.3 1.7.1 3.3 1 4.4.9 1 2.1 1.4 3.6 1.4 2.6 0 4-.7 4-.7l-.1.9c0 .3.2.6.5.6h2.8c.4 0 .8-.3.9-.7l1.7-10.9c0-.3-.2-.6-.7-.6zm-4.4 5.6c-.3 1.6-1.5 2.7-3.1 2.7-.8 0-1.4-.3-1.8-.7-.4-.5-.5-1.1-.4-1.8.3-1.6 1.5-2.7 3.1-2.7.8 0 1.4.3 1.8.7.4.5.5 1.2.4 1.8zM123 10.1l-2.6 16.8c-.1.3.2.6.5.6h2.7c.4 0 .8-.3.9-.7l2.6-16.5c0-.3-.2-.6-.5-.6h-3c-.3.1-.6.2-.6.4z"/>
              <path fill="#009CDE" d="M7.2 29.8l.5-3.2-.1-.1H4.1L6.6 9.9c0-.1.1-.2.2-.2h8.4c2.8 0 4.7.6 5.7 1.7.5.5.8 1.1 1 1.7.2.6.2 1.4 0 2.3v.7l.5.3c.4.2.7.5 1 .8.4.6.7 1.3.7 2.2-.1 1-.3 2.1-.8 3.3-.5 1.3-1.2 2.4-2.1 3.3-.8.8-1.7 1.4-2.8 1.8-1 .4-2.2.6-3.5.6h-.8c-.6 0-1.2.2-1.6.6-.4.4-.7.9-.7 1.5v.3l-.8 5.3v.2c0 .1 0 .1-.1.1H7.4c-.1 0-.2-.1-.2-.2z"/>
              <path fill="#012069" d="M22.5 15.4c0 .2-.1.3-.1.5-.9 4.8-4.1 6.5-8.2 6.5h-2c-.5 0-.9.4-1 .9l-1.1 6.8-.3 2c0 .3.2.5.5.5h3.6c.4 0 .8-.3.9-.7v-.2l.7-4.6v-.3c.1-.4.5-.7.9-.7h.6c3.6 0 6.4-1.5 7.2-5.7.3-1.8.2-3.2-.8-4.3-.2-.3-.6-.5-.9-.7z"/>
              <path fill="#003087" d="M21.5 15c-.2-.1-.3-.1-.5-.2-.2 0-.3-.1-.5-.1-.6-.1-1.3-.1-2.1-.1h-6.3c-.2 0-.3 0-.5.1-.3.1-.5.4-.6.7l-1.3 8.5v.2c.1-.5.5-.9 1-.9h2c4.1 0 7.3-1.7 8.2-6.5 0-.2.1-.4.1-.5-.2-.2-.4-.3-.6-.4l-.9.2z"/>
            </svg>
            Donate with PayPal
          </a>

          <p class="text-xs text-gray-400 dark:text-gray-600 text-center">
            You'll be redirected to PayPal. Every amount helps!
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
