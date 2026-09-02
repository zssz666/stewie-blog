<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Author } from '@/types/blog'
import { getAuthor } from '@/api/author'
import { getCategories, getPosts, getTags } from '@/api/post'
import { useSeo } from '@/composables/useSeo'
import { useCountUp } from '@/composables/useCountUp'

/* ── 高德地图 JS API Key ── */
const AMAP_KEY = '2e731f127dc2484ecb092e8e1e8a769c'

/* ── FAQ 常见问题（AEO：首句即结论，便于答案引擎摘录；JSON-LD 与页面可见内容同源） ── */
const faqs = [
  {
    q: 'Stewie 的前端实验室是什么网站？',
    a: 'Stewie 的前端实验室（stewie.fun）是一个中文前端技术博客，专注于 Vue 3、TypeScript、Vite、Pinia 的实战踩坑记录。每篇文章都是一个真实战例，包含问题复现步骤、根因分析与修复方案。',
  },
  {
    q: 'Stewie 是谁？',
    a: 'Stewie 是一名坐标四川成都的前端工程师，INFJ-A 人格，信奉「把每个 bug 做成一次实验」——遇到问题就复现、定位、修复并登记成实验报告。',
  },
  {
    q: '博客主要更新哪些主题？',
    a: '主要覆盖六大领域：Vue 3（组合式 API 与响应式陷阱）、TypeScript（类型系统避坑）、Vite（构建与部署）、Pinia（状态管理）、CSS（布局与双主题系统）、部署运维（Nginx 与 SEO）。',
  },
  {
    q: '文章里的代码示例可以直接使用吗？',
    a: '可以。所有代码均基于 Vue 3 + TypeScript + Vite 技术栈复现验证过，代码块右上角带一键复制按钮。',
  },
  {
    q: '如何联系 Stewie？',
    a: '通过关于页社交卡中的 GitHub 与邮箱等链接联系，也欢迎在任意文章下方留言评论。',
  },
]

useSeo({
  title: '关于 Stewie',
  description: 'Stewie，前端工程师。把每个 bug 做成一次实验，登记在册——这里是关于本实验室与研究员的一切。',
  path: '/about',
  /* FAQPage 结构化数据（AEO）：答案引擎/语音助手可直接引用的问答对，
     内容与下方页面可见 FAQ 区块严格一致（Google 规范要求） */
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
})

/* ── 研究员档案（后端数据） ── */
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

/* ── 实验数据（登记簿实时统计） ── */
const stats = ref({ posts: 0, views: 0, categories: 0, tags: 0 })

onMounted(async () => {
  try {
    author.value = await getAuthor()
  } catch (e) {
    console.error('获取作者信息失败:', e)
  }
  try {
    const [postsRes, cats, tags] = await Promise.all([
      getPosts({ size: 100 }),
      getCategories(),
      getTags(),
    ])
    stats.value = {
      posts: postsRes.total || postsRes.list.length,
      views: postsRes.list.reduce((sum, p) => sum + (p.views ?? 0), 0),
      categories: cats.length,
      tags: tags.length,
    }
  } catch (e) {
    console.error('获取实验数据失败:', e)
  }
  /* 数据卡进入视口后才触发数字滚动 */
  if (statsCardRef.value) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          statsActive.value = true
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(statsCardRef.value)
  }
  /* 初始化高德地图 */
  initAmap()
})

/* ── 加载高德地图 API ── */
const loadAmapScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load AMap script'))
    document.head.appendChild(script)
  })
}

/* ── 初始化高德地图（四川成都） ── */
const initAmap = async () => {
  try {
    await loadAmapScript()
    const map = new (window as any).AMap.Map('amap-container', {
      zoom: 11,
      center: [104.066541, 30.572269], // 成都坐标
      viewMode: '2D',
      resizeEnable: true,
    })
    // 添加标记
    new (window as any).AMap.Marker({
      position: [104.066541, 30.572269],
      title: '四川成都',
    }).addTo(map)
  } catch (e) {
    console.error('高德地图加载失败:', e)
  }
}

/* ── 实验数据数字滚动（进入视口才触发） ── */
const statsCardRef = ref<HTMLElement | null>(null)
const statsActive = ref(false)

const postsDisplay = useCountUp(() => stats.value.posts, { duration: 1300, active: statsActive })
const viewsDisplay = useCountUp(() => stats.value.views, { duration: 1700, active: statsActive })
const catsDisplay = useCountUp(() => stats.value.categories, { duration: 1300, active: statsActive })
const tagsDisplay = useCountUp(() => stats.value.tags, { duration: 1300, active: statsActive })

const formatViews = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
const formattedViews = computed(() => formatViews(viewsDisplay.value))

