<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parsePostType, POST_TYPE, POST_TYPE_LABELS, type Post, type PostType } from '@/types/blog'
import { getPosts, getCategories, getTags } from '@/api/post'
import PostCard from '@/components/PostCard.vue'
import JournalEntry from '@/components/JournalEntry.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import Pagination from '@/components/Pagination.vue'
import PopularPosts from '@/components/PopularPosts.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import { useSeo } from '@/composables/useSeo'

const PAGE_SIZE = 4
const MAX_API_PAGE = 2147483647

const route = useRoute()
const router = useRouter()
const requestedPage = computed(() => {
  const value = Number(queryText(route.query.page) || 1)
  return Number.isInteger(value) && value > 0 && value <= MAX_API_PAGE ? value : 1
})
const category = computed(() => queryText(route.query.category))
const tag = computed(() => queryText(route.query.tag))
const activePostType = computed(() => parsePostType(route.query.postType))

function queryText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function pageHref(value: number): string {
  const query = new URLSearchParams()
  if (value > 1) query.set('page', String(value))
  if (category.value) query.set('category', category.value)
  if (tag.value) query.set('tag', tag.value)
  if (activePostType.value !== undefined) query.set('postType', String(activePostType.value))
  return '/articles' + (query.size ? '?' + query.toString() : '')
}

const posts = ref<Post[]>([])
const total = ref(0)
const pages = ref(1)
const currentPage = ref(1)
const loading = ref(true)
const loadError = ref('')

// 筛选维度（"全部" 表示不过滤，向后端传 undefined）
const categories = ref<string[]>(['全部'])
const tags = ref<string[]>(['全部'])
const activeCategory = computed(() => category.value || '全部')
const activeTag = computed(() => tag.value || '全部')

const archiveTabs = [
  { label: '全部', postType: undefined },
  { label: POST_TYPE_LABELS[POST_TYPE.article], postType: POST_TYPE.article },
  { label: POST_TYPE_LABELS[POST_TYPE.note], postType: POST_TYPE.note },
]
const archiveTitle = computed(() => activePostType.value === undefined ? '实验登记簿' : POST_TYPE_LABELS[activePostType.value])
const journalMonths = computed(() => {
  if (activePostType.value !== POST_TYPE.note) return []
  return posts.value.map((post, index) => {
    const month = post.date?.slice(0, 7)
    if (!month || month === posts.value[index - 1]?.date?.slice(0, 7)) return ''
    return month.slice(0, 4) + ' 年 ' + Number(month.slice(5)) + ' 月'
  })
})

useSeo({
  title: archiveTitle,
  description: 'Stewie 的实验登记簿，收录技术文章和随手记，支持按分类与主题浏览。',
  path: () => pageHref(requestedPage.value),
  keywords: ['Vue 3 教程', 'TypeScript 踩坑', 'Vite 配置', 'Pinia 实战', '前端博客'],
})

