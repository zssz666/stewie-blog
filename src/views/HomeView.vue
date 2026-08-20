<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { getPosts } from '@/api/post'
import { useSeo } from '@/composables/useSeo'
import { useMagnetic } from '@/composables/useMagnetic'
import PostCard from '@/components/PostCard.vue'
import Oscilloscope from '@/components/Oscilloscope.vue'
import LabStatusCard from '@/components/LabStatusCard.vue'
import FlowComic from '@/components/FlowComic.vue'
import Arsenal from '@/components/Arsenal.vue'
import EmotionBall from '@/components/EmotionBall.vue'

useSeo() // 首页默认 SEO

/* ── 首屏入场动画控制：仅首次访问播放，之后同会话不再重播 ── */
const introPlayed = ref(false)
if (typeof window !== 'undefined') {
  if (window.sessionStorage.getItem('home_intro_played')) {
    introPlayed.value = true
  } else {
    // 首次访问：打标记，后续同会话内访问不再重播入场动画
    window.sessionStorage.setItem('home_intro_played', '1')
  }
}

/* ── 文章数据 ── */
const posts = ref<Post[]>([])
/* 后台文章总数（贴纸展示用，非当前列表长度） */
const postsTotal = ref(0)

onMounted(async () => {
  try {
    // 取足量条数，保证首页登记簿能展示全部文章（后端默认分页会截断）
    const page = await getPosts({ size: 5 })
    posts.value = page.list
    // 后台总条数；若后端未返回 total 则退回列表长度兑底
    postsTotal.value = page.total || page.list.length
  } catch (e) {
    console.error('获取文章失败:', e)
  }
})

const sortedPosts = computed(() => {
  // 防御：部署环境若后端版本不一致导致 posts.value 非数组，避免白屏崩溃
  const list = posts.value ?? []
  return list.slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
})

/* ── 图纸标题（逐字"勾勒 → 上墨"） ── */
const titleLine1 = '把踩过的坑，'
const titleLine2 = '写成实验报告。'