/* ── 技术栈墙：品牌色映射（与登记簿试剂标签同语言） ── */
const brandColors: Record<string, { from: string; to: string; icon: string }> = {
  Vue: { from: '#42b883', to: '#35495e', icon: 'V' },
  TypeScript: { from: '#3178c6', to: '#235a97', icon: 'TS' },
  Vite: { from: '#646cff', to: '#535bf2', icon: '⚡' },
  CSS: { from: '#e0561d', to: '#c24511', icon: '#' },
  Pinia: { from: '#ffd859', to: '#e0a213', icon: 'P' },
  Node: { from: '#3c873a', to: '#2f6b2e', icon: '⬢' },
  Spring: { from: '#6db33f', to: '#4f7a2f', icon: 'S' },
  koa: { from: '#4a4a58', to: '#2f2f3a', icon: 'K' },
}

const stackWall = computed(() =>
  (author.value.skills ?? []).map((skill) => {
    const key = Object.keys(brandColors).find((b) => skill.toLowerCase().includes(b.toLowerCase()))
    const brand = key ? brandColors[key] : null
    return {
      name: skill,
      icon: brand?.icon ?? skill.charAt(0).toUpperCase(),
      style: {
        background: brand
          ? `linear-gradient(135deg, ${brand.from}, ${brand.to})`
          : 'linear-gradient(135deg, #33687f, #1d2a32)',
      },
    }
  }),
)

/* ── 履历（登记簿条目） ── */
const resume = [
  { key: '破壳', val: '2004 · 重庆' },
  { key: '入行', val: '2023 · 大前端' },
  { key: '专职', val: '2025 · 前端工程师' },
  { key: '开博', val: '2026 · 实验登记簿' },
]

const socialIcons: Record<string, string> = {
  GitHub: 'M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.349-1.086.635-1.337-2.22-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12 22 6.477 17.523 2 12 2z',
  Twitter: 'M22 5.8a8.5 8.5 0 0 1-2.36.646 4.131 4.131 0 0 0 1.805-2.27 8.246 8.246 0 0 1-2.61.998A4.11 4.11 0 0 0 15.85 3a4.11 4.11 0 0 0-4.107 4.11c0 .323.036.637.106.937A11.674 11.674 0 0 1 3.39 4.283a4.11 4.11 0 0 0 1.273 5.488 4.087 4.087 0 0 1-1.862-.515v.052a4.11 4.11 0 0 0 3.294 4.029 4.124 4.124 0 0 1-1.855.07 4.113 4.113 0 0 0 3.838 2.855A8.25 8.25 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.843c7.547 0 11.674-6.252 11.674-11.674 0-.178-.004-.355-.012-.531A8.343 8.343 0 0 0 22 5.8z',
  Email: 'M2 4h20v16H2V4zm10 9L4 7v10h16V7l-8 6z',
}

/* ─ 电影/动漫收藏 ── */
const movies = [
  { title: '鬼灭之刃', img: 'https://imgcn.bgmbk.tv/file/bk/7105/f9be5698e65a8d1da913861cdcdd38ac.webp?t=38256095707312958&k=1855601776069519' },
  { title: '无职转生', img: 'https://imgcn3.bgmbk.tv/file/bk/11742/5fa16e4cac018f1a7f1158dbc02b52ff.webp?t=51647715930988718&k=1830260344101831' },
  { title: '假面骑士zzz', img: 'https://static-a.xgcartoon.com/cover/jiamianqishizzzjiamianqishizeztzguoyu4k-shisenzhangtailang.jpg?w=230&h=280&q=100' },
  { title: '蜘蛛侠：崭新之日', img: 'https://img.maohaha.xyz/?url=https://img3.doubanio.com/view/photo/l_ratio_poster/public/p2934276912.jpg' },
  { title: '开学那天我被当成传说', img: 'https://cdn.duanjubaike.org/cover/2026/07/21e6cc4e-8640-42b5-abff-5b39e9efe8d9.jpg' },
]
</script>