/** 根据当前筛选 + 页码向后端拉取数据 */
let requestId = 0
async function load() {
  const currentRequest = ++requestId
  loading.value = true
  loadError.value = ''
  try {
    const res = await getPosts({
      page: requestedPage.value,
      size: PAGE_SIZE,
      category: activeCategory.value === '全部' ? undefined : activeCategory.value,
      tag: activeTag.value === '全部' ? undefined : activeTag.value,
      postType: activePostType.value,
    })
    if (currentRequest !== requestId) return
    posts.value = res.list
    total.value = res.total
    pages.value = res.pages ?? 1
    currentPage.value = res.page ?? 1
  } catch (e) {
    if (currentRequest !== requestId) return
    posts.value = []
    total.value = 0
    pages.value = 1
    loadError.value = '文章暂时未能加载，请重试。'
    console.error('获取文章失败:', e)
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

function onCategoryChange(c: string) {
  router.push({ path: '/articles', query: { ...route.query, page: undefined, category: c === '全部' ? undefined : c } })
}

function onTagChange(t: string) {
  router.push({ path: '/articles', query: { ...route.query, page: undefined, tag: t === '全部' ? undefined : t } })
}

function openArchive(postType: PostType | undefined) {
  router.push({ path: '/articles', query: { ...route.query, page: undefined, postType } })
}

function onPageChange(p: number) {
  router.push(pageHref(p))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([requestedPage, activeCategory, activeTag, activePostType], load, { immediate: true })

onMounted(async () => {
  try {
    const [cats, tgs] = await Promise.all([getCategories(), getTags()])
    categories.value = ['全部', ...cats.map((category) => category.name)]
    tags.value = ['全部', ...tgs.map((tag) => tag.name)]
  } catch (e) {
    console.error('加载筛选维度失败:', e)
  }
})
</script>

<template>
  <div class="articles">
    <section class="welcome" :class="{ 'welcome--journal': activePostType === POST_TYPE.note }">
      <div class="welcome__decor" aria-hidden="true" />
      <div class="container welcome__inner">
        <div class="welcome__intro">
          <h1 class="welcome__title">{{ archiveTitle }}</h1>
          <p class="welcome__desc">{{ activePostType === POST_TYPE.note
            ? '技术练习、阶段复盘，以及写代码时随手记下的问题。'
            : '翻翻踩坑报告，也看看最近随手记下的东西。' }}</p>
        </div>
      </div>
    </section>

    <!-- ── 内容区 ── -->
    <section class="container articles__content" :class="{ 'articles__content--journal': activePostType === POST_TYPE.note }">
      <div class="articles__main">
        <nav class="articles__tabs" aria-label="内容分区">
          <button
            v-for="tab in archiveTabs"
            :key="tab.label"
            type="button"
            :aria-pressed="activePostType === tab.postType"
            @click="openArchive(tab.postType)"
          >
            {{ tab.label }}
          </button>
          <span v-if="activePostType === POST_TYPE.note && !loading && !loadError" class="articles__count">
            共 {{ total }} 篇
          </span>
        </nav>
        <div class="articles__filters">
          <div class="articles__filter-row">
            <span class="articles__filter-label">分类</span>
            <CategoryFilter
              :categories="categories"
              :active="activeCategory"
              @select="onCategoryChange"
            />
          </div>
          <details
            v-if="activePostType === POST_TYPE.note"
            class="articles__journal-filter"
            :open="activeTag !== '全部'"
          >
            <summary>按主题筛选<span v-if="activeTag !== '全部'"> · {{ activeTag }}</span></summary>
            <CategoryFilter :categories="tags" :active="activeTag" @select="onTagChange" />
          </details>
          <div v-else class="articles__filter-row">
            <span class="articles__filter-label">标签</span>
            <CategoryFilter
              :categories="tags"
              :active="activeTag"
              @select="onTagChange"
            />
          </div>
          <span v-if="activePostType !== POST_TYPE.note && !loading && !loadError" class="articles__count">共 {{ total }} 篇</span>
        </div>

        <TransitionGroup
          v-if="!loading && !loadError"
          name="list"
          tag="div"
          class="articles__list"
          appear
        >
          <div
            v-for="(post, index) in posts"
            :key="post.id"
            class="articles__item"
          >
            <h2 v-if="journalMonths[index]" class="articles__journal-month">{{ journalMonths[index] }}</h2>
            <JournalEntry v-if="post.postType === POST_TYPE.note" :post="post" :featured="!!journalMonths[index]" />
            <PostCard v-else :post="post" />
          </div>
        </TransitionGroup>

        <Pagination
          v-if="!loading && !loadError"
          :href-for-page="pageHref"
          :page="currentPage"
          :pages="pages"
          @change="onPageChange"
        />

        <p v-if="loading" class="articles__empty" role="status">正在翻找登记簿…</p>
        <div v-else-if="loadError" class="articles__empty" role="alert">
          <p>{{ loadError }}</p>
          <button type="button" class="articles__retry" @click="load">重试</button>
        </div>
        <div v-else-if="posts.length === 0" class="articles__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>该筛选条件下暂无内容。</p>
          <RouterLink v-if="activePostType !== undefined" to="/articles" class="articles__retry">浏览全部记录</RouterLink>
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

.articles__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-bottom: 26px;
  border-bottom: 1px solid var(--color-border);
}
.articles__tabs button {
  min-height: 44px;
  padding: 5px 7px;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-weight: 600;
}
.articles__tabs button[aria-pressed='true'] {
  border-color: var(--color-primary);
  color: var(--color-heading);
}
.articles__retry {
  display: inline-block;
  min-height: 44px;
  padding: 10px 0;
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 4px;
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

.articles__journal-filter > summary {
  padding-block: 10px;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 14px;
}

.articles__journal-filter[open] > summary { margin-bottom: 6px; }

.welcome--journal { padding-top: calc(var(--header-height) + 28px); padding-bottom: 28px; }
.articles__content--journal { padding-top: 22px; }
.articles__content--journal .articles__tabs { margin-bottom: 14px; }
.articles__content--journal .articles__filters { gap: 6px; margin-bottom: 12px; }
.articles__tabs .articles__count { margin-inline-start: auto; align-self: center; }

.articles__journal-month {
  margin: 0;
  color: var(--color-heading);
  font: 700 clamp(21px, 3vw, 30px)/1.4 var(--font-display);
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
  .articles__list {
    transition: none;
  }
}
</style>
