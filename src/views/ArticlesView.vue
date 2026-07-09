<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Author, Post } from '@/types/blog'
import { getPosts, getCategories, getTags } from '@/api/post'
import { getAuthor } from '@/api/author'
import PostCard from '@/components/PostCard.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import Pagination from '@/components/Pagination.vue'
import PopularPosts from '@/components/PopularPosts.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: '全部文章',
  description: 'Stewie 的前端开发文章合集。Vue 3 踩坑、TypeScript 类型技巧、Vite 配置、Pinia 实战，按分类与标签筛选浏览。',
  path: '/articles',
})

// 每页条数：当前种子数据较少，设为 4 以便直观演示分页效果（可按需调大）
const PAGE_SIZE = 4

const posts = ref<Post[]>([])
const total = ref(0)
const pages = ref(1)
const page = ref(1)
const loading = ref(false)

// 筛选维度（"全部" 表示不过滤，向后端传 undefined）
const categories = ref<string[]>(['全部'])
const tags = ref<string[]>(['全部'])
const activeCategory = ref('全部')
const activeTag = ref('全部')

// 占位值，接口返回前模板不会报错
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

const techStack = [
  { name: 'Vue 3', color: '#42b883' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Vite', color: '#646cff' },
  { name: 'Pinia', color: '#ffd859' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Java', color: '#ed8b00' },
]

/** 根据当前筛选 + 页码向后端拉取数据 */
async function load() {
  loading.value = true
  try {
    const res = await getPosts({
      page: page.value,
      size: PAGE_SIZE,
      category: activeCategory.value === '全部' ? undefined : activeCategory.value,
      tag: activeTag.value === '全部' ? undefined : activeTag.value,
    })
    posts.value = res.list
    total.value = res.total
    pages.value = res.pages ?? 1
    page.value = res.page
  } catch (e) {
    console.error('获取文章失败:', e)
  } finally {
    loading.value = false
  }
}

function onCategoryChange(c: string) {
  activeCategory.value = c
  page.value = 1
  load()
}

function onTagChange(t: string) {
  activeTag.value = t
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  // 并行拉取全量分类 / 标签，用于渲染筛选条
  try {
    const [cats, tgs] = await Promise.all([getCategories(), getTags()])
    categories.value = ['全部', ...cats.map((c) => c.name)]
    tags.value = ['全部', ...tgs.map((t) => t.name)]
  } catch (e) {
    console.error('加载筛选维度失败:', e)
  }

  await load()

  try {
    author.value = await getAuthor()
  } catch (e) {
    console.error('获取作者信息失败:', e)
  }
})
</script>

<template>
  <div class="articles">
    <!-- ── 欢迎区 ── -->
    <section class="welcome">
      <div class="welcome__decor" aria-hidden="true" />
      <div class="container welcome__inner">
        <div class="welcome__left" v-reveal>
          <div class="welcome__avatar">{{ author.name.charAt(0) }}</div>
          <div class="welcome__intro">
            <h1 class="welcome__title">你好呀~ 我是{{ author.name }}</h1>
            <p class="welcome__desc">{{ author.bio }}</p>
          </div>
        </div>
        <div class="welcome__right" v-reveal="120">
          <div class="welcome__tech">
            <span
              v-for="tech in techStack"
              :key="tech.name"
              class="welcome__tech-item"
              :style="{ '--tech-color': tech.color }"
              v-reveal.zoom="techStack.indexOf(tech) * 60"
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
        <!-- 筛选区：分类 + 标签 -->
        <div class="articles__filters" v-reveal>
          <div class="articles__filter-row">
            <span class="articles__filter-label">分类</span>
            <CategoryFilter
              :categories="categories"
              :active="activeCategory"
              @select="onCategoryChange"
            />
          </div>
          <div class="articles__filter-row">
            <span class="articles__filter-label">标签</span>
            <CategoryFilter
              :categories="tags"
              :active="activeTag"
              @select="onTagChange"
            />
          </div>
          <span class="articles__count">共 {{ total }} 篇文章</span>
        </div>

        <TransitionGroup
          name="list"
          tag="div"
          class="articles__list"
          :class="{ 'articles__list--loading': loading }"
          appear
        >
          <div
            v-for="post in posts"
            :key="post.id"
            class="articles__item"
          >
            <PostCard :post="post" />
          </div>
        </TransitionGroup>

        <Pagination
          :page="page"
          :pages="pages"
          :total="total"
          @change="onPageChange"
        />

        <div v-if="posts.length === 0" class="articles__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>该筛选条件下暂无文章</p>
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

/* ── 筛选区 ── */
.articles__filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.articles__filter-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.articles__filter-label {
  flex-shrink: 0;
  width: 40px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
}

.articles__count {
  align-self: flex-end;
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 22px;
  transition: opacity var(--transition-fast);
}

.articles__list--loading {
  opacity: 0.55;
  pointer-events: none;
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

  .articles__filter-row {
    align-items: flex-start;
  }

  .articles__filter-label {
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome__tech-item:hover {
    transform: none;
  }

  .articles__list {
    transition: none;
  }
}
</style>
