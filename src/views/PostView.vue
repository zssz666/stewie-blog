<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { Author, Post, Comment } from '@/types/blog'
import { getPostBySlug, incrementViews } from '@/api/post'
import { getAuthor } from '@/api/author'
import { resolveAsset } from '@/api/request'
import {
  getLikeStatus,
  likePost,
  getComments,
  createComment,
} from '@/api/interaction'
import { useUiStore } from '@/stores/ui'
import { useSeo } from '@/composables/useSeo'
import { enhanceCodeBlocks } from '@/utils/article'
import PopularPosts from '@/components/PopularPosts.vue'

const route = useRoute()
const uiStore = useUiStore()
const slug = computed(() => String(route.params.slug ?? ''))

const post = ref<Post | null>(null)
const loading = ref(true)
// 占位值，接口返回前模板不会报错
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

// 每篇文章独立 SEO：标题 / canonical / og 随文章切换响应式更新
useSeo({
  title: computed(() => post.value?.title),
  description: computed(() => post.value?.excerpt),
  path: computed(() => (post.value ? `/post/${post.value.slug}` : undefined)),
  image: computed(() => (post.value?.cover ? resolveAsset(post.value.cover) : undefined)),
  type: 'article',
})

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

/* ── 代码块 macOS 增强（逻辑在 @/utils/article，文章页与后台预览共用） ── */

/* ── 点赞（真实接口，指纹去重） ── */
const liked = ref(false)
const likeCount = ref(0)

async function loadLikeStatus() {
  if (!post.value) return
  try {
    const res = await getLikeStatus(post.value.id)
    liked.value = res.liked
    likeCount.value = res.likes
  } catch (e) {
    console.error('获取点赞状态失败:', e)
  }
}

async function toggleLike() {
  // 已赞则幂等，不再发请求（防重复点赞）
  if (!post.value || liked.value) return
  try {
    const res = await likePost(post.value.id)
    liked.value = res.liked
    likeCount.value = res.likes
  } catch (e) {
    console.error('点赞失败:', e)
  }
}

/* ── 评论（真实接口） ── */
const comments = ref<Comment[]>([])
const commentCount = computed(() => {
  let n = 0
  const walk = (list: Comment[]) =>
    list.forEach((c) => {
      n += 1
      if (c.replies?.length) walk(c.replies)
    })
  walk(comments.value)
  return n
})

async function loadComments() {
  if (!post.value) return
  try {
    comments.value = await getComments(post.value.id)
  } catch (e) {
    console.error('获取评论失败:', e)
    comments.value = []
  }
}

const commentForm = reactive({
  nickname: '',
  email: '',
  content: '',
})
const replyingTo = ref<{ id: number; nickname: string } | null>(null)
const commentSubmitting = ref(false)
const commentNotice = ref('')

function startReply(comment: Comment) {
  replyingTo.value = { id: comment.id, nickname: comment.nickname }
  nextTick(() =>
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' }),
  )
}

function cancelReply() {
  replyingTo.value = null
}

async function submitComment() {
  if (!post.value) return
  const nickname = commentForm.nickname.trim()
  const content = commentForm.content.trim()
  if (!nickname || !content) {
    commentNotice.value = '昵称和评论内容不能为空'
    return
  }
  commentSubmitting.value = true
  commentNotice.value = ''
  try {
    await createComment(post.value.id, {
      nickname,
      email: commentForm.email.trim() || undefined,
      content,
      parentId: replyingTo.value?.id ?? null,
    })
    commentForm.content = ''
    replyingTo.value = null
    commentNotice.value = '评论已提交，审核通过后将公开展示，感谢你的参与！'
  } catch (e) {
    commentNotice.value = '提交失败，请稍后重试'
    console.error('提交评论失败:', e)
  } finally {
    commentSubmitting.value = false
  }
}