<template>
  <div class="about">
    <!-- ── 页头：标题 + 研究员标签 ── -->
    <header class="container about__head" v-reveal>
      <h1 class="about__title">关于</h1>
      <ul class="about__badges">
        <li class="about__badge">🧪 踩坑实验爱好者</li>
        <li class="about__badge">🔨 设计开发一条龙</li>
        <li class="about__badge">🏃 脚踏实地行动派</li>
        <li class="about__badge">🔍 分享与热心互助</li>
      </ul>
    </header>

    <!-- ── Hero 横幅：研究员自我登记 ── -->
    <section class="container" v-reveal="120">
      <div class="about__hero">
        <div class="about__hero-grid" aria-hidden="true" />
        <!-- 示波器波形装饰 -->
        <svg class="about__hero-wave" viewBox="0 0 280 90" fill="none" preserveAspectRatio="none" aria-hidden="true">
          <path class="about__hero-wave-path about__hero-wave-path--a" d="M0 45 Q 35 5 70 45 T 140 45 T 210 45 T 280 45" />
          <path class="about__hero-wave-path about__hero-wave-path--b" d="M0 45 Q 35 85 70 45 T 140 45 T 210 45 T 280 45" />
        </svg>
        <div class="about__hero-main">
          <div class="about__avatar-wrap">
            <div class="about__avatar-ring" aria-hidden="true" />
            <img
              src="/avatar.png"
              :alt="author.name"
              class="about__avatar about__avatar--img"
            />
          </div>
          <div class="about__hero-text">
            <p class="about__hero-hi">你好，很高兴认识你 👋</p>
            <h2 class="about__hero-line">
              我是 <strong class="about__hero-name">{{ author.name }}</strong>
              <span class="about__hero-sep" aria-hidden="true">·</span>
              是一名 <em class="about__hero-role">{{ author.role || '前端工程师' }}</em>
            </h2>
            <p class="about__hero-bio">{{ author.bio }}</p>
            <div class="about__socials">
              <a
                v-for="social in author.socials"
                :key="social.label"
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                class="about__social"
                :aria-label="social.label"
                :title="social.label"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path :d="socialIcons[social.label] || ''" />
                </svg>
                <span>{{ social.label }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 大字标语 ── -->
    <section class="container about__motto" v-reveal="200">
      <span class="about__motto-deco about__motto-deco--circle" aria-hidden="true" />
      <span class="about__motto-deco about__motto-deco--dot" aria-hidden="true" />
      <span class="about__motto-deco about__motto-deco--star" aria-hidden="true">✦</span>
      <h2 class="about__motto-title">Hello, World<sup>⌒★</sup></h2>
      <p class="about__motto-sub"><span class="about__motto-comment">//</span> 把踩过的坑，写成实验报告。</p>
    </section>

    <!-- ── Bento 宫格 ── -->
    <section class="container about__bento">
      <!-- 性格卡 -->
      <article class="bento bento--personality" v-reveal="260">
        <span class="bento__idx" aria-hidden="true">#01</span>
        <p class="bento__label">性格</p>
        <div class="bento__personality-body">
          <span class="bento__emoji" aria-hidden="true">👦</span>
          <h3 class="bento__title">提倡者 <span class="bento__mbti">INFJ-A</span></h3>
        </div>
        <a
          class="bento__link"
          href="https://www.16personalities.com/ch/INFJ-人格"
          target="_blank"
          rel="noopener noreferrer"
        >
          在 16personalities 了解更多关于「提倡者」↗
        </a>
      </article>

      <!-- 爱好卡 -->
      <article class="bento bento--hobbies" v-reveal="320">
        <span class="bento__idx" aria-hidden="true">#02</span>
        <p class="bento__label">爱好</p>
        <p class="bento__hobbies-line">编码、造轮子、数码</p>
        <p class="bento__hobbies-line">音乐、番剧、咖啡</p>
        <div class="bento__hobbies-tags">
          <span>👀 保持好奇</span>
          <span>🔁 持续输出</span>
          <span>☕ 燃料充足</span>
        </div>
      </article>

      <!-- 电影/动漫卡 -->
      <article class="bento bento--movies" v-reveal="350">
        <span class="bento__idx" aria-hidden="true">#03</span>
        <p class="bento__label">影视收藏</p>
        <div class="bento__movies-grid">
          <a
            v-for="(m, i) in movies"
            :key="i"
            class="bento__movie-item"
            href="#"
            :title="m.title"
          >
            <img :src="m.img" :alt="m.title" />
            <span class="bento__movie-title">{{ m.title }}</span>
          </a>
        </div>
      </article>

      <!-- 引言卡 -->
      <article class="bento bento--quote" v-reveal="410">
        <span class="bento__idx" aria-hidden="true">#04</span>
        <span class="bento__sticker">这话挺帅</span>
        <blockquote class="bento__quote-text">
          Talk is cheap.<br />Show me the code.
        </blockquote>
        <cite class="bento__quote-cite">— Linus Torvalds</cite>
      </article>

      <!-- 技术栈墙 -->
      <article class="bento bento--stack" v-reveal="470">
        <span class="bento__idx" aria-hidden="true">#05</span>
        <div class="bento__stack-head">
          <p class="bento__label">技术栈</p>
          <p class="bento__stack-note">全都在用！👀</p>
        </div>
        <ul class="bento__stack-grid">
          <li
            v-for="t in stackWall"
            :key="t.name"
            class="bento__stack-item"
            :style="t.style"
            :title="`${t.name} · 登记在册`"
          >
            <span class="bento__stack-icon">{{ t.icon }}</span>
            <span class="bento__stack-name">{{ t.name }}</span>
          </li>
        </ul>
      </article>

      <!-- 初心卡（终端） -->
      <article class="bento bento--origin" v-reveal="530">
        <span class="bento__idx" aria-hidden="true">#06</span>
        <p class="bento__label">初心</p>
        <div class="bento__terminal" aria-hidden="true">
          <span class="bento__term-dots"><i /><i /><i /></span>
          <code class="bento__term-line">$ node hello.js</code>
          <code class="bento__term-line bento__term-line--out">Hello, World</code>
        </div>
        <p class="bento__origin-note">2023 · 第一行代码落笔，从此走上踩坑不归路</p>
      </article>

      <!-- 关注偏好卡 -->
      <article class="bento bento--focus" v-reveal="590">
        <span class="bento__idx" aria-hidden="true">#07</span>
        <p class="bento__label">关注偏好</p>
        <h3 class="bento__focus-title">前端生态</h3>
        <p class="bento__focus-sub">框架演进 · 工程化 · 浏览器新 API</p>
        <span class="bento__focus-glow" aria-hidden="true" />
      </article>

      <!-- 音乐偏好卡 -->
      <article class="bento bento--music" v-reveal="650">
        <span class="bento__idx" aria-hidden="true">#08</span>
        <p class="bento__label">音乐偏好</p>
        <h3 class="bento__music-title">Lo-fi · 纯音乐 · 华语流行</h3>
        <div class="bento__eq" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <p class="bento__music-sub">戴上耳机，跟实验室一起写码 🎧</p>
      </article>

      <!-- 实验数据卡 -->
      <article ref="statsCardRef" class="bento bento--stats" v-reveal="710">
        <span class="bento__idx" aria-hidden="true">#09</span>
        <p class="bento__label">实验数据</p>
        <dl class="bento__stats">
          <div class="bento__stat">
            <dt>登记实验</dt>
            <dd>{{ postsDisplay }}</dd>
          </div>
          <div class="bento__stat">
            <dt>总浏览量</dt>
            <dd>{{ formattedViews }}</dd>
          </div>
          <div class="bento__stat">
            <dt>分类</dt>
            <dd>{{ catsDisplay }}</dd>
          </div>
          <div class="bento__stat">
            <dt>标签</dt>
            <dd>{{ tagsDisplay }}</dd>
          </div>
        </dl>
        <p class="bento__stats-note">数据来自本站登记簿实时统计</p>
      </article>

      <!-- 实验基地卡（高德地图） -->
      <article class="bento bento--base" v-reveal="770">
        <span class="bento__idx" aria-hidden="true">#10</span>
        <p class="bento__label">实验基地</p>
        <div id="amap-container" class="bento__map" />
      </article>

      <!-- 履历卡 -->
      <article class="bento bento--resume" v-reveal="830">
        <span class="bento__idx" aria-hidden="true">#11</span>
        <p class="bento__label">履历</p>
        <ul class="bento__resume-list">
          <li v-for="item in resume" :key="item.key">
            <span class="bento__resume-key">{{ item.key }}</span>
            <span class="bento__resume-val">{{ item.val }}</span>
          </li>
        </ul>
      </article>

      <!-- 摆烂卡 -->
      <article class="bento bento--lazy" v-reveal="890">
        <span class="bento__idx" aria-hidden="true">#12</span>
        <p class="bento__lazy-text">
          <span class="bento__lazy-t1">不想重构… 能跑就行…</span>
          <span class="bento__lazy-t2" aria-hidden="true">……行吧，明天就改</span>
        </p>
        <p class="bento__lazy-sub">
          <span class="bento__lazy-s1">—— 某个祖传函数的遗言</span>
          <span class="bento__lazy-s2" aria-hidden="true">—— 三个月后（并没有）</span>
        </p>
      </article>
    </section>

    <!-- FAQ 常见问题（AEO：内容随 DOM 直出，供答案引擎与 AI 助手引用） -->
    <section class="container about__faq" v-reveal="120">
      <p class="about__faq-tag">F.A.Q</p>
      <h2 class="about__faq-title">实验台常见提问</h2>
      <div class="about__faq-list">
        <details v-for="f in faqs" :key="f.q" class="about__faq-item">
          <summary class="about__faq-q">{{ f.q }}</summary>
          <p class="about__faq-a">{{ f.a }}</p>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   关于页：Bento 宫格 + 实验室登记簿视觉语言
   ============================================================ */

/* ── 页头 ── */
.about__head {
  padding-top: calc(var(--header-height) + 56px);
  text-align: center;
}

.about__title {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: 0.08em;
}

/* 标题下的图纸刻度线 */
.about__title::after {
  content: '';
  display: block;
  height: 4px;
  margin: 14px auto 0;
  width: 72px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-primary) 0 14px,
    transparent 14px 18px
  );
  border-radius: 2px;
  animation: ruler-draw 0.9s var(--ease) 0.15s backwards;
}