/* ── 图纸日期（标题栏用） ── */
const sheetDate = new Date()
  .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .replace(/\//g, '-')

/* ── 按钮磁吸（桌面 hover 设备） ── */
const magPrimary = useMagnetic(8)
const magGhost = useMagnetic(6)
const primaryStyle = computed(() => ({
  transform: `translate(${magPrimary.x.value}px, ${magPrimary.y.value}px)`,
}))
const ghostStyle = computed(() => ({
  transform: `translate(${magGhost.x.value}px, ${magGhost.y.value}px)`,
}))

/* ── 吉祥物：点击随机换表情 + 形状（情绪池 + 形状池） ── */
const RANDOM_EMOTIONS = ['02', '03', '10', '11', '13', '14', '16', '19', '30', '32', '33', '35', '37', '40'] as const
const RANDOM_SHAPES = ['blob', 'wedge', 'gem'] as const
const heroBallRef = ref<InstanceType<typeof EmotionBall> | null>(null)
/* 响应式表情/形状：初始 undefined → 组件内随机；点击后由父级驱动（:emotion/:shape 联动重建） */
const heroEmotion = ref<string | undefined>(undefined)
const heroShape = ref<'blob' | 'wedge' | 'gem' | undefined>(undefined)
function randomizeBall() {
  heroEmotion.value = RANDOM_EMOTIONS[(Math.random() * RANDOM_EMOTIONS.length) | 0]!
  heroShape.value = RANDOM_SHAPES[(Math.random() * RANDOM_SHAPES.length) | 0]!
  if (Math.random() < 0.35) heroBallRef.value?.spin(1)
}

/* ── 尾声 CTA 小球：点击随机换表情 + 低概率撒花 ── */
const ctaBallRef = ref<InstanceType<typeof EmotionBall> | null>(null)
function randomizeCtaBall() {
  ctaBallRef.value?.setEmotion(RANDOM_EMOTIONS[(Math.random() * RANDOM_EMOTIONS.length) | 0]!)
  if (Math.random() < 0.3) ctaBallRef.value?.burst(10)
}

/* ── 实验室日常弹幕（前端梗） ── */
const banter = [
  '没有 bug，只有未被记录的实验',
  'git push --force 之前，记得先备份',
  'CSS 垂直居中：一门玄学',
  'TypeError: undefined is not a 灵感',
  'console.log 是最忠实的示波器',
  '命名难过程度：命名 > 写代码',
  'npm install 后的世界，无人知晓',
  '能跑就行？不，我想知道它为什么能跑',
  '正则表达式：写时一时爽，读时泪两行',
  '今晚一定早睡 —— 23:59',
]
</script>

<template>
  <div class="home" :class="introPlayed ? 'home--static' : 'home--intro'">
    <!-- ═══════════ Hero · 制图桌上的一张实验图纸 ═══════════ -->
    <section class="hero grid-paper">
      <!-- 图框：双线制图边框 + 四角对位十字标 -->
      <div class="hero__frame" aria-hidden="true">
        <span class="hero__mark hero__mark--tl" />
        <span class="hero__mark hero__mark--tr" />
        <span class="hero__mark hero__mark--bl" />
        <span class="hero__mark hero__mark--br" />
      </div>

      <div class="hero__inner">
        <p class="hero__eyebrow" v-reveal="60">
          <span class="hero__eyebrow-dot" aria-hidden="true" />
          EXP-000 · 实验开始
        </p>

        <h1 class="hero-title" v-reveal="160">
          <span class="hero-title__line">
            <span
              v-for="(ch, i) in titleLine1"
              :key="`l1-${i}`"
              class="hero-title__ch"
              :style="{ '--ch-i': i }"
            >{{ ch }}</span>
          </span>
          <span class="hero-title__line">
            <span
              v-for="(ch, i) in titleLine2"
              :key="`l2-${i}`"
              class="hero-title__ch"
              :style="{ '--ch-i': i + titleLine1.length }"
            >{{ ch }}</span>
          </span>
        </h1>

        <p class="hero__flow" v-reveal="380">
          <span class="hero__flow-step">假设</span>
          <span class="hero__flow-arrow" aria-hidden="true">→</span>
          <span class="hero__flow-step">复现</span>
          <span class="hero__flow-arrow" aria-hidden="true">→</span>
          <span class="hero__flow-step hero__flow-step--hot">修复</span>
          <span class="hero__flow-arrow" aria-hidden="true">→</span>
          <span class="hero__flow-step">沉淀</span>
        </p>

        <p class="hero__meta" v-reveal="460">Vue 3 · TypeScript · Spring Boot · Node.js</p>

        <div class="hero__actions" v-reveal="560">
          <RouterLink
            to="/articles"
            class="hero__btn hero__btn--primary"
            :style="primaryStyle"
            @mousemove="magPrimary.onMouseMove"
            @mouseleave="magPrimary.onMouseLeave"
          >
            翻看登记簿
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
          <RouterLink
            to="/about"
            class="hero__btn hero__btn--ghost"
            :style="ghostStyle"
            @mousemove="magGhost.onMouseMove"
            @mouseleave="magGhost.onMouseLeave"
          >
            关于 Stewie
          </RouterLink>
        </div>
      </div>

      <!-- 便签贴纸：登记条数是真实数据 -->
      <div class="hero__sticker" v-reveal="760" aria-hidden="true">
        <span class="hero__sticker-tape" />
        登记在册实验
        <strong>{{ postsTotal }}</strong>
        条 · 均已归档
      </div>

      <!-- 星尘点缀 -->
      <span class="spark spark--1" aria-hidden="true" />
      <span class="spark spark--2" aria-hidden="true" />
      <span class="spark spark--3" aria-hidden="true" />
      <span class="spark spark--4" aria-hidden="true" />

      <!-- 示波器装置（桌面端） -->
      <div class="hero__osc" v-reveal="880">
        <Oscilloscope label="OSC-1" />
      </div>

      <!-- 吉祥物贴纸：点击随机换表情 + 形状（站在示波器上方） -->
      <div class="hero__mascot hero__mascot--over-osc" v-reveal="920">
        <button
          type="button"
          class="hero__mascot-btn"
          aria-label="点击随机切换表情小球的表情与形状"
          @click="randomizeBall"
        >
          <EmotionBall
            ref="heroBallRef"
            tone="hazard"
            :size="116"
            :emotion="heroEmotion"
            :shape="heroShape"
            gaze
            label="实验室吉祥物：表情小球（安全橙）"
          />
          <!-- 对话气泡：直接附着在按钮上，尾巴自然对准球心 -->
          <span class="hero__bubble">点我换表情</span>
        </button>
      </div>

      <!-- 图纸标题栏 -->
      <div class="hero__titleblock" v-reveal="1000" aria-hidden="true">
        <div class="hero__tb-cell">
          <span class="hero__tb-label">图号</span>
          <span class="hero__tb-value">STL-001</span>
        </div>
        <div class="hero__tb-cell">
          <span class="hero__tb-label">制图</span>
          <span class="hero__tb-value">STEWIE</span>
        </div>
        <div class="hero__tb-cell">
          <span class="hero__tb-label">比例</span>
          <span class="hero__tb-value">1:1</span>
        </div>
        <div class="hero__tb-cell">
          <span class="hero__tb-label">日期</span>
          <span class="hero__tb-value">{{ sheetDate }}</span>
        </div>
      </div>

      <!-- 滚动提示：卷动图纸 -->
      <a href="#posts" class="hero__scroll-hint" aria-label="向下滚动查看实验登记簿">
        <span class="hero__scroll-text">SCROLL · 卷动图纸</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </a>
    </section>
    <div class="divider" aria-hidden="true">
      <div class="divider__line" />
      <svg class="divider__wave" width="72" height="18" viewBox="0 0 72 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M2 9 h8 l4 -6 l6 12 l6 -12 l6 12 l4 -6 h34" />
      </svg>
      <div class="divider__line" />
    </div>

    <!-- ═══════════ 实验登记簿（最新文章） ═══════════ -->
    <section id="posts" class="posts-section">
      <div class="container">
        <div class="posts__head" v-reveal>
          <div class="posts__head-left">
            <p class="posts__eyebrow">EXPERIMENT LOG</p>
            <h2 class="posts__title">实验登记簿</h2>
          </div>
          <RouterLink to="/articles" class="posts__more link-draw">
            查看全部
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
        </div>

        <div class="posts__grid">
          <div
            v-for="(post, index) in sortedPosts"
            :key="post.id"
            class="posts__cell"
            v-reveal="240 + index * 100"
          >
            <PostCard :post="post" :featured="index === 0" :flip="index % 2 === 1" />
          </div>
        </div>

        <div class="posts__cta" v-reveal="640">
          <RouterLink to="/articles" class="btn btn-ghost">
            浏览全部实验
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══════════ 研究员档案（RPG 状态卡） ═══════════ -->
    <section class="section-block">
      <div class="container">
        <div class="block-head" v-reveal>
          <p class="block-eyebrow">LAB STATUS</p>
          <h2 class="block-title">研究员档案</h2>
          <p class="block-sub">EXP 由登记簿实时统计 —— 每写 10 篇实验，升一级。</p>
        </div>
        <div v-reveal="180">
          <LabStatusCard :exp-count="sortedPosts.length" />
        </div>
      </div>
    </section>

    <!-- ═══════════ 实验四格漫画（方法论） ═══════════ -->
    <section class="section-block">
      <div class="container">
        <div class="block-head" v-reveal>
          <p class="block-eyebrow">METHOD</p>
          <h2 class="block-title">实验四格</h2>
          <p class="block-sub">每一篇实验记录，都要经过这四道工序。</p>
        </div>
        <div v-reveal="180">
          <FlowComic />
        </div>
      </div>
    </section>

    <!-- ═══════════ 装备库（技术栈） ═══════════ -->
    <section class="section-block">
      <div class="container">
        <div class="block-head" v-reveal>
          <p class="block-eyebrow">ARSENAL</p>
          <h2 class="block-title">装备库</h2>
          <p class="block-sub">实验室常用装备一览，熟练度随实验持续提升。</p>
        </div>
        <div v-reveal="180">
          <Arsenal />
        </div>
      </div>
    </section>

    <!-- ═══════════ 实验室日常（弹幕跑马灯） ═══════════ -->
    <div class="marquee-band" aria-hidden="true">
      <div class="marquee">
        <span v-for="(line, i) in banter" :key="`b1-${i}`" class="marquee__item">
          {{ line }} <span class="marquee__sep">✦</span>
        </span>
        <span v-for="(line, i) in banter" :key="`b2-${i}`" class="marquee__item">
          {{ line }} <span class="marquee__sep">✦</span>
        </span>
      </div>
    </div>

    <!-- ═══════════ 尾声 CTA ═══════════ -->
    <section class="home-cta grid-paper">
      <span class="spark spark--5" aria-hidden="true" />
      <span class="spark spark--6" aria-hidden="true" />
      <div class="home-cta__mascot" v-reveal>
        <button type="button" class="home-cta__ball-btn" @click="randomizeCtaBall" aria-label="点击切换表情">
          <EmotionBall ref="ctaBallRef" tone="fix" :size="132" label="挥手邀请的表情小球（实验绿，点击换表情）" />
          <!-- 对话气泡：直接附着在按钮上，尾巴自然对准球心 -->
          <span class="home-cta__bubble">登记簿里还有更多实验哦！</span>
        </button>
      </div>
      <h2 class="home-cta__title" v-reveal="200">下一次实验，会有你的坑吗？</h2>
      <p class="home-cta__desc" v-reveal="280">
        每一条踩坑记录都登记在册 —— 欢迎随时翻阅、勘误、补充。
      </p>
      <div class="home-cta__actions" v-reveal="380">
        <RouterLink to="/articles" class="hero__btn hero__btn--primary">
          翻看全部实验
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </RouterLink>
        <RouterLink to="/about" class="hero__btn hero__btn--ghost">关于 Stewie</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   Hero —— 制图桌上的一张实验图纸
   坐标纸底 + 双线图框 + 对位十字标 + 手写标题 + 示波器
   ============================================================ */
.hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-top: var(--header-height);
}

