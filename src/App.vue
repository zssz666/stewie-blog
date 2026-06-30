<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'

const themeStore = useThemeStore()

const showTop = ref(false)

function handleScroll() {
  showTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  themeStore.init()
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <AppNavbar />
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <Transition name="fade-page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />

  <Transition name="top-btn">
    <button
      v-show="showTop"
      class="back-to-top"
      type="button"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      <svg
        class="back-to-top__icon"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c-2.72.78-5.69 4.3-7.05 6.55a22 22 0 0 1-2 3.95z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 28px;
  right: 28px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  color: #fff;
  background: var(--color-primary);
  box-shadow: var(--shadow-md);
  z-index: 90;
  transition:
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.back-to-top:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(59, 130, 246, 0.4);
}

.back-to-top:hover .back-to-top__icon {
  animation: rocket-jiggle 0.4s var(--ease);
}

@keyframes rocket-jiggle {
  0% {
    transform: translateY(0) rotate(0);
  }
  25% {
    transform: translateY(-3px) rotate(-8deg);
  }
  50% {
    transform: translateY(0) rotate(0);
  }
  75% {
    transform: translateY(-2px) rotate(8deg);
  }
  100% {
    transform: translateY(0) rotate(0);
  }
}

.top-btn-enter-active,
.top-btn-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}

.top-btn-enter-from,
.top-btn-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top:hover .back-to-top__icon {
    animation: none;
  }

  .top-btn-enter-active,
  .top-btn-leave-active {
    transition: none;
  }
}
</style>
