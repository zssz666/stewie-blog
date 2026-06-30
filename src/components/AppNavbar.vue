<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import IconSun from './icons/IconSun.vue'
import IconMoon from './icons/IconMoon.vue'
import IconMenu from './icons/IconMenu.vue'
import IconClose from './icons/IconClose.vue'

const themeStore = useThemeStore()
const route = useRoute()

const scrolled = ref(false)
const menuOpen = ref(false)

const isHome = computed(() => route.path === '/')

const navClass = computed(() => ({
  'navbar--home': isHome.value,
  'navbar--scrolled': scrolled.value,
}))

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/articles', label: '文章' },
  { to: '/about', label: '关于' },
]

function handleScroll() {
  scrolled.value = window.scrollY > 50
}

function closeMenu() {
  menuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="navbar" :class="navClass">
    <div class="container navbar__inner">
      <RouterLink to="/" class="navbar__brand" @click="closeMenu">
        <img src="/favicon.ico" alt="Stewie" class="navbar__logo" />
        <span class="navbar__name">Stewie</span>
      </RouterLink>

      <nav class="navbar__nav">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="navbar__actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="themeStore.isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="themeStore.toggle()"
        >
          <Transition name="icon-swap" mode="out-in">
            <IconSun v-if="themeStore.isDark" key="sun" :size="18" />
            <IconMoon v-else key="moon" :size="18" />
          </Transition>
        </button>

        <button
          class="navbar__burger"
          type="button"
          aria-label="切换菜单"
          @click="menuOpen = !menuOpen"
        >
          <IconMenu v-if="!menuOpen" :size="22" />
          <IconClose v-else :size="22" />
        </button>
      </div>
    </div>

    <Transition name="drawer">
      <nav v-if="menuOpen" class="navbar__drawer">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__drawer-link"
          @click="closeMenu"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </Transition>

    <Transition name="fade">
      <div v-if="menuOpen" class="navbar__backdrop" @click="closeMenu" />
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--header-height);
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition:
    background-color 0.3s var(--ease),
    backdrop-filter 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    border-color 0.3s var(--ease);
}

/* 首页未滚动：透明 */
.navbar--home:not(.navbar--scrolled) {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom-color: transparent;
}

/* 首页滚动后：暗色 blur */
.navbar--home.navbar--scrolled {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

/* 非首页滚动后 */
.navbar--scrolled:not(.navbar--home) {
  box-shadow: var(--shadow-sm);
  border-bottom-color: var(--color-border);
}

.navbar__inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.navbar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-heading);
  font-weight: 700;
  font-size: 17px;
  transition: color var(--transition-fast);
}

.navbar__logo {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
}

.navbar__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.navbar__link {
  position: relative;
  padding: 8px 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 14px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.navbar__link::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s var(--ease);
}

.navbar__link:hover {
  color: var(--color-heading);
}

.navbar__link.router-link-exact-active {
  color: var(--color-primary);
}

.navbar__link.router-link-exact-active::after {
  transform: scaleX(1);
}

/* 首页透明状态：白色文字 */
.navbar--home:not(.navbar--scrolled) .navbar__brand,
.navbar--home:not(.navbar--scrolled) .navbar__link {
  color: rgba(255, 255, 255, 0.85);
}

.navbar--home:not(.navbar--scrolled) .navbar__link:hover,
.navbar--home:not(.navbar--scrolled) .navbar__link.router-link-exact-active {
  color: #fff;
}

.navbar--home:not(.navbar--scrolled) .navbar__link::after {
  background: #60a5fa;
}

.navbar--home:not(.navbar--scrolled) .navbar__link.router-link-exact-active::after {
  background: #93c5fd;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-toggle,
.navbar__burger {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color 0.5s var(--ease);
}

.theme-toggle:hover,
.navbar__burger:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* 首页透明状态：按钮透明 */
.navbar--home:not(.navbar--scrolled) .theme-toggle,
.navbar--home:not(.navbar--scrolled) .navbar__burger {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.navbar--home:not(.navbar--scrolled) .theme-toggle:hover,
.navbar--home:not(.navbar--scrolled) .navbar__burger:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity 0.15s var(--ease),
    transform 0.3s var(--ease);
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-180deg);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(180deg);
}

.navbar__burger {
  display: none;
}

.navbar__drawer {
  position: absolute;
  top: var(--header-height);
  right: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.navbar__drawer-link {
  padding: 12px 14px;
  color: var(--color-text);
  font-weight: 500;
  font-size: 14px;
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.navbar__drawer-link:hover,
.navbar__drawer-link.router-link-exact-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.navbar__backdrop {
  position: fixed;
  inset: var(--header-height) 0 0 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity 0.2s var(--ease),
    transform 0.2s var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s var(--ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .navbar__nav {
    display: none;
  }

  .navbar__burger {
    display: grid;
  }
}
</style>
