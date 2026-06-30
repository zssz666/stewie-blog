<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'

const props = withDefaults(
  defineProps<{ post: Post; featured?: boolean }>(),
  { featured: false },
)

const tagColors: Record<string, { from: string; to: string }> = {
  Vue: { from: '#6366f1', to: '#4f46e5' },
  TypeScript: { from: '#3b82f6', to: '#2563eb' },
  Vite: { from: '#10b981', to: '#059669' },
  CSS: { from: '#f59e0b', to: '#d97706' },
  Pinia: { from: '#ec4899', to: '#db2777' },
}

const coverStyle = computed(() => {
  const colors = tagColors[props.post.tag] ?? { from: '#3b82f6', to: '#1d4ed8' }
  return {
    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
  }
})

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
    </div>
    <div class="post-card__body">
      <span class="post-card__category">{{ post.category }}</span>
      <h3 class="post-card__title">{{ post.title }}</h3>
      <p class="post-card__excerpt">{{ post.excerpt }}</p>
      <div class="post-card__meta">
        <span>{{ formattedDate }}</span>
        <span class="post-card__dot" />
        <span>{{ post.readingTime }} 分钟</span>
        <span class="post-card__dot" />
        <span>{{ formattedViews }} 阅读</span>
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
    transform 0.2s var(--ease),
    box-shadow 0.2s var(--ease),
    border-color 0.2s var(--ease);
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

/* ── 封面 ── */
.post-card__cover {
  position: relative;
  flex-shrink: 0;
  width: 40%;
  min-height: 160px;
  overflow: hidden;
}

.post-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.3s var(--ease);
}

.post-card__tag {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-full);
}

/* ── 内容区 ── */
.post-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px;
  flex: 1;
  min-width: 0;
}

.post-card__category {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
}

.post-card__title {
  font-size: 18px;
  line-height: 1.4;
  color: var(--color-heading);
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
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.post-card__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

/* ── Featured 变体 ── */
.post-card--featured .post-card__cover {
  width: 45%;
  min-height: 280px;
}

.post-card--featured .post-card__body {
  padding: 32px 36px;
  justify-content: center;
}

.post-card--featured .post-card__title {
  font-size: 24px;
  line-height: 1.35;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.post-card--featured .post-card__excerpt {
  font-size: 15px;
  -webkit-line-clamp: 3;
  line-clamp: 3;
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
    min-height: 160px;
  }

  .post-card--featured .post-card__body {
    padding: 20px 24px;
  }

  .post-card--featured .post-card__title {
    font-size: 18px;
  }
}
</style>