/* ── 图框：双线制图边框 ── */
.hero__frame {
  position: absolute;
  inset: clamp(14px, 3vw, 30px);
  border: 1.5px solid color-mix(in srgb, var(--color-heading) 50%, transparent);
  pointer-events: none;
  z-index: 1;
}

.hero__frame::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px dashed color-mix(in srgb, var(--color-heading) 20%, transparent);
}

/* 首次访问：图框从中心向四方绘制（像在纸上先画出图框） */
.home--intro .hero__frame {
  animation: frame-draw 0.9s var(--ease-out) both;
}

@keyframes frame-draw {
  from {
    clip-path: inset(50% 50%);
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  to {
    clip-path: inset(0 0);
    opacity: 1;
  }
}

/* ── 四角对位十字标（制版 registration marks） ── */
.hero__mark {
  position: absolute;
  width: 15px;
  height: 15px;
}

.hero__mark::before,
.hero__mark::after {
  content: '';
  position: absolute;
  background: color-mix(in srgb, var(--color-heading) 60%, transparent);
}

.hero__mark::before {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
}

.hero__mark::after {
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-50%);
}

.hero__mark--tl {
  top: -24px;
  left: -24px;
}

.hero__mark--tr {
  top: -24px;
  right: -24px;
}

.hero__mark--bl {
  bottom: -24px;
  left: -24px;
}