@keyframes ruler-draw {
  from { width: 0; }
  to { width: 72px; }
}

.about__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.about__badge {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: color var(--transition-fast), border-color var(--transition-fast), transform 0.3s var(--ease-spring);
  /* 逐个弹入 */
  animation: badge-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.about__badges .about__badge:nth-child(1) { animation-delay: 0.12s; }
.about__badges .about__badge:nth-child(2) { animation-delay: 0.22s; }
.about__badges .about__badge:nth-child(3) { animation-delay: 0.32s; }
.about__badges .about__badge:nth-child(4) { animation-delay: 0.42s; }

@keyframes badge-in {
  from { opacity: 0; transform: translateY(12px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.about__badge:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  transform: translateY(-2px);
}

/* ── Hero 横幅 ── */
.about__hero {
  position: relative;
  margin-top: 40px;
  padding: 46px 52px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  overflow: hidden;
  box-shadow: var(--shadow-primary);
}

/* 坐标纸纹理叠加 */
.about__hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
}

.about__hero-main {
  position: relative;
  display: flex;
  align-items: center;
  gap: 34px;
}

.about__hero-text {
  position: relative;
  min-width: 0;
}

/* 头像（白色虚线环慢速旋转，像被登记在册的证件照） */
.about__avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.about__avatar-ring {
  position: absolute;
  inset: -9px;
  border: 2px dashed rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  animation: ring-spin 16s linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

.about__avatar {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 2.4rem;
  font-weight: 800;
  overflow: hidden;
}

.about__avatar--img {
  object-fit: cover;
  padding: 0;
}

/* 示波器波形装饰：虚线流动 */
.about__hero-wave {
  position: absolute;
  right: 34px;
  top: 50%;
  transform: translateY(-50%);
  width: 240px;
  height: 76px;
  pointer-events: none;
}

.about__hero-wave-path {
  stroke: rgba(255, 255, 255, 0.78);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 10 14;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.45));
}

.about__hero-wave-path--a {
  animation: wave-flow 2.6s linear infinite;
}

.about__hero-wave-path--b {
  stroke: rgba(255, 255, 255, 0.32);
  stroke-width: 1.5;
  animation: wave-flow 3.8s linear infinite reverse;
}

@keyframes wave-flow {
  to { stroke-dashoffset: -48; }
}

.about__hero-hi {
  margin: 0 0 10px;
  font-size: 15px;
  opacity: 0.88;
}

.about__hero-line {
  margin: 0 0 16px;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.about__hero-name {
  font-weight: 800;
}

.about__hero-sep {
  margin: 0 10px;
  opacity: 0.5;
}

.about__hero-role {
  font-style: normal;
  opacity: 0.92;
}

.about__hero-bio {
  margin: 0;
  max-width: 560px;
  font-size: 15px;
  line-height: 1.9;
  opacity: 0.85;
}

.about__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.about__social {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--radius-full);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background-color 0.3s var(--ease), transform 0.3s var(--ease-spring);
}

.about__social:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: translateY(-2px);
}

