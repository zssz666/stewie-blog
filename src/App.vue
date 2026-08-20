<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const route = useRoute()

const showTop = ref(false)
const scrollProgress = ref(0)
// 文章页已有独立的阅读进度条，避免两条顶栏重复（跟随路由实时更新）
const isPostPage = computed(() => route.name === 'post')

// 平滑滚动动画句柄，组件卸载或重复点击时用于取消上一轮
let scrollRaf = 0

function handleScroll() {
  showTop.value = window.scrollY > 300
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0
}

// 自定义缓动滚动回顶部：不依赖 behavior:'smooth'，跨浏览器一致、丝滑可控
function scrollToTop() {
  cancelAnimationFrame(scrollRaf)
  const startY = window.scrollY
  if (startY <= 0) return
  // 滚动距离越长，动画时长略增，封顶 900ms，避免短距离过慢、长距离过快
  const duration = Math.min(900, 420 + startY * 0.2)
  const startTime = performance.now()
  // easeInOutCubic：起步与收尾都柔和，中段稍快，最符合「丝滑自然」
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const cancel = () => {
    cancelAnimationFrame(scrollRaf)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('keydown', cancel)
  }

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    // 显式 behavior:'auto'：隔离全局 scroll-behavior:smooth 的二次缓动，曲线完全由 easeInOutCubic 接管
    window.scrollTo({ top: Math.round(startY * (1 - easeInOutCubic(progress))), behavior: 'auto' })
    if (progress < 1) {
      scrollRaf = requestAnimationFrame(step)
    } else {
      cancel()
    }
  }

  // 用户中途主动滚动（滚轮/触摸/键盘）即中断动画，交还控制权
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('keydown', cancel)

  scrollRaf = requestAnimationFrame(step)
}

onMounted(() => {
  themeStore.init()
  authStore.init()
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  cancelAnimationFrame(scrollRaf)
})
</script>

<template>
  <AppNavbar />
  <div
    v-if="!isPostPage"
    class="scroll-progress"
    :style="{ transform: `scaleX(${scrollProgress})` }"
    aria-hidden="true"
  />
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
      aria-label="回到图纸顶部"
      @click="scrollToTop"
    >
      <svg class="back-to-top__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-heading);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  z-index: 90;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.back-to-top:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover);
  transform: translateY(-3px);
}

.back-to-top:hover .back-to-top__icon {
  animation: arrow-lift 0.4s var(--ease);
}

@keyframes arrow-lift {
  0% { transform: translateY(0); }
  40% { transform: translateY(-3px); }
  100% { transform: translateY(0); }
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

@media (max-width: 640px) {
  .back-to-top {
    bottom: 20px;
    right: 20px;
    width: 42px;
    height: 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top:hover .back-to-top__icon {
    animation: none;
  }

  .back-to-top:hover {
    transform: none;
  }

  .top-btn-enter-active,
  .top-btn-leave-active {
    transition: none;
  }
}
</style>
