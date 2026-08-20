<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { resolveAsset } from '@/api/request'

const props = withDefaults(
  defineProps<{ post: Post; featured?: boolean; flip?: boolean }>(),
  { featured: false, flip: false },
)

/* 试剂瓶标签：各技术的品牌色（无封面时的草图区配色） */
const tagColors: Record<string, { from: string; to: string; icon: string }> = {
  Vue: { from: '#42b883', to: '#35495e', icon: 'V' },
  TypeScript: { from: '#3178c6', to: '#235a97', icon: 'TS' },
  Vite: { from: '#646cff', to: '#535bf2', icon: '⚡' },
  CSS: { from: '#e0561d', to: '#c24511', icon: '#' },
  Pinia: { from: '#ffd859', to: '#e0a213', icon: 'P' },
}

const coverStyle = computed(() => {
  const colors = tagColors[props.post.tag] ?? { from: '#33687f', to: '#1d2a32', icon: '•' }
  return {
    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
  }
})

const hasCover = computed(() => !!props.post.cover)
const coverSrc = computed(() => resolveAsset(props.post.cover))

const tagIcon = computed(() => tagColors[props.post.tag]?.icon ?? '•')

/* 实验编号：数据库文章序号，编码真实信息 */
const expNo = computed(() => `EXP-${String(props.post.id).padStart(3, '0')}`)

/* 登记日期：登记簿式短横线格式 */
const filedDate = computed(() => (props.post.date ?? '').slice(0, 10))

const formattedViews = computed(() => {
  const v = props.post.views
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
})
</script>

<template>
  <RouterLink
    :to="`/post/${post.slug}`"
    class="exp-card"
    :class="{ 'exp-card--featured': featured, 'exp-card--reverse': flip }"
  >
    <!-- 封面 / 草图区 -->
    <div class="exp-card__cover" :style="coverStyle">
      <img
        v-if="hasCover"
        :src="coverSrc"
        :alt="post.title"
        class="exp-card__cover-img"
        loading="lazy"
      />
      <template v-else>
        <span class="exp-card__sketch-mark" aria-hidden="true" />
        <span class="exp-card__cover-icon">{{ tagIcon }}</span>
        <div class="exp-card__cover-pattern" />
      </template>
      <span class="exp-card__tag">{{ post.tag }}</span>
    </div>

    <!-- 登记内容 -->
    <div class="exp-card__body">
      <div class="exp-card__spine">
        <span class="exp-card__no">{{ expNo }}</span>
        <span class="exp-card__state">
          <i class="exp-card__led" aria-hidden="true" />
          FILED
        </span>
        <span class="exp-card__ai" title="摘要由 AI 生成">AI 摘要</span>
      </div>

      <h3 class="exp-card__title">{{ post.title }}</h3>
      <p class="exp-card__excerpt">{{ post.excerpt }}</p>

      <div class="exp-card__meta">
        <span class="exp-card__meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="18" height="18" x="3" y="4" rx="1" />
            <path d="M3 10h18M8 2v4M16 2v4" />
          </svg>
          {{ filedDate }}
        </span>
        <span class="exp-card__meta-dot" />
        <span class="exp-card__meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ post.readingTime }}min
        </span>
        <span class="exp-card__meta-dot" />
        <span class="exp-card__meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10 7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ formattedViews }}
        </span>
        <span class="exp-card__category">{{ post.category }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
/* ============================================================
   实验登记条目：登记脊（编号+状态灯）+ 内容 + 草图区
   ============================================================ */
.exp-card {
  position: relative;
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.3s var(--ease),
    border-color 0.3s var(--ease);
}

.exp-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--color-primary) 38%, transparent);
  box-shadow: var(--shadow-hover);
}

.exp-card:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

/* 悬停：编号点亮（像被抽查的档案） */
.exp-card:hover .exp-card__no {
  color: var(--color-primary);
  -webkit-text-stroke-color: transparent;
}

/* ─ 封面 / 草图区 ── */
.exp-card__cover {
  position: relative;
  flex-shrink: 0;
  width: 42%; /* 固定宽度比例 */
  min-height: 220px; /* 最小高度保证展示空间 */
  overflow: hidden;
  display: grid;
  place-items: center;
}

.exp-card__cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 完整显示图片，不裁剪 */
  background: var(--color-bg); /* 无图区域用底色填充 */
  transition: transform 0.5s var(--ease);
}

.exp-card:hover .exp-card__cover-img {
  transform: scale(1.04);
}