.hero__mark--br {
  bottom: -24px;
  right: -24px;
}

/* ── 内容列 ── */
.hero__inner {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 clamp(24px, 6vw, 72px);
}

/* ── 眉标 ── */
.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-text-secondary);
  margin-bottom: 26px;
}

.hero__eyebrow-dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  /* 方形警示点：实验室语义 */
  border-radius: 2px;
  box-shadow: 0 0 10px var(--color-primary-soft);
}

/* 记录中的呼吸灯（仅首播动画阶段闪烁，之后稳定常亮） */
.home--intro .hero__eyebrow-dot {
  animation: rec-blink 1.4s steps(2, jump-none) infinite;
}

@keyframes rec-blink {
  0% { opacity: 1; }
  100% { opacity: 0.25; }
}

/* ── 手写大标题：楷体 + 逐字「勾勒 → 上墨」 ── */
.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.35rem, 6.2vw, 4.1rem);
  line-height: 1.28;
  letter-spacing: 0.02em;
  color: var(--color-heading);
}

.hero-title__line {
  display: block;
  white-space: nowrap;
}

.hero-title__ch {
  display: inline-block;
  /* 初始：只留轮廓（像铅笔勾勒的字形） */
  color: transparent;
  -webkit-text-stroke: 1.5px color-mix(in srgb, var(--color-heading) 72%, transparent);
}

