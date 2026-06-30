<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getPostBySlug, author } from '@/data/posts'
import PopularPosts from '@/components/PopularPosts.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const post = computed(() => getPostBySlug(slug.value))

const formattedDate = computed(() => {
  if (!post.value) return ''
  return new Date(post.value.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const formattedViews = computed(() => {
  if (!post.value) return ''
  const v = post.value.views
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
})

/* ── 阅读进度条 ── */
const progress = ref(0)
const articleRef = ref<HTMLElement | null>(null)

function updateProgress() {
  const el = articleRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const total = el.offsetHeight - window.innerHeight
  const scrolled = -rect.top
  progress.value = Math.min(1, Math.max(0, scrolled / total))
}

/* ── 视差 banner ── */
const bannerRef = ref<HTMLElement | null>(null)

function updateParallax() {
  if (!bannerRef.value) return
  const scrolled = window.scrollY
  const bg = bannerRef.value.querySelector('.post__banner-bg') as HTMLElement | null
  if (bg) {
    bg.style.transform = `translateY(${scrolled * 0.4}px)`
  }
}

/* ── TOC 目录 ── */
interface TocItem {
  id: string
  text: string
  level: number
}

const tocItems = ref<TocItem[]>([])
const activeTocId = ref('')

function buildToc() {
  if (!articleRef.value) return
  const headings = articleRef.value.querySelectorAll('h2, h3')
  const items: TocItem[] = []
  headings.forEach((h, i) => {
    const text = h.textContent || `第${i + 1}节`
    const id = `heading-${i}`
    h.setAttribute('id', id)
    items.push({
      id,
      text,
      level: h.tagName === 'H2' ? 2 : 3,
    })
  })
  tocItems.value = items
}

let tocObserver: IntersectionObserver | null = null

function setupTocObserver() {
  if (!articleRef.value || tocItems.value.length === 0) return
  tocObserver?.disconnect()

  const headings = Array.from(articleRef.value.querySelectorAll('h2, h3'))
  tocObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeTocId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )

  headings.forEach((h) => tocObserver!.observe(h))
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

/* ── 代码块 macOS 增强 ── */
function enhanceCodeBlocks() {
  if (!articleRef.value) return
  const pres = articleRef.value.querySelectorAll('pre')
  pres.forEach((pre) => {
    if (pre.querySelector('.code-dots')) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    pre.parentNode!.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const header = document.createElement('div')
    header.className = 'code-block__header'
    const dots = document.createElement('div')
    dots.className = 'code-dots'
    dots.innerHTML =
      '<span class="code-dot code-dot--red"></span>' +
      '<span class="code-dot code-dot--yellow"></span>' +
      '<span class="code-dot code-dot--green"></span>'
    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-copy'
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', () => {
      const code = pre.querySelector('code')
      const text = code ? code.textContent : pre.textContent
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = '✓'
          copyBtn.classList.add('code-copy--copied')
          setTimeout(() => {
            copyBtn.textContent = '复制'
            copyBtn.classList.remove('code-copy--copied')
          }, 1500)
        })
      }
    })
    header.appendChild(dots)
    header.appendChild(copyBtn)
    wrapper.insertBefore(header, pre)
  })
}

/* ── 点赞 ── */
const liked = ref(false)
const likeCount = ref(0)

function toggleLike() {
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
}

/* ── 滚动监听 ── */
function handleScroll() {
  updateProgress()
  updateParallax()
}

onMounted(async () => {
  if (!post.value) return
  likeCount.value = Math.floor(post.value.views * 0.03)
  await nextTick()
  buildToc()
  enhanceCodeBlocks()
  setupTocObserver()
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  tocObserver?.disconnect()
})
</script>

