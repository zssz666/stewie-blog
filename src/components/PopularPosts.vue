<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { getPopularPosts } from '@/api/post'

const popularPosts = ref<Post[]>([])

onMounted(async () => {
  try {
    popularPosts.value = await getPopularPosts()
  } catch (e) {
    console.error('获取热门文章失败:', e)
  }
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="popular">
    <div class="popular__head">
      <h3 class="popular__title">热门文章</h3>
      <span class="popular__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
        </svg>
      </span>
    </div>
    <ul class="popular__list">
      <li v-for="(post, index) in popularPosts" :key="post.id">
        <RouterLink :to="`/post/${post.slug}`" class="popular__item">
          <span
            class="popular__num"
            :class="{ 'popular__num--top': index < 3 }"
          >
            {{ index + 1 }}
          </span>
          <div class="popular__info">
            <p class="popular__name">{{ post.title }}</p>
            <span class="popular__date">{{ formatDate(post.date) }}</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.popular {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-sm);
}

.popular__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.popular__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: 0.02em;
}

.popular__icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  border-radius: var(--radius-sm);
}

.popular__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.popular__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.popular__item:hover {
  background: var(--color-bg-soft);
}

.popular__item:hover .popular__name {
  color: var(--color-primary);
}

.popular__num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  background: var(--color-bg-mute);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.popular__num--top {
  color: #fff;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.popular__info {
  flex: 1;
  min-width: 0;
}

.popular__name {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.55;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.popular__date {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