/* 首播：逐字从轮廓填充为墨色（楷体 + 上墨 = 手写感） */
.home--intro .hero-title__ch {
  animation: ink-fill 0.5s ease-out forwards;
  animation-delay: calc(0.75s + var(--ch-i) * 60ms);
}

@keyframes ink-fill {
  to {
    color: var(--color-heading);
    -webkit-text-stroke-color: transparent;
  }
}

/* 重访：直接呈现墨字 */
.home--static .hero-title__ch {
  color: var(--color-heading);
  -webkit-text-stroke-color: transparent;
}

/* 标点「，」「。」用安全橙点亮（排版的警示语义） */
.hero-title__ch:is(:last-child) {
  color: var(--color-primary);
  -webkit-text-stroke-color: transparent;
}

/* ── 方法论流程：假设 → 复现 → 修复 → 沉淀 ── */
.hero__flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.06em;
}

.hero__flow-step {
  padding: 4px 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

/* 「修复」是每篇实验的落点：安全橙点亮 */
.hero__flow-step--hot {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  background: var(--color-primary-soft);
  font-weight: 600;
}

.hero__flow-arrow {
  color: var(--color-text-tertiary);
}

/* ── 技术栈元信息 ── */
.hero__meta {
  margin-top: 18px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

/* ── 按钮 ── */
.hero__actions {
  display: flex;
  gap: 14px;
  margin-top: 38px;
  flex-wrap: wrap;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  font-size: 14.5px;
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
  border-radius: var(--radius-sm);
  transition:
    background-color 0.25s var(--ease),
    color 0.25s var(--ease),
    border-color 0.25s var(--ease),
    box-shadow 0.25s var(--ease);
}

.hero__btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-primary);
}

.hero__btn--primary:hover {
  background: var(--color-primary-hover);
  color: #fff;
  box-shadow: var(--shadow-lg);
}

.hero__btn--primary:active {
  transform: translateY(1px);
}

.hero__btn--ghost {
  background: transparent;
  border: 1.5px solid var(--color-border-strong);
  color: var(--color-heading);
}

.hero__btn--ghost:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-softer);
}

.hero__btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

/* ── 便签贴纸：登记数（真实数据） ── */
.hero__sticker {
  position: absolute;
  z-index: 3;
  top: 22%;
  right: clamp(4%, 8vw, 10%);
  padding: 16px 18px 14px;
  font-family: var(--font-display);
  font-size: 14.5px;
  line-height: 1.7;
  color: #3d3421;
  background: #f6e58d;
  /* 便签微倾，像随手一贴 */
  transform: rotate(3.5deg);
  border-radius: 2px;
  box-shadow: 0 6px 18px rgba(29, 42, 50, 0.16);
  transition: transform 0.3s var(--ease-spring);
}

.hero__sticker:hover {
  transform: rotate(1deg) translateY(-3px);
}

.hero__sticker strong {
  display: inline-block;
  font-size: 22px;
  color: #c24511;
  padding: 0 2px;
  font-weight: 700;
}