function scrollToComments() {
  document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
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
    likeCount.value = data.likes ?? 0
    // 浏览量埋点：发起 +1 请求（不阻塞渲染），并乐观更新本地计数
    incrementViews(data.id).catch(() => {})
    if (post.value) post.value.views = (data.views ?? 0) + 1
    // 重置互动区（切换文章时）
    comments.value = []
    commentForm.nickname = ''
    commentForm.email = ''
    commentForm.content = ''
    replyingTo.value = null
    commentNotice.value = ''
    // 并行加载点赞状态与评论树
    await Promise.all([loadLikeStatus(), loadComments()])
    uiStore.setPostTitle(data.title) // 供导航栏吸顶显示
    // 先结束 loading，确保 .post__main（含 v-html 正文与 articleRef）已挂载，
    // 再在 nextTick 中增强代码块：否则 articleRef 为 null，macOS 装饰不会生成
    loading.value = false
    nextTick(() => {
      buildToc()
      if (articleRef.value) enhanceCodeBlocks(articleRef.value)
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
  <article class="post">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ transform: `scaleX(${progress})` }" />

    <!-- 顶部 banner -->
    <!-- 顶部 banner -->
    <header ref="bannerRef" class="post__banner">
      <!-- 仅在无封面图时显示渐变底色 -->
      <div v-if="!post?.cover" class="post__banner-bg" />

      <!-- 统一封面主图：铺满容器，彻底废弃 blur 副图补边方案 -->
      <img
        v-if="post?.cover"
        :src="resolveAsset(post.cover)"
        :alt="post.title"
        class="post__banner-cover"
      />
      
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
        <p v-if="loading" class="post__loading-inline">加载中…</p>
        <template v-else-if="post">
          <span class="post__tag">{{ post?.tag }}</span>
          <h1 class="post__title">{{ post?.title }}</h1>
          <div class="post__meta">
            <span class="post__author">
              <img
                v-if="author.avatar"
                :src="resolveAsset(author.avatar)"
                :alt="author.name"
                class="post__author-avatar post__author-avatar--img"
              />
              <span v-else class="post__author-avatar">{{ author.name.charAt(0) }}</span>
              {{ author.name }}
            </span>
            <span class="post__dot" />
            <span>{{ formattedViews }} 阅读</span>
            <span class="post__dot" />
            <span>{{ post?.readingTime }} 分钟</span>
            <span class="post__dot" />
            <span>{{ formattedDate }}</span>
          </div>
        </template>
        <p v-else class="post__missing-inline">文章不存在或已被移除</p>
      </div>

      <!-- 文章顶部波浪效果（保持不变） -->
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
    <div class="container post__layout" v-if="post && !loading">
      <div ref="articleRef" class="post__main">
        <!-- 摘要框 -->
        <div class="post__summary" v-reveal>
          <svg class="post__summary-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <div class="post__summary-body">
            <p>{{ post?.excerpt }}</p>
            <span class="post__summary-ai">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              摘要由 AI 生成
            </span>
          </div>
        </div>

        <div class="article-content" v-html="post?.content" />

        <!-- 底部互动 -->
        <div class="post__actions" v-reveal>
          <button
            class="like-btn"
            :class="{ 'like-btn--active': liked }"
            type="button"
            :disabled="liked"
            @click="toggleLike"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
            </svg>
            <span>{{ likeCount }}</span>
            <span class="like-btn__label">{{ liked ? '已赞' : '点赞' }}</span>
          </button>
          <button class="comment-link" type="button" @click="scrollToComments">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>评论 {{ commentCount }}</span>
          </button>
        </div>

        <!-- 评论区（阶段 5） -->
        <section id="comments" class="comments" v-reveal>
          <h2 class="comments__title">
            评论 <span class="comments__count">{{ commentCount }}</span>
          </h2>

          <ul v-if="comments.length" class="comments__list">
            <li v-for="c in comments" :key="c.id" class="comment">
              <div class="comment__avatar">{{ c.nickname.charAt(0) }}</div>
              <div class="comment__body">
                <div class="comment__meta">
                  <span class="comment__nick">{{ c.nickname }}</span>
                  <span class="comment__date">{{ c.createdAt }}</span>
                </div>
                <p class="comment__content">{{ c.content }}</p>
                <button class="comment__reply" type="button" @click="startReply(c)">回复</button>

                <ul v-if="c.replies && c.replies.length" class="comments__list comments__list--reply">
                  <li v-for="r in c.replies" :key="r.id" class="comment comment--reply">
                    <div class="comment__avatar comment__avatar--sm">{{ r.nickname.charAt(0) }}</div>
                    <div class="comment__body">
                      <div class="comment__meta">
                        <span class="comment__nick">{{ r.nickname }}</span>
                        <span class="comment__date">{{ r.createdAt }}</span>
                      </div>
                      <p class="comment__content">{{ r.content }}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <p v-else class="comments__empty">还没有评论，来抢沙发吧～</p>

          <!-- 评论表单 -->
          <form id="comment-form" class="comment-form" @submit.prevent="submitComment">
            <p v-if="replyingTo" class="comment-form__reply">
              回复 <strong>@{{ replyingTo.nickname }}</strong>
              <button type="button" class="comment-form__cancel" @click="cancelReply">取消</button>
            </p>
            <div class="comment-form__row">
              <input
                v-model="commentForm.nickname"
                class="comment-form__input"
                type="text"
                placeholder="昵称（必填）"
                maxlength="50"
              />
              <input
                v-model="commentForm.email"
                class="comment-form__input"
                type="email"
                placeholder="邮箱（选填，不公开）"
                maxlength="100"
              />
            </div>
            <textarea
              v-model="commentForm.content"
              class="comment-form__textarea"
              placeholder="写下你的评论…"
              maxlength="500"
              rows="4"
            />
            <div class="comment-form__footer">
              <span v-if="commentNotice" class="comment-form__notice">{{ commentNotice }}</span>
              <button type="submit" class="comment-form__submit" :disabled="commentSubmitting">
                {{ commentSubmitting ? '提交中…' : '发表评论' }}
              </button>
            </div>
          </form>
        </section>
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

.post__banner {
  position: relative;
  height: 42vh; /* 稍微增加高度比例，让画面更大气 */
  min-height: 320px;
  max-height: 480px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.post__banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--hero-dark-1), var(--hero-dark-2), var(--hero-dark-3));
  will-change: transform;
  z-index: 0;
}

