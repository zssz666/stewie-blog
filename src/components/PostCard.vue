<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { useMagnetic } from '@/composables/useMagnetic'

const props = withDefaults(
  defineProps<{ post: Post; featured?: boolean }>(),
  { featured: false },
)

const { x: magX, y: magY, onMouseMove, onMouseLeave } = useMagnetic(10, 1.4, 0.15)

const tagColors: Record<string, { from: string; to: string; icon: string }> = {
  Vue: { from: '#42b883', to: '#35495e', icon: 'V' },
  TypeScript: { from: '#3178c6', to: '#235a97', icon: 'TS' },
  Vite: { from: '#646cff', to: '#535bf2', icon: '⚡' },
  CSS: { from: '#f59e0b', to: '#d97706', icon: '#' },
  Pinia: { from: '#ffd859', to: '#f59e0b', icon: 'P' },
}

const coverStyle = computed(() => {
  const colors = tagColors[props.post.tag] ?? { from: '#2563eb', to: '#1d4ed8', icon: '•' }
  return {
    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
  }
})

const tagIcon = computed(() => tagColors[props.post.tag]?.icon ?? '•')

const formattedDate = computed(() =>
  new Date(props.post.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const formattedViews = computed(() => {
  const v = props.post.views
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
})

const magneticStyle = computed(() => ({
  transform: `translate(${magX.value}px, ${magY.value}px)`,
}))
</script>

<template>
  <RouterLink
    :to="`/post/${post.slug}`"
    class="post-card"
    :class="{ 'post-card--featured': featured }"
    :style="magneticStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div class="post-card__cover" :style="coverStyle">
      <span class="post-card__tag">{{ post.tag }}</span>
      <span class="post-card__cover-icon">{{ tagIcon }}</span>
      <div class="post-card__cover-pattern" />
      <!-- 悬停时的光晕扩散 -->
      <div class="post-card__glow" />
    </div>
    <div class="post-card__body">
      <span class="post-card__category">{{ post.category }}</span>
      <h3 class="post-card__title">{{ post.title }}</h3>
      <p class="post-card__excerpt">{{ post.excerpt }}</p>
      <div class="post-card__meta">
        <span class="post-card__meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18M8 2v4M16 2v4" />
          </svg>
          {{ formattedDate }}
        </span>
        <span class="post-card__dot" />
        <span class="post-card__meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ post.readingTime }} 分钟
        </span>
        <span class="post-card__dot" />
        <span class="post-card__meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10 7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ formattedViews }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.post-card {
  position: relative;
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.35s var(--ease),
    border-color 0.35s var(--ease);
  /* 磁性效果由 inline style 驱动 */
}

.post-card:hover {
  box-shadow:
    var(--shadow-hover),
    0 0 0 1px rgba(37, 99, 235, 0.08),
    0 0 32px rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.2);
}

/* ── 悬停内部元素交错动画 ── */
.post-card:hover .post-card__tag {
  transform: translateY(-2px) scale(1.04);
}

.post-card:hover .post-card__title {
  color: var(--color-primary);
  transform: translateX(4px);
}

.post-card:hover .post-card__excerpt {
  opacity: 0.8;
  transform: translateX(2px);
}

.post-card:hover .post-card__meta {
  opacity: 1;
  transform: translateY(-2px);
}

/* ── 高光扫过（仅支持悬停的设备） ── */
@media (hover: hover) {
  .post-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    background: linear-gradient(
      120deg,
      transparent 30%,
      rgba(255, 255, 255, 0.18) 50%,
      transparent 70%
    );
    transform: translateX(-130%);
    transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    border-radius: inherit;
  }

  .post-card:hover::before {
    transform: translateX(130%);
  }

  .post-card:hover .post-card__cover-pattern {
    transform: scale(1.12) rotate(2deg);
  }
}

/* ── 封面 ── */
.post-card__cover {
  position: relative;
  flex-shrink: 0;
  width: 38%;
  min-height: 170px;
  overflow: hidden;
  display: grid;
  place-items: center;
  transition: transform 0.5s var(--ease-spring);
}

/* 悬停时封面微放大 */
.post-card:hover .post-card__cover {
  transform: scale(1.03);
}

.post-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 55%);
  opacity: 0;
  transition: opacity 0.4s var(--ease);
}

.post-card:hover .post-card__cover::after {
  opacity: 1;
}

/* 光晕扩散 */
.post-card__glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at center, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s var(--ease);
  z-index: 0;
}

.post-card:hover .post-card__glow {
  opacity: 1;
}

.post-card__cover-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 30px 30px, 24px 24px;
  opacity: 0.6;
  transition: transform 0.6s var(--ease-spring);
}

.post-card__tag {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
  transition: transform 0.35s var(--ease-spring), opacity 0.3s var(--ease);
}

.post-card__cover-icon {
  position: relative;
  z-index: 1;
  font-size: 42px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.45s var(--ease-spring);
}

.post-card:hover .post-card__cover-icon {
  transform: scale(1.15) rotate(-5deg);
}

/* ── 内容区 ── */
.post-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 26px;
  flex: 1;
  min-width: 0;
}

.post-card__category {
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: transform 0.3s var(--ease-spring);
}

.post-card__title {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.01em;
  transition: color 0.25s var(--ease-fast), transform 0.35s var(--ease-spring);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__excerpt {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: opacity 0.3s var(--ease), transform 0.35s var(--ease-spring);
}

.post-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 6px;
  color: var(--color-text-tertiary);
  font-size: 12.5px;
  font-weight: 500;
  opacity: 0.75;
  transition: opacity 0.3s var(--ease), transform 0.35s var(--ease-spring);
}

.post-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.post-card__meta-item svg {
  opacity: 0.7;
}

.post-card__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  flex-shrink: 0;
}

/* ── Featured 变体 ── */
.post-card--featured .post-card__cover {
  width: 44%;
  min-height: 300px;
}

.post-card--featured .post-card__body {
  padding: 36px 40px;
  justify-content: center;
}

.post-card--featured .post-card__title {
  font-size: 26px;
  line-height: 1.3;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.post-card--featured .post-card__excerpt {
  font-size: 15px;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.post-card--featured .post-card__cover-icon {
  font-size: 64px;
}

@media (max-width: 640px) {
  .post-card {
    flex-direction: column;
  }

  .post-card__cover {
    width: 100%;
    min-height: 140px;
  }

  .post-card--featured .post-card__cover {
    min-height: 170px;
  }

  .post-card--featured .post-card__body {
    padding: 22px 24px;
  }

  .post-card--featured .post-card__title {
    font-size: 19px;
  }

  .post-card--featured .post-card__cover-icon {
    font-size: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-card:hover {
    transform: none !important;
  }

  .post-card:hover .post-card__cover,
  .post-card:hover .post-card__cover-icon,
  .post-card:hover .post-card__tag,
  .post-card:hover .post-card__title,
  .post-card:hover .post-card__excerpt,
  .post-card:hover .post-card__meta,
  .post-card:hover .post-card__cover-pattern {
    transform: none;
  }
}
</style>