/* 顶部一截胶带 */
.hero__sticker-tape {
  position: absolute;
  top: -9px;
  left: 50%;
  width: 58px;
  height: 17px;
  transform: translateX(-50%) rotate(-2deg);
  background: color-mix(in srgb, var(--color-heading) 16%, #fff);
  border-left: 1px dashed color-mix(in srgb, var(--color-heading) 20%, transparent);
  border-right: 1px dashed color-mix(in srgb, var(--color-heading) 20%, transparent);
  opacity: 0.75;
}

/* v-reveal 与贴纸持久 transform 调和：入场后保持微倾，不被 transform:none 洗掉 */
.hero__sticker.reveal--up {
  transform: translateY(28px) rotate(3.5deg);
}

.hero__sticker.reveal.is-visible {
  transform: rotate(3.5deg);
}

/* v-reveal 与贴纸持久 transform 调和：入场后保持微倾 */
.hero__sticker.reveal--up {
  transform: translateY(28px) rotate(3.5deg);
}

.hero__sticker.reveal.is-visible {
  transform: rotate(3.5deg);
}

/* 深色（晒图）模式下便签降饱和 */
html.dark .hero__sticker {
  background: #d9c66f;
  color: #332c1c;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

/* ── 示波器装置（桌面端右下） ── */
.hero__osc {
  position: absolute;
  z-index: 3;
  right: clamp(4%, 7vw, 9%);
  bottom: 16%;
  width: 300px;
}

/* ── 图纸标题栏（右下角贴框） ── */
.hero__titleblock {
  position: absolute;
  z-index: 2;
  right: clamp(14px, 3vw, 30px);
  bottom: clamp(14px, 3vw, 30px);
  display: grid;
  grid-template-columns: repeat(4, auto);
  border: 1.5px solid color-mix(in srgb, var(--color-heading) 50%, transparent);
  border-right: none;
  border-bottom: none;
  background: color-mix(in srgb, var(--color-bg) 78%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.hero__tb-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 14px;
  border-right: 1px solid color-mix(in srgb, var(--color-heading) 28%, transparent);
}

.hero__tb-cell:last-child {
  border-right: none;
}

.hero__tb-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--color-text-tertiary);
}

.hero__tb-value {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-heading);
}

/* ── 滚动提示 ── */
.hero__scroll-hint {
  position: absolute;
  bottom: 42px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  transition: color 0.3s var(--ease);
}

.hero__scroll-hint:hover {
  color: var(--color-primary);
}

.hero__scroll-hint:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

.hero__scroll-text {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
}

.hero__scroll-hint svg {
  animation: hint-drop 1.8s ease-in-out infinite;
}

@keyframes hint-drop {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(5px); opacity: 0.4; }
}

/* ============================================================
   波形分割线
   ============================================================ */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 0 48px;
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

.divider__wave {
  color: var(--color-primary);
  opacity: 0.8;
}

/* ============================================================
   实验登记簿（最新文章）
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
  gap: 8px;
}

.posts__eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--color-primary);
}

.posts__title {
  font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 800;
  letter-spacing: 0.01em;
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
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.posts__more:hover {
  color: var(--color-primary-hover);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.posts__more:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

.posts__grid {
  display: grid;
  grid-template-columns: 1fr; /* 单列登记簿：每篇实验占满一行 */
  gap: 28px;
  margin-top: 24px;
}

.posts__cta {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

/* ============================================================
   吉祥物贴纸 + 对话气泡（Hero 左下角，站在图框上）
   ============================================================ */
/* ── 吉祥物：站在示波器正上方 ── */
.hero__mascot {
  position: absolute;
  /* 左下角图框留白带：与右下示波器 / 标题栏各占一角，互不遮挡 */
  z-index: 4;
  left: clamp(3%, 7vw, 9%);
  bottom: clamp(96px, 12vh, 140px);
}

/* 桌面端：吉祥物站在示波器正上方（本规则在基础规则之后、响应式之前，
   级联顺序保证桌面覆盖基础值，中/小屏响应式覆盖回退位，无需 !important） */
.hero__mascot--over-osc {
  z-index: 5;
  left: auto;
  /* 球心对准示波器中心：示波器右缘 + 半宽 150px − 容器半宽约 64px */
  right: calc(clamp(4%, 7vw, 9%) + 86px);
  /* 示波器总高约 168px（屏 132 + 面板 36）：底部贴住示波器顶，浮动时轻触 */
  bottom: calc(16% + 158px);
}

.hero__mascot-btn {
  display: block;
  padding: 6px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  position: relative; /* 作为气泡的定位锚点 */
  /* idle 浮动（translate 独立属性，不与 hover transform 冲突） */
  animation: mascot-float 3.2s ease-in-out infinite;
  transition: transform 0.3s var(--ease-spring);
}

.hero__mascot-btn:hover {
  transform: scale(1.06) rotate(2deg);
}

.hero__mascot-btn:active {
  transform: scale(0.96);
}

.hero__mascot-btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

@keyframes mascot-float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}

