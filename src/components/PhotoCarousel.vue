<script lang="ts">
// Declared in a plain <script> block: <script setup> cannot carry ES exports,
// and WhatsNewModal imports this type to shape its photo list.
export interface CarouselPhoto {
  src: string
  alt: string
  /** Optional caption, e.g. a contributor credit. */
  credit?: string
}
</script>

<script setup lang="ts">
/**
 * PhotoCarousel — one photo at a time with dots, arrows, and swipe.
 *
 * Auto-advances until the visitor touches it (arrow, dot, or swipe), after which
 * it stays where they put it — a modal people are reading shouldn't keep moving
 * under them once they've taken control. Hovering pauses without ending autoplay,
 * and `prefers-reduced-motion` disables it entirely.
 *
 * Photos may be portrait or landscape: the frame is a fixed height and lets the
 * width follow each image, so nothing is cropped and the modal never reflows
 * vertically between slides.
 *
 * A thin bar along the bottom edge runs down the interval. At four seconds a
 * still image reads as stuck without it, and it makes the hover-pause visible —
 * the bar freezes with the photo. It disappears once autoplay is over.
 */

import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    photos: CarouselPhoto[]
    /** Auto-advance delay in ms. */
    interval?: number
  }>(),
  { interval: 4000 },
)

const index = ref(0)
const paused = ref(false)
const takenOver = ref(false)

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const autoplays = computed(
  () =>
    props.photos.length > 1 &&
    !takenOver.value &&
    !paused.value &&
    !prefersReducedMotion,
)

let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  autoplays,
  (on) => {
    stopTimer()
    if (on) {
      timer = setInterval(() => {
        index.value = (index.value + 1) % props.photos.length
      }, props.interval)
    }
  },
  { immediate: true },
)

onBeforeUnmount(stopTimer)

/** Move by `step` and hand control to the visitor for the rest of the session. */
function go(step: number) {
  const count = props.photos.length
  index.value = (index.value + step + count) % count
  takenOver.value = true
}

function select(i: number) {
  index.value = i
  takenOver.value = true
}

// ── Swipe ────────────────────────────────────────────────────────────────────
// Pointer events cover touch, pen, and mouse drag in one path.

const SWIPE_THRESHOLD_PX = 40
let pointerStartX: number | null = null

function onPointerDown(event: PointerEvent) {
  pointerStartX = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (pointerStartX === null) return
  const dx = event.clientX - pointerStartX
  pointerStartX = null
  if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) go(dx < 0 ? 1 : -1)
}

const current = computed(() => props.photos[index.value])

/** The bar only makes sense while the carousel still intends to move on its own. */
const showsProgress = computed(
  () =>
    props.photos.length > 1 && !takenOver.value && !prefersReducedMotion,
)
</script>

<template>
  <div
    v-if="photos.length > 0"
    class="flex flex-col gap-2"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div
      class="relative h-64 sm:h-80 max-w-full self-center overflow-hidden rounded-xl shadow-md bg-gray-100 dark:bg-gray-800 touch-pan-y"
      role="group"
      aria-roledescription="carousel"
      aria-label="Photos of printed button covers"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="pointerStartX = null"
    >
      <!-- Only the active slide is rendered; the rest stay in the browser cache
           after their first paint, so cross-fading one <img> is enough. -->
      <Transition name="fade" mode="out-in">
        <!-- h-full w-auto: the wrapper shrinks to whatever this image's aspect
             ratio needs, so portrait and landscape shots both show in full. -->
        <img
          :key="current.src"
          :src="current.src"
          :alt="current.alt"
          draggable="false"
          class="h-full w-auto max-w-full object-contain select-none"
        />
      </Transition>

      <template v-if="photos.length > 1">
        <button
          type="button"
          class="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
          aria-label="Previous photo"
          @click="go(-1)"
        >
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path :d="mdiChevronLeft" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
          aria-label="Next photo"
          @click="go(1)"
        >
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path :d="mdiChevronRight" />
          </svg>
        </button>

        <!-- Credit sits on the photo so the layout doesn't jump between slides
             that have one and slides that don't. -->
        <p
          v-if="current.credit"
          class="absolute inset-x-0 bottom-0 px-3 py-2.5 text-xs text-white bg-gradient-to-t from-black/70 to-transparent"
        >
          {{ current.credit }}
        </p>

        <!-- Interval progress. Re-keyed per slide so the animation restarts. -->
        <div
          v-if="showsProgress"
          class="absolute inset-x-0 bottom-0 h-1 bg-black/35"
          aria-hidden="true"
        >
          <div
            :key="index"
            class="progress-fill h-full bg-blue-500"
            :style="{
              animationDuration: `${interval}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }"
          />
        </div>
      </template>
    </div>

    <div v-if="photos.length > 1" class="flex justify-center gap-1.5">
      <button
        v-for="(photo, i) in photos"
        :key="photo.src"
        type="button"
        class="w-2 h-2 rounded-full transition-colors"
        :class="
          i === index
            ? 'bg-blue-600 dark:bg-blue-400'
            : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
        "
        :aria-label="`Show photo ${i + 1} of ${photos.length}`"
        :aria-current="i === index"
        @click="select(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-fill {
  transform-origin: left;
  animation-name: carousel-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes carousel-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
