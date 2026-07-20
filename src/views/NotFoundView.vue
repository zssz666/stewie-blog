<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: '页面未找到',
  description: '你访问的页面不存在或已被移动。',
})
const router = useRouter()
</script>

<template>
  <div class="notfound">
    <div class="notfound__bg" aria-hidden="true" />
    <div class="notfound__grid" aria-hidden="true" />
    <div class="notfound__inner">
      <p class="notfound__code">404</p>
      <h1 class="notfound__title">页面走丢了</h1>
      <p class="notfound__desc">
        你访问的页面不存在，或已被移动到了别处。<br />
        返回首页，继续阅读技术笔记吧。
      </p>
      <div class="notfound__actions">
        <RouterLink to="/" class="notfound__btn notfound__btn--primary">
          返回首页
        </RouterLink>
        <button
          type="button"
          class="notfound__btn notfound__btn--ghost"
          @click="router.back()"
        >
          返回上一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound {
  position: relative;
  min-height: 70vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 80px 24px;
  text-align: center;
}

.notfound__bg {
  position: absolute;
  inset: -20% 0 0 0;
  height: 140%;
  background: linear-gradient(135deg, #0f172a, #1e1b4b, #312e81);
}

.notfound__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(96, 165, 250, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 165, 250, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  pointer-events: none;
}

.notfound__inner {
  position: relative;
  z-index: 2;
  max-width: 520px;
}

.notfound__code {
  font-family: var(--font-display, inherit);
  font-size: clamp(96px, 18vw, 180px);
  font-weight: 800;
  line-height: 1;
  margin: 0;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #93c5fd, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.notfound__title {
  font-family: var(--font-display, inherit);
  font-size: 28px;
  font-weight: 700;
  color: #f8fafc;
  margin: 8px 0 16px;
}

.notfound__desc {
  font-family: var(--font-body, inherit);
  font-size: 15px;
  line-height: 1.8;
  color: #cbd5e1;
  margin: 0 0 32px;
}

.notfound__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.notfound__btn {
  height: 44px;
  padding: 0 24px;
  border-radius: var(--radius-full, 999px);
  font-family: var(--font-nav, inherit);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    transform var(--transition-fast, 0.2s),
    box-shadow var(--transition-fast, 0.2s),
    background-color var(--transition-fast, 0.2s),
    border-color var(--transition-fast, 0.2s);
}

.notfound__btn--primary {
  background: var(--color-primary, #3b82f6);
  color: #fff;
  box-shadow: var(--shadow-primary, 0 8px 24px rgba(59, 130, 246, 0.3));
}

.notfound__btn--primary:hover {
  transform: translateY(-2px);
  background: var(--color-primary-hover, #2563eb);
}

.notfound__btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
}

.notfound__btn--ghost:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .notfound__btn:hover {
    transform: none;
  }
}
</style>