/* 对话气泡：楷体手写批注感，直接附着在按钮上 */
.hero__bubble {
  position: absolute;
  top: -40%; /* 气泡在球的正上方 */
  left: 50%; /* 水平居中于按钮 */
  transform: translateX(-50%); /* 精确居中 */
  margin-bottom: 18px; /* 与球的间距 */
  padding: 9px 15px;
  max-width: 220px;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  color: var(--color-heading);
  background: var(--color-surface-raised);
  border: 1.5px solid var(--color-heading);
  border-radius: 12px;
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-heading) 16%, transparent);
}

/* 气泡小尾巴：从气泡底部中央伸出，指向下方球心 */
.hero__bubble::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--color-surface-raised);
  border-right: 1.5px solid var(--color-heading);
  border-bottom: 1.5px solid var(--color-heading);
  transform: translateX(-50%) rotate(45deg) skew(6deg, 6deg);
}

.bubble-pop-enter-active,
.bubble-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.25s var(--ease-spring);
}

.bubble-pop-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

.bubble-pop-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}

/* ============================================================
   星尘点缀（四角星，糖果色，交错闪烁）
   ============================================================ */
.spark {
  position: absolute;
  z-index: 2;
  width: 15px;
  height: 15px;
  background: var(--sticker-lemon);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: spark-twinkle 3.2s ease-in-out infinite;
  pointer-events: none;
}

.spark--1 { top: 17%; left: 5.5%; }
.spark--2 { top: 32%; right: 33%; width: 11px; height: 11px; background: var(--sticker-sky); animation-delay: 0.8s; }
.spark--3 { bottom: 32%; left: 43%; width: 10px; height: 10px; background: var(--sticker-pink); animation-delay: 1.7s; }
.spark--4 { top: 13%; right: 27%; width: 12px; height: 12px; background: var(--sticker-mint); animation-delay: 2.3s; }

@keyframes spark-twinkle {
  0%, 100% { opacity: 0.95; transform: rotate(0deg) scale(1); }
  50% { opacity: 0.25; transform: rotate(45deg) scale(0.72); }
}

/* ============================================================
   区块通用（研究员档案 / 实验四格 / 装备库）
   ============================================================ */
.section-block {
  padding-top: var(--section-gap);
  padding-bottom: calc(var(--section-gap) - 18px);
}

.block-head {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 34px;
}

.block-eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--color-primary);
}

.block-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.block-sub {
  font-size: 13.5px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

/* ============================================================
   实验室日常（弹幕跑马灯）
   ============================================================ */
.marquee-band {
  padding: 16px 0;
  overflow: hidden;
  border-top: 1.5px dashed var(--color-border-strong);
  border-bottom: 1.5px dashed var(--color-border-strong);
  background: var(--color-bg-soft);
}

.marquee {
  display: flex;
  align-items: center;
  width: max-content;
  animation: marquee-scroll 58s linear infinite;
}

.marquee-band:hover .marquee {
  animation-play-state: paused;
}

.marquee__item {
  padding: 0 4px;
  font-family: var(--font-display);
  font-size: 14.5px;
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.marquee__sep {
  margin: 0 20px;
  color: var(--color-primary);
  font-size: 11px;
  vertical-align: 2px;
}

@keyframes marquee-scroll {
  to { transform: translateX(-50%); }
}

/* ============================================================
   尾声 CTA（吉祥物邀请）
   ============================================================ */
.home-cta {
  position: relative;
  padding: calc(var(--section-gap) + 10px) 24px calc(var(--section-gap) + 24px);
  text-align: center;
  overflow: hidden;
}

.home-cta__mascot {
  display: inline-block;
}

/* 小球按钮：作为气泡的定位锚点 */
.home-cta__ball-btn {
  display: block;
  padding: 6px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  position: relative; /* 作为气泡的定位锚点 */
  background: transparent;
  border: none;
  animation: mascot-float 3.6s ease-in-out infinite;
  transition: transform 0.3s var(--ease-spring);
}

.home-cta__ball-btn:hover {
  transform: scale(1.06) rotate(2deg);
}

.home-cta__ball-btn:active {
  transform: scale(0.96);
}

.home-cta__ball-btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

/* 对话气泡：直接附着在按钮上，尾巴自然对准球心 */
.home-cta__bubble {
  position: absolute;
  bottom: calc(100% + 12px); /* 紧贴球的上方，留 12px 间隙给尾巴 */
  left: 50%; /* 水平居中于按钮 */
  transform: translateX(-50%); /* 精确居中 */
  width: max-content; /* 根据内容自适应宽度 */
  max-width: min(260px, 90vw); /* 限制最大宽度，避免过宽或溢出视口 */
  padding: 8px 16px;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-heading);
  background: var(--color-surface-raised);
  border: 1.5px solid var(--color-heading);
  border-radius: 12px;
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-heading) 16%, transparent);
  text-align: center; /* 多行时居中对齐 */
}

