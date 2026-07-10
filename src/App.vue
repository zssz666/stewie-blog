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
      aria-label="返回顶部"
      @click="scrollToTop"
    >
    <svg t="1783675516443" class="back-to-top__icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1666" width="22" height="22" fill="currentColor"><path d="M436.48 814.592a21.76 21.76 0 0 0-21.76 21.76v107.52a21.76 21.76 0 0 0 43.52 0v-107.52a21.76 21.76 0 0 0-21.76-21.76z m79.616 4.608a22.016 22.016 0 0 0-22.016 22.016v159.744a22.016 22.016 0 0 0 44.032 0V841.984a22.016 22.016 0 0 0-22.016-22.784zM768 438.784C773.376 143.104 528.896 9.216 512 0c-16.384 8.704-260.864 142.592-256 438.272a192.256 192.256 0 0 0-93.696 187.392c8.192 98.304 104.448 163.584 141.056 160s25.6-30.72 25.6-30.72l12.544-51.2s54.272 81.92 71.68 81.92h197.632c15.616 0 71.68-81.92 71.68-81.92l12.544 51.2s-10.752 27.392 25.6 30.72 132.864-61.696 141.056-160A192.256 192.256 0 0 0 768 438.784z m-256-14.592a102.4 102.4 0 1 1 102.4-102.4 102.4 102.4 0 0 1-102.4 102.4zM588.8 819.2a21.76 21.76 0 0 0-21.76 21.76v76.8a21.76 21.76 0 1 0 43.52 0v-76.8a21.76 21.76 0 0 0-21.76-21.76z" p-id="1667"></path></svg>
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
  border-radius: var(--radius-full);
  color: #fff;
  background: var(--color-primary);
  box-shadow: var(--shadow-primary);
  z-index: 90;
  transition:
    background-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.back-to-top:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.35);
  transform: translateY(-3px);
}

.back-to-top:hover .back-to-top__icon {
  animation: rocket-jiggle 0.4s var(--ease);
}

@keyframes rocket-jiggle {
  0% {
    transform: translateY(0) rotate(0);
  }
  25% {
    transform: translateY(-4px) rotate(-8deg);
  }
  50% {
    transform: translateY(0) rotate(0);
  }
  75% {
    transform: translateY(-3px) rotate(8deg);
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
