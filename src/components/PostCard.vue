<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'

const props = withDefaults(
  defineProps<{ post: Post; featured?: boolean }>(),
  { featured: false },
)

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
</script>

<template>
  <RouterLink
    :to="`/post/${post.slug}`"
    class="post-card"
    :class="{ 'post-card--featured': featured }"
  >
    <div class="post-card__cover" :style="coverStyle">
      <span class="post-card__tag">{{ post.tag }}</span>
      <span class="post-card__cover-icon">{{ tagIcon }}</span>
      <div class="post-card__cover-pattern" />
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
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
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
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.25s var(--ease),
    border-color 0.25s var(--ease);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-border-hover);
}

.post-card:hover .post-card__title {
  color: var(--color-primary);
}

.post-card:hover .post-card__cover::after {
  opacity: 1;
}

.post-card:hover .post-card__cover-icon {
  transform: scale(1.1) rotate(-5deg);
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
}

.post-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 50%);
  opacity: 0;
  transition: opacity 0.35s var(--ease);
}

.post-card__cover-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 30px 30px, 24px 24px;
  opacity: 0.6;
}

.post-card__tag {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

.post-card__cover-icon {
  position: relative;
  z-index: 1;
  font-size: 42px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.35s var(--ease-spring);
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
}

.post-card__title {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.01em;
  transition: color var(--transition-fast);
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
    transform: none;
  }

  .post-card:hover .post-card__cover-icon {
    transform: none;
  }
}
</style>