<template>
  <article v-if="post" class="post">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ transform: `scaleX(${progress})` }" />

    <!-- 顶部 banner -->
    <header ref="bannerRef" class="post__banner">
      <div class="post__banner-bg" />
      <div class="post__banner-overlay" />
      <div class="container post__banner-inner">
        <RouterLink to="/articles" class="post__back">← 返回文章列表</RouterLink>
        <span class="post__tag">{{ post.tag }}</span>
        <h1 class="post__title">{{ post.title }}</h1>
        <div class="post__meta">
          <span>{{ author.name }}</span>
          <span class="post__dot" />
          <span>{{ formattedViews }} 阅读</span>
          <span class="post__dot" />
          <span>{{ post.readingTime }} 分钟</span>
          <span class="post__dot" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>
    </header>

    <!-- 正文 + 侧边栏 -->
    <div class="container post__layout">
      <div ref="articleRef" class="post__main">
        <!-- 摘要框 -->
        <div class="post__summary">
          <p>{{ post.excerpt }}</p>
        </div>

        <div class="article-content" v-html="post.content" />

        <!-- 底部互动 -->
        <div class="post__actions">
          <button
            class="like-btn"
            :class="{ 'like-btn--active': liked }"
            type="button"
            @click="toggleLike"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
            </svg>
            <span>{{ likeCount }}</span>
          </button>
          <RouterLink to="/articles" class="comment-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>评论</span>
          </RouterLink>
        </div>
      </div>

      <aside class="post__sidebar">
        <div v-if="tocItems.length > 0" class="post__toc">
          <p class="toc__title">目录</p>
          <ul class="toc__list">
            <li
              v-for="item in tocItems"
              :key="item.id"
              class="toc__item"
              :class="[
                `toc__item--h${item.level}`,
                { 'toc__item--active': activeTocId === item.id },
              ]"
              @click="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </li>
          </ul>
        </div>
        <PopularPosts />
      </aside>
    </div>
  </article>

  <div v-else class="container post__missing">
    <h1 class="post__missing-title">404</h1>
    <p class="post__missing-text">这篇文章不存在或已被移除。</p>
    <RouterLink to="/" class="btn btn-primary">回到首页</RouterLink>
  </div>
</template>

<style scoped>
/* ── 阅读进度条 ── */
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: left center;
  z-index: 200;
  transition: transform 0.05s linear;
}

/* ── banner ── */
.post__banner {
  position: relative;
  height: 40vh;
  min-height: 280px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.post__banner-bg {
  position: absolute;
  inset: -20% 0 0 0;
  height: 140%;
  background: linear-gradient(135deg, var(--hero-dark-1), var(--hero-dark-2), var(--hero-dark-3));
  will-change: transform;
}

.post__banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5));
}

.post__banner-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  color: #fff;
}

.post__back {
  position: absolute;
  top: 0;
  left: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.post__back:hover {
  color: #fff;
}

.post__tag {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-full);
}

.post__title {
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  font-weight: 800;
  line-height: 1.25;
  color: #fff;
  max-width: 760px;
  letter-spacing: -0.02em;
}

.post__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  flex-wrap: wrap;
  justify-content: center;
}

.post__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

/* ── 布局 ── */
.post__layout {
  display: flex;
  gap: 32px;
  padding-top: 48px;
  padding-bottom: var(--section-gap);
}

.post__main {
  flex: 1;
  min-width: 0;
  max-width: var(--content-width);
}

.post__sidebar {
  flex-shrink: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 摘要框 ── */
.post__summary {
  margin-bottom: 32px;
  padding: 20px 24px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.post__summary p {
  font-size: 15px;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

/* ── TOC ── */
.post__toc {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  position: sticky;
  top: calc(var(--header-height) + 24px);
  max-height: calc(100vh - var(--header-height) - 48px);
  overflow-y: auto;
}

.toc__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.toc__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc__item {
  padding: 6px 0 6px 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-left: 2px solid transparent;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.toc__item--h3 {
  padding-left: 28px;
  font-size: 12px;
}

.toc__item:hover {
  color: var(--color-heading);
}

.toc__item--active {
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 600;
}

/* ── 底部互动 ── */
.post__actions {
  display: flex;
  gap: 16px;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--color-border);
}

.like-btn,
.comment-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.like-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.like-btn--active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.like-btn--active:hover {
  background: var(--color-primary-hover);
}

.comment-link:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* ── 404 ── */
.post__missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: calc(var(--header-height) + 100px);
  padding-bottom: 100px;
  gap: 14px;
}

.post__missing-title {
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-primary);
}

.post__missing-text {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .post__sidebar {
    display: none;
  }
}

@media (max-width: 640px) {
  .post__banner {
    min-height: 240px;
  }

  .post__layout {
    padding-top: 32px;
  }

  .post__actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post__banner-bg {
    transform: none !important;
  }
}
</style>
