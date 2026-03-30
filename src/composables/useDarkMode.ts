import { ref, watch } from 'vue'

const STORAGE_KEY = 'color-scheme'

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isDark = ref(false)

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

export function useDarkMode() {
  function init() {
    isDark.value = getInitialDark()
    applyDark(isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (dark) => {
    applyDark(dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  })

  return { isDark, toggle, init }
}
