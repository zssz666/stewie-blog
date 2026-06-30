import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    apply()
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    isDark.value = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    apply()
  }

  return { isDark, toggle, init }
})
