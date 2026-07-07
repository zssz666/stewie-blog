<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { author } from '@/data/posts'
import type { Post } from '@/types/blog'
import { getPosts } from '@/api/post'
import PostCard from '@/components/PostCard.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import PopularPosts from '@/components/PopularPosts.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import { useInView } from '@/composables/useInView'
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: '全部文章',
  description: 'Stewie 的前端开发文章合集。Vue 3 踩坑、TypeScript 类型技巧、Vite 配置、Pinia 实战，按标签筛选浏览。',
  path: '/articles',
})

const posts = ref<Post[]>([])

onMounted(async () => {
  try {
    posts.value = await getPosts()
  } catch (e) {
    console.error('获取文章失败:', e)
  }
})

const activeTag = ref('全部')

const tags = computed(() => {
  const set = new Set(posts.value.map((p) => p.tag))
  return ['全部', ...set]
})

const filteredPosts = computed(() =>
  activeTag.value === '全部'
    ? posts.value
    : posts.value.filter((p) => p.tag === activeTag.value),
)

const listRef = ref<HTMLElement | null>(null)
const { isInView } = useInView(listRef, 0.05)

const techStack = [
  { name: 'Vue 3', color: '#42b883' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Vite', color: '#646cff' },
  { name: 'Pinia', color: '#ffd859' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Java', color: '#ed8b00' },
]

const totalCount = computed(() => filteredPosts.value.length)
</script>

<template>
  <div class="articles">
    <!-- ── 欢迎区 ── -->
    <section class="welcome">
      <div class="welcome__decor" aria-hidden="true" />
      <div class="container welcome__inner">
        <div class="welcome__left">
          <div class="welcome__avatar">{{ author.name.charAt(0) }}</div>
          <div class="welcome__intro">
            <span class="welcome__eyebrow">BLOG</span>
            <h1 class="welcome__title">你好呀~ 我是{{ author.name }}</h1>
            <p class="welcome__desc">{{ author.bio }}</p>
          </div>
        </div>
        <div class="welcome__right">
          <div class="welcome__tech">
            <span
              v-for="tech in techStack"
              :key="tech.name"
              class="welcome__tech-item"
              :style="{ '--tech-color': tech.color }"
            >
              {{ tech.name }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 内容区 ── -->
    <section class="container articles__content">
      <div class="articles__main">
        <div class="articles__bar">
          <CategoryFilter
            :categories="tags"
            :active="activeTag"
            @select="activeTag = $event"
          />
          <span class="articles__count">{{ totalCount }} 篇文章</span>
        </div>

        <div
          ref="listRef"
          class="articles__list"
          :class="{ 'is-visible': isInView }"
        >
          <div
            v-for="(post, index) in filteredPosts"
            :key="post.id"
            class="articles__item"
            :style="{ '--delay': `${index * 70}ms` }"
          >
            <PostCard :post="post" />
          </div>
        </div>

        <div v-if="filteredPosts.length === 0" class="articles__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>该标签下暂无文章</p>
        </div>
      </div>

      <aside class="articles__sidebar">
        <ProfileCard />
        <PopularPosts />
      </aside>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   欢迎区
   ============================================================ */
.welcome {
  position: relative;
  padding-top: calc(var(--header-height) + 56px);
  padding-bottom: 48px;
  background: linear-gradient(to bottom, var(--color-bg-soft), var(--color-bg));
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}

.welcome__decor {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-primary-soft), transparent 70%);
  pointer-events: none;
}

.welcome__inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.welcome__left {
  display: flex;
  align-items: center;
  gap: 22px;
}

.welcome__avatar {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
  border: 3px solid var(--color-surface);
}

.welcome__eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.2em;
  margin-bottom: 6px;
}

.welcome__title {
  font-size: clamp(1.4rem, 3.2vw, 1.8rem);
  font-weight: 800;
  color: var(--color-heading);
  letter-spacing: -0.02em;
}

.welcome__desc {
  margin-top: 8px;
  max-width: 440px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.welcome__right {
  flex-shrink: 0;
}

.welcome__tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
  justify-content: flex-end;
}

.welcome__tech-item {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--tech-color);
  background: color-mix(in srgb, var(--tech-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--tech-color) 25%, transparent);
  border-radius: var(--radius-full);
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast);
}

.welcome__tech-item:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--tech-color) 18%, transparent);
}

/* ============================================================
   内容区
   ============================================================ */
.articles__content {
  display: flex;
  gap: 36px;
  padding-top: 44px;
  padding-bottom: var(--section-gap);
}

.articles__main {
  flex: 1;
  min-width: 0;
}

.articles__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.articles__count {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.02em;
}

.articles__sidebar {
  flex-shrink: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: sticky;
  top: calc(var(--header-height) + 24px);
  align-self: flex-start;
  max-height: calc(100vh - var(--header-height) - 48px);
  overflow-y: auto;
}

.articles__list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.articles__item {
  opacity: 0;
  transform: translateY(20px);
}

.articles__list.is-visible .articles__item {
  animation: card-enter 0.45s var(--ease) forwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes card-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.articles__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 72px 0;
  color: var(--color-text-tertiary);
  text-align: center;
}

.articles__empty p {
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .articles__content {
    flex-direction: column;
  }

  .articles__sidebar {
    width: 100%;
    position: static;
    max-height: none;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .articles__sidebar > * {
    flex: 1;
    min-width: 240px;
  }
}

@media (max-width: 640px) {
  .welcome__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome__tech {
    justify-content: flex-start;
    max-width: 100%;
  }

  .articles__sidebar {
    flex-direction: column;
  }

  .articles__bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .articles__item {
    opacity: 1;
    transform: none;
  }

  .articles__list.is-visible .articles__item {
    animation: none;
  }

  .welcome__tech-item:hover {
    transform: none;
  }
}
</style>
