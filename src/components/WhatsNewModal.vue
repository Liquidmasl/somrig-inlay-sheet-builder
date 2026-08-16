<script setup lang="ts">
import {
  mdiClose,
  mdiContentDuplicate,
  mdiContentSaveOutline,
  mdiHeart,
  mdiPaletteOutline,
  mdiShape,
  mdiVectorSquare,
} from '@mdi/js'
import { useAnalytics } from '../composables/useAnalytics'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const GITHUB_ISSUES_URL =
  'https://github.com/Liquidmasl/somrig-inlay-sheet-builder/issues/new'

// Served from public/photos at runtime, so the bundler leaves them alone.
// All 3:4 portrait — the strip below assumes that aspect ratio.
const photos: { src: string; alt: string }[] = [
  {
    src: '/photos/somrig-wall.webp',
    alt: 'Printed black-and-orange Somrig cover plate mounted on a wall',
  },
  {
    src: '/photos/bilresa-wall.webp',
    alt: 'Printed orange Bilresa cover plate mounted on a wall',
  },
  {
    src: '/photos/bilresa-bambu.webp',
    alt: 'A Bilresa button with a freshly printed cover plate on a Bambu Lab printer',
  },
]

const changes: { icon: string; text: string }[] = [
  {
    icon: mdiPaletteOutline,
    text: 'Multicolour 3MF download — 3D-printable Somrig & Bilresa buttons, ready for multi-filament printing.',
  },
  {
    icon: mdiShape,
    text: 'New Bilresa button design.',
  },
  {
    icon: mdiVectorSquare,
    text: 'SVG downloads for individual buttons.',
  },
  {
    icon: mdiContentSaveOutline,
    text: 'Auto-save — closing the tab no longer loses your work. Plus save & load full designs as JSON.',
  },
  {
    icon: mdiContentDuplicate,
    text: 'Duplicate a button design in one click.',
  },
]

const { track } = useAnalytics()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Modal card -->
        <!-- [&>*]:shrink-0 — the card is a scrolling flex column, so without it
             the flex algorithm squashes children to fit instead of scrolling. -->
        <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto [&>*]:shrink-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
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

          <!-- Heading -->
          <div class="flex flex-col items-center gap-1 text-center">
            <span class="text-3xl">👋</span>
            <h2 id="whats-new-title" class="text-xl font-bold text-gray-900 dark:text-white">
              Welcome back — here's what's new
            </h2>
          </div>

          <!-- Printed-in-the-wild photo strip -->
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="photo in photos"
              :key="photo.src"
              :src="photo.src"
              :alt="photo.alt"
              width="480"
              height="640"
              class="w-full aspect-3/4 object-cover rounded-xl shadow-md"
            />
          </div>

          <!-- Changes list -->
          <ul class="flex flex-col gap-3">
            <li
              v-for="change in changes"
              :key="change.text"
              class="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0 mt-0.5 fill-blue-500">
                <path :d="change.icon" />
              </svg>
              <span class="leading-relaxed">{{ change.text }}</span>
            </li>
          </ul>

          <!-- Wink footer -->
          <div class="border-t border-gray-200 dark:border-gray-800 pt-4 text-center text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              Like what you see? There's a
              <svg viewBox="0 0 24 24" class="inline-block w-4 h-4 -mt-0.5 fill-red-500 align-middle">
                <path :d="mdiHeart" />
              </svg>
              button up top if you'd like to support the project.
            </p>
            <p class="mt-2">
              Got feedback or a feature idea?
              <a
                :href="GITHUB_ISSUES_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                @click="track('whats-new-issue-click')"
              >Open an issue on GitHub</a>.
            </p>
          </div>

          <!-- Dismiss -->
          <button
            class="self-center mt-1 rounded-xl px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
            @click="emit('close')"
          >
            Let's go
          </button>
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