/* 无封面：坐标纸草图区 + 试剂图标 */
.exp-card__cover-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  background-size: 20px 20px;
  transition: transform 0.6s var(--ease-spring);
}

.exp-card:hover .exp-card__cover-pattern {
  transform: translate(4px, -4px);
}

/* 草图区左上角的对位十字（与 Hero 图框同语言） */
.exp-card__sketch-mark {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 12px;
  height: 12px;
  opacity: 0.55;
}

.exp-card__sketch-mark::before,
.exp-card__sketch-mark::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
}

.exp-card__sketch-mark::before {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
}

.exp-card__sketch-mark::after {
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-50%);
}

.exp-card__cover-icon {
  position: relative;
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 38px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.45s var(--ease-spring);
}

.exp-card:hover .exp-card__cover-icon {
  transform: scale(1.08) rotate(-4deg);
}

/* 试剂瓶标签 */
.exp-card__tag {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  padding: 3px 9px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #fff;
  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-xs);
  transition: background-color 0.3s var(--ease);
}

.exp-card:hover .exp-card__tag {
  background: rgba(0, 0, 0, 0.55);
}

/* ── 登记内容 ── */
.exp-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px 18px;
  flex: 1;
  min-width: 0;
}

/* 反向布局：文字在左，图片在右 */
.exp-card--reverse {
  flex-direction: row-reverse;
}

.exp-card--reverse .exp-card__cover {
  border-left: 1px solid var(--color-border);
  border-right: none;
}

.exp-card:not(.exp-card--reverse) .exp-card__cover {
  border-right: 1px solid var(--color-border);
}

/* 登记脊：实验编号（轮廓字）+ 归档状态 */
.exp-card__spine {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.exp-card__no {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: transparent;
  -webkit-text-stroke: 1px var(--color-text-secondary);
  transition:
    color var(--transition-fast),
    -webkit-text-stroke-color var(--transition-fast);
}

.exp-card__state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--color-text-tertiary);
}

.exp-card__led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fix-green);
  box-shadow: 0 0 6px var(--fix-green);
}

/* AI 摘要诚实标注：登记脊右端的小注 */
.exp-card__ai {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--color-text-tertiary);
  border: 1px dashed var(--color-border-strong);
  padding: 1px 7px;
  border-radius: var(--radius-xs);
  white-space: nowrap;
}

.exp-card__title {
  font-size: 17.5px;
  line-height: 1.45;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.exp-card:hover .exp-card__title {
  color: var(--color-primary);
}

.exp-card__excerpt {
  color: var(--color-text-secondary);
  font-size: 13.5px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 元信息行：等宽登记数据 ── */
.exp-card__meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 6px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.exp-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.exp-card__meta-item svg {
  opacity: 0.7;
}

.exp-card__meta-dot {
  width: 3px;
  height: 3px;
  background: currentColor;
  opacity: 0.45;
  flex-shrink: 0;
}

/* 分类右对齐：登记簿的类目栏 */
.exp-card__category {
  margin-left: auto;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  padding: 1px 7px;
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  white-space: nowrap;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/*  Featured：取消横向布局，改为强调视觉权重 ─ */
.exp-card--featured {
  border-width: 2px; /* 加粗边框突出重要性 */
  box-shadow: var(--shadow-md); /* 更强的阴影 */
}

.exp-card--featured .exp-card__cover {
  width: 45%; /* Featured 图片略宽 */
  min-height: 240px;
}

.exp-card--featured .exp-card__body {
  padding: 24px 26px 20px; /* 略大的内边距 */
}

.exp-card--featured .exp-card__no {
  font-size: 17px;
}

.exp-card--featured .exp-card__title {
  font-size: 19px;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.exp-card--featured .exp-card__excerpt {
  font-size: 14px;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.exp-card--featured .exp-card__cover-icon {
  font-size: 48px;
}

/* 响应式：小屏恢复纵向布局 */
@media (max-width: 768px) {
  .exp-card,
  .exp-card--reverse {
    flex-direction: column;
  }

  .exp-card__cover {
    width: 100% !important;
    height: 180px;
    min-height: 180px;
    border-right: none !important;
    border-left: none !important;
    border-bottom: 1px solid var(--color-border);
  }

  .exp-card--featured .exp-card__cover {
    height: 200px;
    min-height: 200px;
  }

  .exp-card__body {
    padding: 16px 18px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .exp-card,
  .exp-card:hover {
    transform: none !important;
  }

  .exp-card:hover .exp-card__cover-img,
  .exp-card:hover .exp-card__cover-pattern,
  .exp-card:hover .exp-card__cover-icon {
    transform: none;
  }
}
</style>