.about__social:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
}

/* ── 大字标语 ── */
.about__motto {
  position: relative;
  padding: 64px 0 48px;
  text-align: center;
}

.about__motto-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: clamp(2.2rem, 6vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-heading);
}

.about__motto-title sup {
  display: inline-block;
  color: #ec4899;
  font-size: 0.5em;
  margin-left: 4px;
  transition: transform 0.4s var(--ease-spring);
}

.about__motto-title:hover sup {
  transform: rotate(18deg) scale(1.3);
}

.about__motto-sub {
  margin: 14px 0 0;
  font-family: var(--font-mono);
  font-size: 13.5px;
  letter-spacing: 0.14em;
  color: var(--color-text-tertiary);
}

.about__motto-comment {
  margin-right: 7px;
  font-weight: 600;
  color: var(--fix-green);
}

/* 漂浮装饰：橙圆 / 蓝点 / 粉星 */
.about__motto-deco {
  position: absolute;
  pointer-events: none;
  animation: deco-float 3.6s ease-in-out infinite alternate;
}

.about__motto-deco--circle {
  top: 22%;
  left: 12%;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f59e0b;
  opacity: 0.85;
}

.about__motto-deco--dot {
  bottom: 30%;
  right: 14%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  animation-delay: -1.2s;
}

.about__motto-deco--star {
  top: 14%;
  right: 20%;
  font-size: 24px;
  color: #ec4899;
  animation-delay: -2.1s;
}

@keyframes deco-float {
  from { transform: translateY(-6px) rotate(-4deg); }
  to { transform: translateY(8px) rotate(5deg); }
}

/* ============================================================
   Bento 宫格
   ============================================================ */
.about__bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 18px;
  padding-bottom: 88px;
}

.bento {
  position: relative;
  padding: 24px 26px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
  transition: transform 0.25s var(--ease), box-shadow 0.3s var(--ease), border-color 0.3s var(--ease);
}

.bento:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
  border-color: color-mix(in srgb, var(--color-primary) 32%, transparent);
}

/* hover 反馈：编号与眉题点亮（像被抽查的档案） */
.bento__idx,
.bento__label {
  transition: color var(--transition-fast), opacity var(--transition-fast);
}

.bento:hover .bento__idx {
  color: var(--color-primary);
  opacity: 1;
}

.bento:hover .bento__label {
  color: var(--color-primary);
}

/* 深色卡用各自强调色 */
.bento--quote:hover .bento__idx,
.bento--quote:hover .bento__label {
  color: #fbbf24;
}

.bento--focus:hover .bento__idx,
.bento--focus:hover .bento__label {
  color: #c4b5fd;
}

.bento--stats:hover .bento__idx,
.bento--stats:hover .bento__label {
  color: #f9fafb;
}

.bento--base:hover .bento__idx,
.bento--base:hover .bento__label {
  color: #4ade80;
}

