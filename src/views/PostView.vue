<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { Author, Post } from '@/types/blog'
import { getPostBySlug } from '@/api/post'
import { getAuthor } from '@/api/author'
import { useUiStore } from '@/stores/ui'
import PopularPosts from '@/components/PopularPosts.vue'

const route = useRoute()
const uiStore = useUiStore()
const slug = computed(() => String(route.params.slug ?? ''))

const post = ref<Post | null>(null)
const loading = ref(true)
// 占位值，接口返回前模板不会报错
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

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
    const top = el.getBoundingClientRect().top + window.scrollY - 90
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
          copyBtn.textContent = '✓ 已复制'
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

async function loadPost() {
  loading.value = true
  post.value = null
  try {
    const data = await getPostBySlug(slug.value)
    post.value = data
    liked.value = false
    // 用真实点赞数初始化（后端暂无独立点赞接口，前端仅做本地乐观切换）
    likeCount.value = data.likes ?? 0
    uiStore.setPostTitle(data.title) // 供导航栏吸顶显示
    nextTick(() => {
      buildToc()
      enhanceCodeBlocks()
      setupTocObserver()
      handleScroll()
    })
  } catch (e) {
    post.value = null
    uiStore.clearPostTitle()
    console.error('获取文章失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  loadPost()
  getAuthor()
    .then((a) => { author.value = a })
    .catch((e) => console.error('获取作者信息失败:', e))
})

// 切换文章（slug 变化，组件被复用）时重新拉取
watch(slug, () => {
  loadPost()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  tocObserver?.disconnect()
  uiStore.clearPostTitle()
})
</script>

<template>
  <div v-if="loading" class="post__loading">加载中…</div>

  <article v-else-if="post" class="post">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ transform: `scaleX(${progress})` }" />

    <!-- 顶部 banner -->
    <header ref="bannerRef" class="post__banner">
      <div class="post__banner-bg" />
      <div class="post__banner-grid" aria-hidden="true" />
      <div class="post__banner-overlay" />
      <div class="container post__banner-inner" v-reveal>
        <RouterLink to="/articles" class="post__back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          返回文章列表
        </RouterLink>
        <span class="post__tag">{{ post.tag }}</span>
        <h1 class="post__title">{{ post.title }}</h1>
        <div class="post__meta">
          <span class="post__author">
            <span class="post__author-avatar">{{ author.name.charAt(0) }}</span>
            {{ author.name }}
          </span>
          <span class="post__dot" />
          <span>{{ formattedViews }} 阅读</span>
          <span class="post__dot" />
          <span>{{ post.readingTime }} 分钟</span>
          <span class="post__dot" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>

      <!-- 文章顶部波浪效果（复刻 burgess-t.cn gentle-wave） -->
      <section class="main-hero-waves-area waves-area post-waves" aria-hidden="true">
        <svg class="waves-svg" preserveAspectRatio="none" shape-rendering="auto" viewBox="0 24 150 28" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="gentle-wave-post" d="M -160 44 c 30 0 58 -18 88 -18 s 58 18 88 18 s 58 -18 88 -18 s 58 18 88 18 v 44 h -352 Z" />
          </defs>
          <g class="parallax">
            <g transform="translate(48, 0)">
              <use href="#gentle-wave-post" opacity="0.5">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="7s" begin="-2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
              </use>
            </g>
            <g transform="translate(48, 3)">
              <use href="#gentle-wave-post" opacity="0.6">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="10s" begin="-3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
              </use>
            </g>
            <g transform="translate(48, 5)">
              <use href="#gentle-wave-post" opacity="0.7">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="13s" begin="-4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
              </use>
            </g>
            <g transform="translate(48, 7)">
              <use href="#gentle-wave-post">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="20s" begin="-5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
              </use>
            </g>
          </g>
        </svg>
      </section>
    </header>

    <!-- 正文 + 侧边栏 -->
    <div class="container post__layout">
      <div ref="articleRef" class="post__main">
        <!-- 摘要框 -->
        <div class="post__summary" v-reveal>
          <svg class="post__summary-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <p>{{ post.excerpt }}</p>
        </div>

        <div class="article-content" v-html="post.content" />

        <!-- 底部互动 -->
        <div class="post__actions" v-reveal>
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
            <span class="like-btn__label">{{ liked ? '已赞' : '点赞' }}</span>
          </button>
          <RouterLink to="/articles" class="comment-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>评论</span>
          </RouterLink>
        </div>
      </div>

      <aside class="post__sidebar" v-reveal>
        <div v-if="tocItems.length > 0" class="post__toc">
          <p class="toc__title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            目录
          </p>
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
  height: 3px;
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-hover));
  transform: scaleX(0);
  transform-origin: left center;
  z-index: 200;
  transition: transform 0.05s linear;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
}

