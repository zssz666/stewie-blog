<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/blog'
import { searchPosts } from '@/api/post'
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: '搜索',
  description: '在 Stewie 的博客中搜索文章',
  path: '/search',
})

const route = useRoute()
const router = useRouter()

const query = ref<string>((route.query.q as string) || '')
const results = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const pages = ref(0)
const loading = ref(false)
const submitted = ref(false) // 是否已经发起过一次搜索（用于区分初始空态）

async function runSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    total.value = 0
    submitted.value = false
    return
  }
  submitted.value = true
  loading.value = true
  try {
    const res = await searchPosts(q, page.value, size.value)
    results.value = res.list
    total.value = res.total
    pages.value = res.pages ?? Math.max(1, Math.ceil(res.total / res.size))
  } catch (e) {
    console.error('搜索失败:', e)
    results.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function submit() {
  page.value = 1
  const q = query.value.trim()
  // 同步到 URL，便于刷新/分享
  router.replace({ name: 'search', query: q ? { q } : {} })
  runSearch()
}

function goPage(p: number) {
  if (p < 1 || p > pages.value) return
  page.value = p
  runSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/* 路由 ?q= 变化时（如从导航栏进入已带关键词）自动搜索 */
watch(
  () => route.query.q,
  (q) => {
    query.value = (q as string) || ''
    page.value = 1
    runSearch()
  },
)

onMounted(() => {
  if (query.value.trim()) runSearch()
})

/* ── 关键词高亮（先转义后包裹 <mark>，杜绝 XSS） ── */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlight(text: string, q: string): string {
  const safe = escapeHtml(text)
  const kw = q.trim()
  if (!kw) return safe
  // 转义正则特殊字符，按整词（不区分大小写）匹配
  const escQ = escapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(`(${escQ})`, 'gi'), '<mark>$1</mark>')
}

const highlightQuery = computed(() => query.value.trim())
</script>

<template>
  <div class="search container">
    <header class="search__head">
      <h1 class="search__title">搜索文章</h1>
      <p class="search__sub">在标题、摘要与正文中检索关键词</p>

      <form class="search__bar" role="search" @submit.prevent="submit">
        <svg class="search__ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="query"
          class="search__input"
          type="search"
          placeholder="输入关键词，如「Vue」「部署」「Spring Boot」…"
          aria-label="搜索关键词"
          autocomplete="off"
        />
        <button class="search__submit" type="submit">搜索</button>
      </form>
    </header>

    <!-- 加载 -->
    <div v-if="loading" class="search__state">搜索中…</div>

    <!-- 未搜索的空态 -->
    <div v-else-if="!submitted" class="search__state search__state--muted">
      输入关键词开始搜索 🔍
    </div>

    <!-- 无结果 -->
    <div v-else-if="!results.length" class="search__state search__state--muted">
      没有找到与「<strong>{{ highlightQuery }}</strong>」相关的文章
    </div>

    <!-- 结果列表 -->
    <template v-else>
      <p class="search__count">
        找到 <strong>{{ total }}</strong> 篇与「<strong>{{ highlightQuery }}</strong>」相关的文章
      </p>

      <ul class="search__list">
        <li v-for="post in results" :key="post.id" class="result" v-reveal>
          <RouterLink :to="`/post/${post.slug}`" class="result__link">
            <div
              v-if="post.cover"
              class="result__cover"
              :style="{ backgroundImage: `url(${post.cover})` }"
            />
            <div class="result__body">
              <h2 class="result__title" v-html="highlight(post.title, highlightQuery)" />
              <p class="result__excerpt" v-html="highlight(post.excerpt || '', highlightQuery)" />
              <div class="result__meta">
                <span v-if="post.category" class="result__chip">{{ post.category }}</span>
                <span class="result__date">{{ post.date }}</span>
                <span class="result__views">{{ post.views }} 次阅读</span>
              </div>
            </div>
          </RouterLink>
        </li>
      </ul>

      <!-- 分页 -->
      <nav v-if="pages > 1" class="search__pager" aria-label="分页">
        <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <span class="search__pager-info">第 {{ page }} / {{ pages }} 页</span>
        <button :disabled="page >= pages" @click="goPage(page + 1)">下一页</button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.search {
  padding-top: calc(var(--header-height) + 48px);
  padding-bottom: 80px;
  max-width: 760px;
}

.search__head {
  margin-bottom: 28px;
}

.search__title {
  font-size: clamp(1.8rem, 4.5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-heading);
}

.search__sub {
  margin-top: 8px;
  color: var(--color-text-tertiary);
  font-size: 14px;
}

/* 搜索框 */
.search__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding: 6px 6px 6px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
}

.search__bar:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.search__ico {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 15px;
  padding: 10px 4px;
}

.search__input::placeholder {
  color: var(--color-text-tertiary);
}

.search__submit {
  flex-shrink: 0;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: filter 0.2s, transform 0.2s;
}

.search__submit:hover {
  filter: brightness(1.06);
}

.search__submit:active {
  transform: translateY(1px);
}

/* 状态 */
.search__state {
  padding: 56px 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 15px;
}

.search__state--muted {
  color: var(--color-text-tertiary);
}

.search__count {
  margin-bottom: 18px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.search__count strong {
  color: var(--color-primary);
}

/* 结果列表 */
.search__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.result:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.result__link {
  display: flex;
  gap: 16px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
}

.result__cover {
  width: 96px;
  height: 72px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background-size: cover;
  background-position: center;
  background-color: var(--color-primary-soft);
}

.result__body {
  min-width: 0;
  flex: 1;
}

.result__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-heading);
  line-height: 1.4;
}

.result__excerpt {
  margin: 0 0 10px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.result__chip {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

:deep(mark) {
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  color: var(--color-heading);
  padding: 0 1px;
  border-radius: 3px;
}

/* 分页 */
.search__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
}

.search__pager button {
  height: 38px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.search__pager button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.search__pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search__pager-info {
  font-size: 13px;
  color: var(--color-text-secondary);
}

@media (max-width: 560px) {
  .result__link {
    flex-direction: column;
  }
  .result__cover {
    width: 100%;
    height: 140px;
  }
}
</style>