/* 登记编号（右上角） */
.bento__idx {
  position: absolute;
  top: 13px;
  right: 15px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  opacity: 0.65;
}

/* 眉题 */
.bento__label {
  margin: 0 0 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--color-text-tertiary);
}

/* ── #01 性格卡 ── */
.bento--personality {
  grid-column: span 5;
  background:
    radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.14), transparent 55%),
    var(--color-surface);
}

.bento__personality-body {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 14px;
}

.bento__emoji {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  font-size: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.18), rgba(245, 158, 11, 0.05));
  border: 1px dashed rgba(245, 158, 11, 0.5);
  animation: emoji-bob 3.2s ease-in-out infinite alternate;
}

@keyframes emoji-bob {
  from { transform: translateY(-3px); }
  to { transform: translateY(4px); }
}

.bento__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-heading);
}

.bento__mbti {
  font-family: var(--font-mono);
  font-size: 0.82em;
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  margin-left: 4px;
}

.bento__link {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  transition: color var(--transition-fast);
}

.bento__link:hover {
  color: var(--color-primary);
}

/* ── #02 爱好卡 ── */
.bento--hobbies {
  grid-column: span 7;
  background:
    radial-gradient(circle at 12% 85%, rgba(236, 72, 153, 0.12), transparent 50%),
    var(--color-surface);
}

.bento__hobbies-line {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: 0.01em;
}

.bento__hobbies-line + .bento__hobbies-line {
  margin-bottom: 18px;
}

.bento__hobbies-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.bento__hobbies-tags span {
  padding: 5px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #be185d;
  background: rgba(236, 72, 153, 0.1);
  border: 1px solid rgba(236, 72, 153, 0.25);
  border-radius: var(--radius-full);
  transition: transform 0.25s var(--ease-spring), background-color 0.25s var(--ease);
}

.bento__hobbies-tags span:hover {
  transform: translateY(-2px) scale(1.05);
  background: rgba(236, 72, 153, 0.2);
}

/* ── #04 引言卡（深色） ── */
.bento--quote {
  grid-column: span 5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 190px;
  background: linear-gradient(150deg, #1e293b, #0f172a);
  border-color: #334155;
}

.bento--quote .bento__label {
  color: rgba(255, 255, 255, 0.45);
}

.bento--quote .bento__idx {
  color: rgba(255, 255, 255, 0.4);
}

/* 「这话挺帅」贴纸：hover 时甩动 */
.bento__sticker {
  position: absolute;
  top: 18px;
  right: 44px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px dashed rgba(245, 158, 11, 0.55);
  border-radius: var(--radius-xs);
  transform: rotate(6deg);
  transition: transform 0.35s var(--ease-spring);
}

.bento--quote:hover .bento__sticker {
  transform: rotate(-7deg) scale(1.12);
}

.bento__quote-text {
  margin: 0 0 14px;
  font-family: var(--font-mono);
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 700;
  line-height: 1.55;
  color: #f1f5f9;
  letter-spacing: -0.01em;
}

.bento__quote-cite {
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-style: normal;
  color: rgba(255, 255, 255, 0.5);
}

/* ── #05 技术栈墙 ── */
.bento--stack {
  grid-column: span 7;
}

.bento__stack-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.bento__stack-head .bento__label {
  margin: 0;
}

.bento__stack-note {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
}

.bento__stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bento__stack-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  color: #fff;
  transition: transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease);
}

.bento__stack-item:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: var(--shadow-sm);
}

