<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { getPosts } from '@/api/post'
import { useSeo } from '@/composables/useSeo'
import PostCard from '@/components/PostCard.vue'

useSeo() // 首页默认 SEO

const posts = ref<Post[]>([])

onMounted(async () => {
  try {
    posts.value = await getPosts()
  } catch (e) {
    console.error('获取文章失败:', e)
  }
})

const sortedPosts = computed(() =>
  [...posts.value].sort((a, b) => b.date.localeCompare(a.date)),
)

const featuredPost = computed(() => sortedPosts.value[0])
const restPosts = computed(() => sortedPosts.value.slice(1, 3))

const titleText = '写代码踩过的坑,\n都记在这里了'
const typedHtml = ref('')
const typingDone = ref(false)

onMounted(() => {
  let i = 0
  const type = () => {
    if (i >= titleText.length) {
      typingDone.value = true
      return
    }
    typedHtml.value = titleText.slice(0, i + 1).replace(/,/g, '，').replace(/\n/g, '<br>')
    i++
    setTimeout(type, 75)
  }
  setTimeout(type, 500)
})

function scrollToPosts() {
  document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="home">
    <!-- ── Hero 欢迎区 ── -->
    <section class="hero">
      <!-- 网格点阵装饰 -->
      <div class="hero__grid" aria-hidden="true" />
      <!-- 浮动光斑 -->
      <div class="hero__orb hero__orb--1" aria-hidden="true" />
      <div class="hero__orb hero__orb--2" aria-hidden="true" />
      <div class="hero__orb hero__orb--3" aria-hidden="true" />

      <div class="hero__inner">
        <span class="hero__badge">
          <span class="hero__badge-dot" />
          欢迎来到我的数字花园
        </span>

        <h1 class="hero-title">
          <span class="hero-title__text" v-html="typedHtml" />
          <span
            class="hero-title__cursor"
            :class="{ 'hero-title__cursor--blink': typingDone }"
          />
        </h1>

        <p class="hero-subtitle">
          Vue 3 · TypeScript · 踩坑记录 · 不搞高深理论
        </p>

        <div class="hero__actions">
          <RouterLink to="/articles" class="hero__btn hero__btn--primary">
            浏览文章
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
          <RouterLink to="/about" class="hero__btn hero__btn--ghost">
            关于我
          </RouterLink>
        </div>

        <!-- 统计数据 -->
        <div class="hero__stats">
          <div class="hero__stat">
            <span class="hero__stat-num">{{ posts.length }}+</span>
            <span class="hero__stat-label">原创文章</span>
          </div>
          <div class="hero__stat-divider" />
          <div class="hero__stat">
            <span class="hero__stat-num">5</span>
            <span class="hero__stat-label">技术分类</span>
          </div>
          <div class="hero__stat-divider" />
          <div class="hero__stat">
            <span class="hero__stat-num">持续</span>
            <span class="hero__stat-label">更新中</span>
          </div>
        </div>
      </div>

      <!-- 底部弹跳箭头 -->
      <button class="hero__arrow" type="button" aria-label="向下滚动" @click="scrollToPosts">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </button>
    </section>

    <!-- ── 最新文章 ── -->
    <section id="posts" class="posts-section">
      <div class="container">
        <div class="posts__head">
          <div class="posts__head-left">
            <span class="posts__eyebrow">LATEST</span>
            <h2 class="posts__title">最新文章</h2>
          </div>
          <RouterLink to="/articles" class="posts__more">
            查看全部
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
        </div>

        <PostCard
          v-if="featuredPost"
          :key="featuredPost.id"
          :post="featuredPost"
          featured
        />

        <div class="posts__grid">
          <PostCard
            v-for="post in restPosts"
            :key="post.id"
            :post="post"
          />
        </div>

        <div class="posts__cta">
          <RouterLink to="/articles" class="btn btn-ghost">
            浏览全部文章
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   Hero 区
   ============================================================ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at top, var(--hero-dark-3) 0%, transparent 50%),
    linear-gradient(135deg, var(--hero-dark-1) 0%, var(--hero-dark-2) 50%, var(--hero-dark-3) 100%);
}

/* 网格点阵 */
.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(96, 165, 250, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 165, 250, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  pointer-events: none;
}

/* 浮动光斑 */
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.45;
  pointer-events: none;
}

.hero__orb--1 {
  width: 460px;
  height: 460px;
  top: -12%;
  left: -8%;
  background: radial-gradient(circle, var(--hero-accent), transparent 70%);
  animation: orb-float-1 14s ease-in-out infinite;
}

.hero__orb--2 {
  width: 380px;
  height: 380px;
  bottom: -8%;
  right: -6%;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation: orb-float-2 17s ease-in-out infinite;
}

.hero__orb--3 {
  width: 320px;
  height: 320px;
  top: 35%;
  left: 48%;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  animation: orb-float-3 20s ease-in-out infinite;
}

@keyframes orb-float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(70px, 50px) scale(1.1); }
  66% { transform: translate(-40px, 70px) scale(0.95); }
}

@keyframes orb-float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-60px, -50px) scale(1.15); }
  66% { transform: translate(50px, -25px) scale(0.9); }
}

@keyframes orb-float-3 {
  0%, 100% { transform: translate(-50%, 0) scale(1); }
  50% { transform: translate(-50%, -60px) scale(1.2); }
}

/* Hero 内容 */
.hero__inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 24px;
  max-width: 880px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-full);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: 28px;
}

.hero__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hero-title {
  font-size: clamp(2.2rem, 6.5vw, 4rem);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
  min-height: 2.4em;
  letter-spacing: -0.03em;
}

.hero-title__cursor {
  display: inline-block;
  width: 3px;
  height: 0.85em;
  background: var(--hero-accent);
  vertical-align: baseline;
  margin-left: 4px;
  border-radius: 1px;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.7);
}

.hero-title__cursor--blink {
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hero-subtitle {
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.65);
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.hero__actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition:
    background-color var(--transition),
    box-shadow var(--transition),
    transform var(--transition),
    border-color var(--transition),
    color var(--transition);
}

.hero__btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
}

.hero__btn--primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.5);
  color: #fff;
  transform: translateY(-2px);
}

.hero__btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.hero__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
  transform: translateY(-2px);
}

/* 统计数据 */
.hero__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero__stat-num {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.hero__stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.hero__stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* 底部箭头 */
.hero__arrow {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast);
  animation: arrow-bounce 2.2s ease-in-out infinite;
}

.hero__arrow:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

/* ============================================================
   最新文章区
   ============================================================ */
.posts-section {
  padding-top: var(--section-gap);
  padding-bottom: var(--section-gap);
  background: var(--color-bg);
  position: relative;
}

.posts__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

.posts__head-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.posts__eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.15em;
}

.posts__title {
  font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.posts__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.posts__more:hover {
  color: var(--color-primary-hover);
  background: var(--color-primary-soft);
}

.posts__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.posts__cta {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .posts__grid {
    grid-template-columns: 1fr;
  }

  .hero__orb {
    opacity: 0.3;
  }

  .hero__stats {
    gap: 18px;
  }

  .hero__stat-num {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__orb,
  .hero__arrow,
  .hero-title__cursor--blink,
  .hero__badge-dot {
    animation: none;
  }
}
</style>