/* 气泡小尾巴：从气泡底部中央伸出，指向下方球心 */
.home-cta__bubble::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--color-surface-raised);
  border-right: 1.5px solid var(--color-heading);
  border-bottom: 1.5px solid var(--color-heading);
  transform: translateX(-50%) rotate(45deg) skew(6deg, 6deg);
}

.home-cta__title {
  margin-top: 26px;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 4.5vw, 2.3rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.home-cta__desc {
  margin: 12px auto 0;
  max-width: 420px;
  color: var(--color-text-secondary);
  font-size: 14.5px;
  line-height: 1.8;
}

.home-cta__actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.home-cta .spark--5 { top: 18%; left: 12%; background: var(--sticker-pink); animation-delay: 0.5s; }
.home-cta .spark--6 { bottom: 22%; right: 13%; background: var(--sticker-sky); animation-delay: 1.4s; }

/* ── 重访（同会话）：关闭首播动画，直接显示 ── */
.home--static .reveal {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
  will-change: auto;
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .hero__osc {
    display: none; /* 中屏起收起装置，保住图纸留白 */
  }

  /* 示波器已收起：吉祥物回到右上原位（中屏文字流变宽，左下放不下） */
  .hero__mascot {
    left: auto;
    top: 42%;
    right: clamp(2%, 4vw, 5%);
    bottom: auto;
  }

  .hero__bubble {
    max-width: 180px;
    white-space: normal;
    font-size: 12.5px;
  }
}

@media (max-width: 768px) {
  .hero__titleblock {
    grid-template-columns: repeat(2, auto);
  }

  .hero__tb-cell:nth-child(2) {
    border-right: none;
  }
}

@media (max-width: 640px) {
  .hero__sticker {
    top: auto;
    bottom: 96px;
    right: 18px;
    font-size: 13px;
    padding: 12px 14px 10px;
  }

  .hero__mascot {
    top: auto;
    bottom: 168px;
    right: 6px;
  }

  /* 缩放放在按钮上：容器 transform 交给 v-reveal 接管，互不覆盖 */
  .hero__mascot-btn {
    transform: scale(0.72);
  }

  .hero__bubble {
    max-width: 180px;
    white-space: normal;
    font-size: 12.5px;
  }

  .spark--2,
  .spark--3 {
    display: none;
  }

  .marquee__item {
    font-size: 13px;
  }

  .hero__scroll-hint {
    display: none; /* 小屏由 titleblock 底部占位，滚动提示让位 */
  }

  .hero__frame {
    inset: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* 减少动态：图框与标题直接呈现 */
  .home--intro .hero__frame,
  .home--intro .hero-title__ch,
  .home--intro .hero__eyebrow-dot {
    animation: none;
  }

  .home--intro .hero-title__ch {
    color: var(--color-heading);
    -webkit-text-stroke-color: transparent;
  }

  .home--intro .hero__eyebrow-dot {
    opacity: 1;
  }

  .hero__scroll-hint svg {
    animation: none;
  }

  .hero__btn:active {
    transform: none;
  }

  .hero__sticker:hover {
    transform: rotate(3.5deg);
  }

  /* 吉祥物 / 星尘 / 弹幕：静止 */
  .hero__mascot-btn,
  .home-cta__ball-btn {
    animation: none;
  }

  .hero__mascot-btn:hover,
  .hero__mascot-btn:active {
    transform: none;
  }

  .spark {
    animation: none;
    opacity: 0.85;
  }

  /* 跑马灯为匀速水平平移（无闪烁/旋转/缩放），不属晕动高风险动画：
     豁免 reduced-motion，保持滚动（参考 WCAG 对 animation 的削减范围） */

  .home--static .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
