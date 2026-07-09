<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { getPosts } from '@/api/post'
import { useSeo } from '@/composables/useSeo'
import { useParticles } from '@/composables/useParticles'
import PostCard from '@/components/PostCard.vue'

useSeo() // 首页默认 SEO

/* ── 滚动视差（图片层随滚动缓慢上移） + 鼠标视差（内容层） ── */
const heroRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLElement | null>(null)
const particleCanvas = ref<HTMLCanvasElement | null>(null)
let scrollRaf = 0
let mouseRaf = 0
let ticking = false

function onScroll() {
  if (!imgRef.value || ticking) return
  ticking = true
  cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(() => {
    if (!imgRef.value) return
    const y = window.scrollY
    // 图片层缓慢上移（视差比 ~0.4）
    imgRef.value.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(1.08)`
    ticking = false
  })
}

function onHeroMove(e: MouseEvent) {
  if (!heroRef.value) return
  if (
    window.matchMedia('(hover: hover)').matches === false ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }
  const rect = heroRef.value.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width - 0.5
  const py = (e.clientY - rect.top) / rect.height - 0.5
  cancelAnimationFrame(mouseRaf)
  mouseRaf = requestAnimationFrame(() => {
    if (!heroRef.value) return
    heroRef.value.style.setProperty('--px', px.toFixed(3))
    heroRef.value.style.setProperty('--py', py.toFixed(3))
  })
}

function onHeroLeave() {
  if (!heroRef.value) return
  heroRef.value.style.setProperty('--px', '0')
  heroRef.value.style.setProperty('--py', '0')
}

onBeforeUnmount(() => {
  cancelAnimationFrame(scrollRaf)
  cancelAnimationFrame(mouseRaf)
  window.removeEventListener('scroll', onScroll)
})

/* ── 文章数据 ── */
const posts = ref<Post[]>([])

onMounted(async () => {
  try {
    posts.value = (await getPosts()).list
  } catch (e) {
    console.error('获取文章失败:', e)
  }
  // 使用 passive scroll（绕过 vue-tsc 的 EventListenerOptions 类型限制）
  const opts = { passive: true } as { passive: boolean }
  window.addEventListener('scroll', onScroll, opts)

  // 初始化粒子系统
  useParticles(particleCanvas, {
    count: 45,
    maxRadius: 2.8,
    color: '255, 245, 220',
  })
})

const sortedPosts = computed(() =>
  [...posts.value].sort((a, b) => b.date.localeCompare(a.date)),
)

const featuredPost = computed(() => sortedPosts.value[0])
const restPosts = computed(() => sortedPosts.value.slice(1, 3))

/* ── 打字机效果 ── */
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
</script>

<template>
  <div class="home">
    <!-- ═══════════ Hero 欢迎区（全屏背景图） ═══════════ -->
    <section
      class="hero"
      ref="heroRef"
      @mousemove="onHeroMove"
      @mouseleave="onHeroLeave"
    >
      <!-- 背景图层（Ken Burns 缩放 + 滚动视差） -->
      <div class="hero__bg" ref="imgRef">
        <img
          src="/images/hero-bg.png"
          alt=""
          class="hero__bg-img"
          draggable="false"
        />
        <!-- 多层渐变遮罩：保证文字可读 -->
        <div class="hero__overlay hero__overlay--top" />
        <div class="hero__overlay hero__overlay--bottom" />
        <div class="hero__overlay hero__overlay--center" />
      </div>

      <!-- 从图片中提取的光晕（替代原来的纯色 orb） -->
      <div class="hero__glow hero__glow--moon" aria-hidden="true" />
      <div class="hero__glow hero__glow--flower" aria-hidden="true" />

      <!-- 浮动粒子容器 -->
      <canvas ref="particleCanvas" class="hero__particles" aria-hidden="true" />

      <!-- 网格点阵（极淡） -->
      <div class="hero__grid" aria-hidden="true" />

      <div class="hero__inner">
        <span class="hero__badge" v-reveal>
          欢迎来到我的数字花园
        </span>

        <h1 class="hero-title" :class="{ 'typing-done': typingDone }" v-reveal="120">
          <span class="hero-title__text" v-html="typedHtml" />
          <span
            class="hero-title__cursor"
            :class="{ 'hero-title__cursor--blink': typingDone }"
          />
        </h1>

        <p class="hero-subtitle" v-reveal="240">
          Vue 3 · TypeScript · 踩坑记录 · 不搞高深理论
        </p>

        <div class="hero__actions" v-reveal="360">
          <RouterLink to="/articles" class="hero__btn hero__btn--primary btn-ripple">
            浏览文章
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
          <RouterLink to="/about" class="hero__btn hero__btn--ghost btn-ripple">
            关于我
          </RouterLink>
        </div>
      </div>

      <!-- 滚动提示箭头 -->
      <a href="#posts" class="hero__scroll-hint" aria-label="向下滚动查看文章">
        <span class="hero__scroll-mouse">
          <span class="hero__scroll-dot" />
        </span>
        <span class="hero__scroll-text">向下滚动</span>
      </a>
    </section>

    <!-- ═══════════ 分隔装饰线 ═══════════ -->
    <div class="divider" aria-hidden="true">
      <div class="divider__line" />
      <svg class="divider__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <div class="divider__line" />
    </div>

    <!-- ═══════════ 最新文章 ═══════════ -->
    <section id="posts" class="posts-section">
      <div class="container">
        <div class="posts__head" v-reveal>
          <div class="posts__head-left">
            <h2 class="posts__title">最新文章</h2>
          </div>
          <RouterLink to="/articles" class="posts__more link-draw">
            查看全部
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
        </div>

        <div v-if="featuredPost" v-reveal>
          <PostCard
            :key="featuredPost.id"
            :post="featuredPost"
            featured
          />
        </div>

        <div class="posts__grid">
          <div
            v-for="(post, index) in restPosts"
            :key="post.id"
            class="posts__cell"
            v-reveal="index * 100"
          >
            <PostCard :post="post" />
          </div>
        </div>

        <div class="posts__cta" v-reveal>
          <RouterLink to="/articles" class="btn btn-ghost btn-ripple">
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
   Hero 区 —— 全屏背景图 + 视差 + Ken Burns
   ============================================================ */
.hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 鼠标视差位移变量 */
  --px: 0;
  --py: 0;
  /* 基础深色兜底（图片加载前 / 加载失败时显示） */
  background: linear-gradient(135deg, #0c1424 0%, #142039 50%, #1e2d4a 100%);
}

/* ── 背景图层 ── */
.hero__bg {
  position: absolute;
  inset: -60px; /* 超出边界防止边缘露白 */
  z-index: 0;
  transform: translate3d(0, 0, 0) scale(1.08); /* Ken Burns 初始态 */
  will-change: transform;
}

.hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%; /* 月亮在上方偏中 */
  /* 入场动画：从稍大尺寸缓慢缩小到 1.08x */
  animation: ken-burns-in 8s var(--ease-out) forwards;
}

@keyframes ken-burns-in {
  from {
    transform: scale(1.18);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── 多层遮罩 ── */
.hero__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 顶部深色渐变（导航栏区域） */
.hero__overlay--top {
  background: linear-gradient(
    to bottom,
    rgba(6, 10, 20, 0.85) 0%,
    rgba(6, 10, 20, 0.45) 40%,
    transparent 70%
  );
}

/* 底部深色渐变（文字区下方过渡到内容区） */
.hero__overlay--bottom {
  background: linear-gradient(
    to top,
    var(--color-bg) 0%,
    rgba(250, 251, 252, 0.5) 20%,
    transparent 50%
  );
}

/* 中央径向渐变（让中心文字区域更清晰） */
.hero__overlay--center {
  background: radial-gradient(
    ellipse at center,
    rgba(6, 10, 20, 0.15) 0%,
    rgba(6, 10, 20, 0.45) 60%,
    transparent 80%
  );
}

/* ── 从图片提取的光晕（月光暖色 + 花瓣冷色） ── */
.hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.28;
  pointer-events: none;
  z-index: 1;
}

/* 月亮位置的暖光 */
.hero__glow--moon {
  width: 500px;
  height: 500px;
  top: 8%;
  right: 15%;
  background: radial-gradient(circle, rgba(255, 245, 220, 0.5) 0%, transparent 70%);
  animation: glow-pulse 8s ease-in-out infinite;
}

/* 花丛位置的冷光 */
.hero__glow--flower {
  width: 420px;
  height: 420px;
  bottom: 10%;
  left: -5%;
  background: radial-gradient(circle, rgba(180, 200, 240, 0.35) 0%, transparent 70%);
  animation: glow-pulse 11s ease-in-out infinite reverse;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.22; transform: scale(1); }
  50% { opacity: 0.38; transform: scale(1.08); }
}

/* ── 粒子画布 ── */
.hero__particles {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.65;
}

/* ── 极淡网格点阵 ── */
.hero__grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  pointer-events: none;
  /* 反向轻微移动，强化层次 */
  transform: translate3d(calc(var(--px) * -28px), calc(var(--py) * -18px), 0);
  transition: transform 0.5s var(--ease-out);
}

/* ── Hero 内容（鼠标视差） ── */
.hero__inner {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 0 24px;
  max-width: 880px;
  transform: translate3d(calc(var(--px) * 16px), calc(var(--py) * 12px), 0);
  transition: transform 0.4s var(--ease-out);
}

/* ── 徽章 ── */
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-full);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  margin-bottom: 28px;
  letter-spacing: 0.02em;
}

/* ── 标题 ── */
.hero-title {
  font-size: clamp(2.2rem, 6.5vw, 4rem);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
  min-height: 2.4em;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 32px rgba(0, 0, 0, 0.3);
}

.hero-title__text {
  background: linear-gradient(
    135deg,
    #fff 0%,
    rgba(220, 230, 255, 0.95) 50%,
    #fff 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  /* 打字完成后微光流动 */
}

.typing-done .hero-title__text {
  animation: shimmer 4s ease-in-out infinite;
  background-size: 200% 100%;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.hero-title__cursor {
  display: inline-block;
  width: 3px;
  height: 0.85em;
  background: linear-gradient(180deg, #93c5fd, #60a5fa);
  vertical-align: baseline;
  margin-left: 4px;
  border-radius: 1px;
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.7);
}

.hero-title__cursor--blink {
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ── 副标题 ── */
.hero-subtitle {
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.25);
}

/* ── 按钮 ── */
.hero__actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.hero__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 30px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  transition:
    background-color 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    transform 0.3s var(--ease),
    border-color 0.3s var(--ease),
    color 0.3s var(--ease);
}

.hero__btn--primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
}

.hero__btn--primary:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.55), inset 0 1px 0 rgba(255,255,255,0.1);
  color: #fff;
  transform: translateY(-3px);
}

.hero__btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.hero__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.42);
  color: #fff;
  transform: translateY(-3px);
}

/* ── 滚动提示 ── */
.hero__scroll-hint {
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  transition: color 0.3s var(--ease);
}

.hero__scroll-hint:hover {
  color: rgba(255, 255, 255, 0.75);
}

.hero__scroll-mouse {
  width: 22px;
  height: 34px;
  border: 2px solid currentColor;
  border-radius: 11px;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.hero__scroll-dot {
  width: 3px;
  height: 6px;
  border-radius: 2px;
  background: currentColor;
  animation: scroll-bounce 1.8s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.3; }
}

.hero__scroll-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* ============================================================
   分隔装饰线
   ============================================================ */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 0 var(--container-padding, 48px);
}

.divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--color-border) 20%,
    var(--color-border) 80%,
    transparent
  );
}

.divider__icon {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  animation: divider-float 3s ease-in-out infinite;
}

@keyframes divider-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
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

.posts__title {
  font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* 下划线绘制动画 */
.link-draw {
  position: relative;
}

.link-draw::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.link-draw:hover::after {
  transform: scaleX(1);
  transform-origin: left;
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

  .hero__glow {
    opacity: 0.18;
  }

  .hero__scroll-hint {
    bottom: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__bg-img {
    animation: none;
  }

  .hero__glow,
  .hero-title__cursor--blink,
  .hero__scroll-dot {
    animation: none;
  }

  .typing-done .hero-title__text {
    animation: none;
  }

  .hero__inner,
  .hero__grid {
    transform: none;
    transition: none;
  }

  .hero__bg {
    transform: none !important;
  }
}
</style>
