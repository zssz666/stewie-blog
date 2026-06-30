<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { posts } from '@/data/posts'

const popularPosts = computed(() =>
  [...posts].sort((a, b) => b.views - a.views).slice(0, 3),
)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="popular">
    <h3 class="popular__title">热门文章</h3>
    <ul class="popular__list">
      <li v-for="(post, index) in popularPosts" :key="post.id">
        <RouterLink :to="`/post/${post.slug}`" class="popular__item">
          <span class="popular__num">{{ index + 1 }}</span>
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
  padding: 20px;
}

.popular__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.popular__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popular__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 6px 8px;
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
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 50%;
}

.popular__info {
  flex: 1;
  min-width: 0;
}

.popular__name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
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
  color: var(--color-text-secondary);
}
</style>