.bento__stack-icon {
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.bento__stack-name {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.92;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── #06 初心卡（终端，绿色） ── */
.bento--origin {
  grid-column: span 5;
  background:
    radial-gradient(circle at 90% 90%, rgba(34, 197, 94, 0.12), transparent 55%),
    var(--color-surface);
}

.bento__terminal {
  margin-bottom: 14px;
  padding: 12px 14px 14px;
  background: #0f172a;
  border-radius: var(--radius-sm);
  border: 1px solid #334155;
}

.bento__term-dots {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.bento__term-dots i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.bento__term-dots i:nth-child(1) { background: #ef4444; }
.bento__term-dots i:nth-child(2) { background: #f59e0b; }
.bento__term-dots i:nth-child(3) { background: #22c55e; }

.bento__term-line {
  display: block;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.8;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bento__term-line--out {
  color: #4ade80;
}

.bento__origin-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

/* ── #07 关注偏好卡（紫） ── */
.bento--focus {
  grid-column: span 4;
  background:
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.35), transparent 60%),
    linear-gradient(150deg, #2e1065, #1e1b4b);
  border-color: #4c3a99;
}

.bento--focus .bento__label {
  color: rgba(196, 181, 253, 0.75);
}

.bento--focus .bento__idx {
  color: rgba(196, 181, 253, 0.55);
}

.bento__focus-title {
  margin: 0 0 8px;
  font-size: 1.3rem;
  font-weight: 800;
  color: #f5f3ff;
}

.bento__focus-sub {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: rgba(196, 181, 253, 0.8);
}

/* 光晕 */
.bento__focus-glow {
  position: absolute;
  bottom: -30px;
  right: -30px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.5), transparent 70%);
  filter: blur(18px);
  animation: glow-pulse 3.4s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from { opacity: 0.45; transform: scale(0.9); }
  to { opacity: 0.85; transform: scale(1.1); }
}

/* ── #08 音乐偏好卡（蓝紫） ── */
.bento--music {
  grid-column: span 4;
  background:
    radial-gradient(circle at 20% 85%, rgba(59, 130, 246, 0.28), transparent 55%),
    radial-gradient(circle at 85% 15%, rgba(236, 72, 153, 0.2), transparent 50%),
    var(--color-surface);
}

.bento__music-title {
  margin: 0 0 14px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading);
}

/* 均衡器跳动 */
.bento__eq {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 30px;
  margin-bottom: 14px;
  transition: height 0.4s var(--ease);
}

.bento--music:hover .bento__eq {
  height: 42px;
}

.bento__eq i {
  width: 5px;
  height: 40%;
  border-radius: 2px;
  background: linear-gradient(to top, #3b82f6, #ec4899);
  animation: eq-bounce 0.9s ease-in-out infinite alternate;
}

.bento__eq i:nth-child(1) { animation-delay: -0.1s; }
.bento__eq i:nth-child(2) { animation-delay: -0.5s; }
.bento__eq i:nth-child(3) { animation-delay: -0.3s; }
.bento__eq i:nth-child(4) { animation-delay: -0.8s; }
.bento__eq i:nth-child(5) { animation-delay: -0.2s; }

@keyframes eq-bounce {
  from { height: 22%; }
  to { height: 100%; }
}

.bento__music-sub {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* ── #09 实验数据卡（深灰） ── */
.bento--stats {
  grid-column: span 4;
  background: linear-gradient(160deg, #1f2937, #111827);
  border-color: #374151;
}

.bento--stats .bento__label {
  color: rgba(255, 255, 255, 0.45);
}

.bento--stats .bento__idx {
  color: rgba(255, 255, 255, 0.4);
}

.bento__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
  margin: 0;
}

.bento__stat dt {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 3px;
}

.bento__stat dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.55rem;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.1;
}

.bento__stats-note {
  margin: 16px 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.35);
}

/* ── #11 履历卡 ─ */
.bento--resume {
  grid-column: span 5;
}

.bento__resume-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bento__resume-list li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13.5px;
  transition: transform 0.25s var(--ease);
}

.bento__resume-list li:hover {
  transform: translateX(5px);
}

.bento__resume-key {
  flex-shrink: 0;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  padding: 1px 8px;
  background: var(--color-primary-soft);
  border-radius: var(--radius-xs);
  text-align: center;
  transition: background-color 0.25s var(--ease), color 0.25s var(--ease);
}

.bento__resume-list li:hover .bento__resume-key {
  background: var(--color-primary);
  color: #fff;
}

.bento__resume-val {
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.bento__resume-list li:hover .bento__resume-val {
  color: var(--color-heading);
}

/* ── #03 电影/动漫卡 ── */
.bento--movies {
  grid-column: span 7;
  background: linear-gradient(135deg, #2d1f3d, #1a1225);
  overflow: hidden;
}

.bento--movies .bento__label {
  color: #c4b5fd;
}

.bento--movies .bento__idx {
  color: #c4b5fd;
}

.bento__movies-grid {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  width: 100%;
}

.bento__movie-item {
  position: relative;
  flex: 1;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  cursor: pointer;
}

.bento__movie-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.bento__movie-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.bento__movie-item:hover {
  transform: scale(1.15);
  z-index: 10;
  box-shadow: 0 12px 32px rgba(196, 181, 253, 0.35);
}

.bento__movie-item:hover img {
  transform: scale(1.08);
}

.bento__movie-item:hover .bento__movie-title {
  opacity: 1;
  transform: translateY(0);
}

/* ── #10 实验基地（高德地图） ─ */
.bento--base {
  grid-column: span 7;
  background: linear-gradient(135deg, #1d2a32, #0f1820);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bento--base .bento__label {
  margin: 14px 18px 10px;
  color: #4ade80;
}

.bento--base .bento__idx {
  color: #4ade80;
  z-index: 2;
}

.bento__map {
  flex: 1;
  min-height: 200px;
  overflow: hidden;
}

/* ── #12 摆烂卡 ── */
.bento--lazy {
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 130px;
  text-align: center;
  background: repeating-linear-gradient(
    -45deg,
    var(--color-surface),
    var(--color-surface) 14px,
    color-mix(in srgb, var(--color-bg) 60%, var(--color-surface)) 14px,
    color-mix(in srgb, var(--color-bg) 60%, var(--color-surface)) 28px
  );
}

.bento__lazy-text {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  display: grid;
}

.bento__lazy-text > span {
  grid-area: 1 / 1;
  transition: opacity 0.35s var(--ease), transform 0.35s var(--ease);
}

.bento__lazy-t2 {
  opacity: 0;
  transform: translateY(10px);
  color: var(--color-primary);
}

.bento--lazy:hover .bento__lazy-t1 {
  opacity: 0;
  transform: translateY(-10px);
}

.bento--lazy:hover .bento__lazy-t2 {
  opacity: 1;
  transform: translateY(0);
}

.bento__lazy-sub {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: grid;
}

.bento__lazy-sub > span {
  grid-area: 1 / 1;
  transition: opacity 0.35s var(--ease);
}

.bento__lazy-s2 {
  opacity: 0;
}

.bento--lazy:hover .bento__lazy-s1 {
  opacity: 0;
}

.bento--lazy:hover .bento__lazy-s2 {
  opacity: 1;
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 960px) {
  .bento--personality,
  .bento--hobbies,
  .bento--quote,
  .bento--stack,
  .bento--movies {
    grid-column: span 12;
  }

  .bento--origin,
  .bento--focus,
  .bento--music,
  .bento--stats,
  .bento--base,
  .bento--resume {
    grid-column: span 6;
  }

  /* 影视收藏：平板上两行排布（3 + 2） */
  .bento__movies-grid {
    flex-wrap: wrap;
  }

  .bento__movie-item {
    flex: 0 0 calc((100% - 20px) / 3);
  }
}

@media (max-width: 640px) {
  .about__hero {
    padding: 32px 26px;
  }

  .about__hero-main {
    flex-direction: column;
    text-align: center;
    gap: 18px;
  }

  .about__avatar-wrap {
    margin: 0 auto;
  }

  .about__hero-bio {
    margin: 0 auto;
  }

  .about__socials {
    justify-content: center;
  }

  .about__hero-wave {
    width: 170px;
    right: 16px;
    opacity: 0.3;
  }

  .about__motto {
    padding: 48px 0 40px;
  }

  .about__motto-deco--circle {
    left: 6%;
  }

  .about__motto-deco--dot {
    right: 8%;
  }

  .about__motto-deco--star {
    right: 12%;
  }

  .about__bento {
    gap: 14px;
    padding-bottom: 64px;
  }

  .bento,
  .bento--origin,
  .bento--focus,
  .bento--music,
  .bento--stats,
  .bento--base,
  .bento--resume {
    grid-column: span 12;
  }

  /* 影视收藏：小屏两列排布（2 + 2 + 1） */
  .bento__movie-item {
    flex: 0 0 calc((100% - 10px) / 2);
  }

  /* 地图：小屏加高，避免过矮 */
  .bento__map {
    min-height: 240px;
  }

  .bento {
    padding: 20px 20px;
  }

  /* 地图卡保持零内边距，地图填满 */
  .bento--base {
    padding: 0;
  }

  .bento__sticker {
    right: 34px;
  }
}

/* ============================================================
   减少动态
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .about__motto-deco,
  .about__hero-wave-path,
  .about__avatar-ring,
  .about__badge,
  .bento__emoji,
  .bento__focus-glow,
  .bento__eq i {
    animation: none;
  }

  .about__title::after {
    animation: none;
  }

  .bento:hover,
  .about__badge:hover,
  .about__social:hover,
  .bento__stack-item:hover,
  .bento__hobbies-tags span:hover,
  .bento__resume-list li:hover {
    transform: none;
  }
}

/* ============================================================
   FAQ 常见问题（AEO：结构化问答区块，内容随 DOM 直出）
   ============================================================ */
.about__faq {
  margin-top: 64px;
}

.about__faq-tag {
  margin: 0 0 10px;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.35em;
  color: var(--color-primary);
  text-align: center;
}

.about__faq-title {
  margin: 0 0 28px;
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: center;
}

.about__faq-list {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

/* 单条问答：图纸虚线边框，与 Bento 宫格同一套视觉语言 */
.about__faq-item {
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.about__faq-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 6px 24px rgb(0 0 0 / 8%);
}

.about__faq-item[open] {
  border-style: solid;
}

.about__faq-q {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

/* 去掉浏览器默认三角（Firefox / Chrome 双写法） */
.about__faq-q::-webkit-details-marker {
  display: none;
}

.about__faq-q::marker {
  content: '';
}

/* Q 字徽标 */
.about__faq-q::before {
  content: 'Q';
  flex: none;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-xs);
}

/* 展开指示箭头：收起 ▸ / 展开旋转 90° */
.about__faq-q::after {
  content: '▸';
  margin-left: auto;
  flex: none;
  color: var(--color-text-secondary);
  transition: transform 0.25s var(--ease, ease);
}

.about__faq-item[open] .about__faq-q::after {
  transform: rotate(90deg);
}

.about__faq-item[open] .about__faq-q {
  border-bottom: 1px dashed var(--color-border);
}

.about__faq-a {
  margin: 0;
  padding: 14px 20px 18px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .about__faq {
    margin-top: 48px;
  }

  .about__faq-q {
    font-size: 14px;
    padding: 13px 16px;
  }

  .about__faq-a {
    padding: 12px 16px 16px;
  }
}
</style>
