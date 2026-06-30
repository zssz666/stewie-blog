<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { posts } from '@/data/posts'
import PostCard from '@/components/PostCard.vue'

const sortedPosts = computed(() =>
  [...posts].sort((a, b) => b.date.localeCompare(a.date)),
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
    setTimeout(type, 80)
  }
  setTimeout(type, 400)
})

function scrollToPosts() {
  document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="home">
    <!-- 全屏暗色 Hero -->
    <section class="hero">
      <!-- 浮动光斑 -->
      <div class="hero__orb hero__orb--1" />
      <div class="hero__orb hero__orb--2" />
      <div class="hero__orb hero__orb--3" />

      <div class="hero__inner">
        <h1 class="hero-title">
          <span class="hero-title__text" v-html="typedHtml" />
          <span class="hero-title__cursor" :class="{ 'hero-title__cursor--blink': typingDone }" />
        </h1>
        <p class="hero-subtitle">
          Vue 3 · TypeScript · 踩坑记录 · 不搞高深理论
        </p>
        <div class="hero__actions">
          <RouterLink to="/articles" class="hero__btn">浏览文章</RouterLink>
          <RouterLink to="/about" class="hero__btn hero__btn--ghost">关于我</RouterLink>
        </div>
      </div>

      <!-- 底部弹跳箭头 -->
      <button class="hero__arrow" type="button" aria-label="向下滚动" @click="scrollToPosts">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </button>
    </section>

    <!-- 最新文章 -->
    <section id="posts" class="posts-section">
      <div class="container">
        <div class="posts__head">
          <h2 class="posts__title">最新文章</h2>
          <RouterLink to="/articles" class="posts__more">查看全部 →</RouterLink>
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
          <RouterLink to="/articles" class="btn btn-ghost">浏览全部文章</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── 全屏暗色 Hero ── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, var(--hero-dark-1) 0%, var(--hero-dark-2) 50%, var(--hero-dark-3) 100%);
}

/* 浮动光斑 */
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
}

.hero__orb--1 {
  width: 400px;
  height: 400px;
  top: -10%;
  left: -5%;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  animation: orb-float-1 12s ease-in-out infinite;
}

.hero__orb--2 {
  width: 350px;
  height: 350px;
  bottom: -5%;
  right: -5%;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation: orb-float-2 15s ease-in-out infinite;
}

.hero__orb--3 {
  width: 300px;
  height: 300px;
  top: 40%;
  left: 50%;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  animation: orb-float-3 18s ease-in-out infinite;
}

@keyframes orb-float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, 40px) scale(1.1); }
  66% { transform: translate(-30px, 60px) scale(0.95); }
}

@keyframes orb-float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-50px, -40px) scale(1.15); }
  66% { transform: translate(40px, -20px) scale(0.9); }
}

@keyframes orb-float-3 {
  0%, 100% { transform: translate(-50%, 0) scale(1); }
  50% { transform: translate(-50%, -50px) scale(1.2); }
}

.hero__inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 24px;
}

.hero-title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
  min-height: 2.5em;
  letter-spacing: -0.02em;
}

.hero-title__cursor {
  display: inline-block;
  width: 3px;
  height: 0.85em;
  background: #60a5fa;
  vertical-align: baseline;
  margin-left: 3px;
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
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
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  font-weight: 500;
  letter-spacing: 0.02em;
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
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  background: var(--color-primary);
  color: #fff;
  transition:
    background-color var(--transition),
    box-shadow var(--transition),
    transform var(--transition);
}

.hero__btn:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 0 24px rgba(59, 130, 246, 0.5);
  color: #fff;
  transform: translateY(-2px);
}

.hero__btn--ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.hero__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: none;
  color: #fff;
}

/* 底部弹跳箭头 */
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
  transition: color var(--transition-fast);
  animation: arrow-bounce 2s ease-in-out infinite;
}

.hero__arrow:hover {
  color: #fff;
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

/* ── 最新文章区 ── */
.posts-section {
  padding-top: var(--section-gap);
  padding-bottom: var(--section-gap);
  background: var(--color-bg);
}

.posts__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.posts__title {
  font-size: clamp(1.4rem, 3.5vw, 1.8rem);
  font-weight: 700;
}

.posts__more {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

.posts__more:hover {
  color: var(--color-primary-hover);
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
  margin-top: 40px;
}

@media (max-width: 640px) {
  .posts__grid {
    grid-template-columns: 1fr;
  }

  .hero__orb {
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__orb {
    animation: none;
  }

  .hero__arrow {
    animation: none;
  }

  .hero-title__cursor--blink {
    animation: none;
  }
}
</style>