/* 封面主图：完整显示，不裁切，居中叠加在模糊层之上 */
.post__banner-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; 
  z-index: 1;
}

/* 优化网格：降低透明度，避免干扰背景图细节 */
.post__banner-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  pointer-events: none;
  z-index: 2;
  opacity: 0.4; /* 调低网格存在感，让画面更干净 */
}

/* 核心修改：移除 backdrop-filter，改用平滑的渐变遮罩 */
.post__banner-overlay {
  position: absolute;
  inset: 0;
  /* 顶部微暗保留天空细节，中部适中，底部加深以突出白色文字和波浪边缘 */
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.4) 40%,
    rgba(0, 0, 0, 0.75) 100%
  );
  z-index: 3;
}

.post__banner-inner {
  position: relative;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px; /* 拉开排版间距 */
  color: #fff;
  padding-top: 30px;
}

.post__back {
  position: absolute;
  top: 12px;
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
  z-index: 7;
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
  font-size: clamp(1.8rem, 5vw, 3.2rem); /* 标题字号适度放大 */
  font-weight: 800;
  line-height: 1.3;
  color: #fff;
  max-width: 880px;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.6); /* 增强文字阴影，抵抗复杂背景 */
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

.post__author-avatar--img {
  object-fit: cover;
  padding: 0;
  background: var(--color-surface);
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

.post__summary-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
}

.post__summary p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* ── AI 摘要标记 ── */
.post__summary-ai {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  font-style: normal;
  color: var(--color-accent, #6366f1);
  background: color-mix(in srgb, var(--color-accent, #6366f1) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent, #6366f1) 22%, transparent);
  width: fit-content;
}

.post__summary-ai svg {
  opacity: 0.85;
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

/* ── 评论区（阶段 5） ── */
.comments {
  margin-top: 48px;
  padding-top: 40px;
  border-top: 1px solid var(--color-border);
}

.comments__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-heading);
  letter-spacing: -0.02em;
  margin-bottom: 28px;
}

.comments__count {
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-full);
}

.comments__list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-bottom: 36px;
}

.comments__list--reply {
  margin: 16px 0 0 0;
  padding-left: 18px;
  border-left: 2px solid var(--color-border);
  gap: 14px;
}

.comment {
  display: flex;
  gap: 14px;
}

.comment__avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 50%;
}

.comment__avatar--sm {
  width: 34px;
  height: 34px;
  font-size: 14px;
}

.comment__body {
  flex: 1;
  min-width: 0;
}

.comment__meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}

.comment__nick {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
}

.comment__date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.comment__content {
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--color-text-secondary);
  word-break: break-word;
}

.comment__reply {
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.comment__reply:hover {
  opacity: 0.7;
}

.comments__empty {
  margin-bottom: 32px;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

/* 评论表单 */
.comment-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px;
}

.comment-form__reply {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.comment-form__cancel {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
}

.comment-form__cancel:hover {
  color: var(--color-primary);
}

.comment-form__row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-form__input {
  flex: 1;
  min-width: 0;
  padding: 11px 14px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--transition-fast);
}

.comment-form__input:focus {
  border-color: var(--color-primary);
}

.comment-form__textarea {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.comment-form__textarea:focus {
  border-color: var(--color-primary);
}

.comment-form__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 12px;
}

.comment-form__notice {
  margin-right: auto;
  font-size: 13px;
  color: var(--color-primary);
}

.comment-form__submit {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.comment-form__submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.comment-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* 文章页 banner 内联占位（loading/404），不依赖接口，进页即显示波浪 */
.post__loading-inline,
.post__missing-inline {
  color: rgba(255, 255, 255, 0.75);
  font-size: 15px;
  font-weight: 500;
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
    min-height: 240px;
    max-height: 320px;
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