/* ── banner ── */
.post__banner {
  position: relative;
  height: 46vh;
  min-height: 320px;
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

.post__banner-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(96, 165, 250, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 165, 250, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  pointer-events: none;
}

.post__banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.5));
}

.post__banner-inner {
  position: relative;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  color: #fff;
  padding-top: 20px;
}

.post__back {
  position: absolute;
  top: -10px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.post__back:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.post__tag {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
}

.post__title {
  font-size: clamp(1.7rem, 5vw, 2.8rem);
  font-weight: 800;
  line-height: 1.25;
  color: #fff;
  max-width: 820px;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.3);
}

.post__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  flex-wrap: wrap;
  justify-content: center;
}

.post__author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.post__author-avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 50%;
}

.post__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}

/* ── 文章顶部波浪（复刻 burgess-t.cn gentle-wave） ── */
/* 单个 path 复用 4 层 <use>，fill 用页面底色，靠透明度叠出层次；运动由内联 SMIL <animateTransform> 驱动 */
.main-hero-waves-area {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: -11px;
  z-index: 1;
  pointer-events: none;
}

.post-waves .parallax use {
  fill: var(--color-bg);
}
.post__layout {
  display: flex;
  gap: 40px;
  padding-top: 56px;
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
  gap: 22px;
  position: sticky;
  top: calc(var(--header-height) + 20px);
  align-self: flex-start;
  max-height: calc(100vh - var(--header-height) - 40px);
  overflow-y: auto;

  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.post__sidebar::-webkit-scrollbar {
  display: none;
}

/* ── 摘要框 ── */
.post__summary {
  position: relative;
  display: flex;
  gap: 14px;
  margin-bottom: 36px;
  padding: 22px 24px;
  background: linear-gradient(135deg, var(--color-primary-softer), transparent);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.post__summary-icon {
  flex-shrink: 0;
  color: var(--color-primary);
  opacity: 0.7;
  margin-top: 2px;
}

.post__summary p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* ── TOC ── */
.post__toc {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px;
}

.toc__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  letter-spacing: 0.02em;
}

.toc__title svg {
  color: var(--color-primary);
}

.toc__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc__item {
  padding: 7px 0 7px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-left: 2px solid transparent;
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.toc__item--h3 {
  padding-left: 30px;
  font-size: 12.5px;
}

.toc__item:hover {
  color: var(--color-heading);
  background: var(--color-bg-soft);
}

.toc__item--active {
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  background: var(--color-primary-soft);
  font-weight: 600;
}

/* ── 底部互动 ── */
.post__actions {
  display: flex;
  gap: 14px;
  margin-top: 52px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
}

.like-btn,
.comment-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.like-btn:hover,
.comment-link:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.like-btn--active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-primary);
}

.like-btn--active:hover {
  background: var(--color-primary-hover);
  color: #fff;
}

.like-btn__label {
  margin-left: 4px;
  padding-left: 8px;
  border-left: 1px solid currentColor;
  opacity: 0.5;
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
  gap: 16px;
}

.post__missing-title {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.04em;
}

.post__missing-text {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.post__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .post__sidebar {
    display: none;
  }
}

@media (max-width: 640px) {
  .post__banner {
    min-height: 280px;
  }

  /* 移动端隐藏波浪（与参考站一致） */
  .main-hero-waves-area {
    display: none;
  }

  .post__layout {
    padding-top: 36px;
    gap: 0;
  }

  .post__actions {
    flex-direction: column;
  }

  .post__summary {
    padding: 18px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post__banner-bg {
    transform: none !important;
  }

  .like-btn:hover,
  .comment-link:hover {
    transform: none;
  }
}
</style>
