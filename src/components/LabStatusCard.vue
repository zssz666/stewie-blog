<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EmotionBall from './EmotionBall.vue'
import { useCountUp } from '@/composables/useCountUp'

/**
 * RPG 角色状态卡 —— 「研究员档案」
 * HP = 发量、MP = 咖啡（趣味固定值），EXP = 实验记录数（真实文章数）。
 * LV 与称号由 EXP 驱动：每 10 条实验升一级。
 */
interface Props {
  /** 已登记实验数（真实文章数） */
  expCount?: number
}

const props = withDefaults(defineProps<Props>(), { expCount: 0 })

/* ── 等级体系（EXP = 文章数，每 10 条升级） ── */
const RANKS = [
  { min: 50, title: '传说发明家' },
  { min: 20, title: '疯狂科学家' },
  { min: 10, title: '实验助理' },
  { min: 0, title: '见习研究员' },
] as const

const level = computed(() => Math.min(Math.floor(props.expCount / 10) + 1, 5))
const rankTitle = computed(() => RANKS.find((r) => props.expCount >= r.min)?.title ?? '见习研究员')

const EXP_PER_LEVEL = 10
const expInLevel = computed(() =>
  props.expCount >= 50 ? props.expCount : props.expCount % EXP_PER_LEVEL,
)
const expPct = computed(() => Math.min((expInLevel.value / EXP_PER_LEVEL) * 100, 100))

/* ── 趣味状态条 ── */
const HP_MAX = 100
const MP_MAX = 100
const hp = 96 // 发量：暂时还在
const mp = 72 // 咖啡：下午就该续杯了

/* ── 进入视口触发：条填充 + 数字滚动 ── */
const cardEl = ref<HTMLElement | null>(null)
const ballRef = ref<InstanceType<typeof EmotionBall> | null>(null)
const active = ref(false)
let observer: IntersectionObserver | undefined

/* 证件照小球点击反馈：随机换表情 + 低概率撒花 */
const RANDOM_EMOTIONS = ['02', '03', '10', '11', '13', '14', '16', '19', '30', '32', '33', '35', '37', '40'] as const
function randomizeBall() {
  const emotion = RANDOM_EMOTIONS[(Math.random() * RANDOM_EMOTIONS.length) | 0]!
  ballRef.value?.setEmotion(emotion)
  if (Math.random() < 0.35) ballRef.value?.burst(8)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    active.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        active.value = true
        observer?.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  if (cardEl.value) observer.observe(cardEl.value)
})

onBeforeUnmount(() => observer?.disconnect())

const expDisplay = useCountUp(() => props.expCount, { active, duration: 1400 })
const hpDisplay = useCountUp(() => hp, { active, duration: 1100 })
const mpDisplay = useCountUp(() => mp, { active, duration: 1100 })
</script>

<template>
  <article ref="cardEl" class="status-card" :class="{ 'is-on': active }">
    <!-- 档案编号角标 -->
    <p class="status-card__tag" aria-hidden="true">SUBJECT FILE · 研究员档案</p>

    <!-- 左：证件照位 + 等级徽章 -->
    <div class="status-card__avatar">
      <span class="status-card__tape" aria-hidden="true" />
      <div class="status-card__photo" @click="randomizeBall">
        <!-- 证件照：随机表情/形状的小球（制图蓝），每次刷新换一张新证件照；点击换表情 -->
        <EmotionBall ref="ballRef" tone="draft" :size="124" label="研究员证件照：表情小球（点击换表情）" />
      </div>
      <span class="status-card__lv" aria-label="等级">{{ level }}">LV.{{ level }}</span>
    </div>

    <!-- 右：称号 + 状态条 -->
    <div class="status-card__body">
      <header class="status-card__head">
        <h3 class="status-card__name">STEWIE</h3>
        <p class="status-card__class">
          CLASS: 前端工程师 · 称号「{{ rankTitle }}」
        </p>
      </header>

      <ul class="status-card__bars">
        <li class="bar">
          <div class="bar__row">
            <span class="bar__label">HP<span class="bar__label-sub">发量</span></span>
            <span class="bar__value">{{ hpDisplay }}/{{ HP_MAX }}</span>
          </div>
          <div class="bar__track" aria-hidden="true">
            <span class="bar__fill bar__fill--hp" :style="{ '--bar-w': hp + '%' }" />
            <span class="bar__segments" />
          </div>
        </li>

        <li class="bar">
          <div class="bar__row">
            <span class="bar__label">MP<span class="bar__label-sub">咖啡</span></span>
            <span class="bar__value">{{ mpDisplay }}/{{ MP_MAX }}</span>
          </div>
          <div class="bar__track" aria-hidden="true">
            <span class="bar__fill bar__fill--mp" :style="{ '--bar-w': mp + '%' }" />
            <span class="bar__segments" />
          </div>
        </li>

        <li class="bar">
          <div class="bar__row">
            <span class="bar__label">EXP<span class="bar__label-sub">实验记录</span></span>
            <span class="bar__value">
              {{ expDisplay }} 条 <template v-if="expCount < 50">· 升级还差 {{ 10 - expInLevel }} 条</template><template v-else>· 已满级</template>
            </span>
          </div>
          <div class="bar__track" aria-hidden="true">
            <span class="bar__fill bar__fill--exp" :style="{ '--bar-w': expPct + '%' }" />
            <span class="bar__segments" />
          </div>
        </li>
      </ul>

      <p class="status-card__note">
        * 发量与咖啡为自测估值，实验记录由登记簿实时统计。
      </p>
    </div>
  </article>
</template>

<style scoped>
/* ── 档案卡：双线图框（呼应 Logo）+ 胶带贴 ── */
.status-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(24px, 4vw, 44px);
  padding: clamp(24px, 4vw, 40px) clamp(24px, 4vw, 44px);
  background: var(--color-surface);
  border: 1.5px solid color-mix(in srgb, var(--color-heading) 55%, transparent);
  border-radius: var(--radius-lg);
  outline: 1px dashed color-mix(in srgb, var(--color-heading) 22%, transparent);
  outline-offset: -7px;
  box-shadow: var(--shadow-md);
  flex-wrap: wrap;
}

.status-card__tag {
  position: absolute;
  top: 10px;
  right: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--color-text-tertiary);
}

/* ── 证件照位：虚线内框 + 胶带 ── */
.status-card__avatar {
  position: relative;
  flex-shrink: 0;
}

.status-card__photo {
  padding: 10px;
  border: 1.5px solid color-mix(in srgb, var(--color-heading) 45%, transparent);
  border-radius: var(--radius-md);
  background:
    repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, var(--color-primary) 5%, transparent) 0 10px,
      transparent 10px 20px
    ),
    var(--color-bg-soft);
  transition: transform 0.35s var(--ease-spring), cursor 0.2s ease;
  cursor: pointer; /* 点击换表情 */
}

.status-card__photo:hover {
  transform: rotate(-1.5deg) scale(1.02);
}

.status-card__tape {
  position: absolute;
  top: -9px;
  left: 50%;
  width: 54px;
  height: 16px;
  transform: translateX(-50%) rotate(-3deg);
  background: color-mix(in srgb, var(--sticker-lemon) 62%, #fff);
  border-left: 1px dashed color-mix(in srgb, var(--color-heading) 22%, transparent);
  border-right: 1px dashed color-mix(in srgb, var(--color-heading) 22%, transparent);
  opacity: 0.9;
  z-index: 2;
}

.status-card__lv {
  position: absolute;
  left: -10px;
  bottom: -10px;
  padding: 5px 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
  background: var(--color-primary);
  border: 2px solid #fff;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-primary);
  transform: rotate(-6deg);
}

/* ── 右侧信息 ── */
.status-card__body {
  flex: 1;
  min-width: 260px;
}

.status-card__name {
  font-family: var(--font-mono);
  font-size: clamp(1.2rem, 2.4vw, 1.5rem);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.status-card__class {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
}

.status-card__class::first-letter {
  color: var(--color-primary);
}

.status-card__bars {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 18px;
}

/* ── 游戏分段状态条 ── */
.bar__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.bar__label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-heading);
}

.bar__label-sub {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.bar__value {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.bar__track {
  position: relative;
  height: 15px;
  border: 1.5px solid color-mix(in srgb, var(--color-heading) 45%, transparent);
  border-radius: 3px;
  background: var(--color-bg-soft);
  overflow: hidden;
}

.bar__fill {
  display: block;
  height: 100%;
  width: 0;
  transition: width 1.1s var(--ease-out);
}

/* 条依次填充 */
.is-on .bar:nth-child(1) .bar__fill { transition-delay: 0.1s; }
.is-on .bar:nth-child(2) .bar__fill { transition-delay: 0.28s; }
.is-on .bar:nth-child(3) .bar__fill { transition-delay: 0.46s; }

.is-on .bar__fill {
  width: var(--bar-w);
}

.bar__fill--hp {
  background: linear-gradient(90deg, #3f9e6b, #8bd45f);
}

.bar__fill--mp {
  background: linear-gradient(90deg, #4f8fd0, #8b7ff0);
}

.bar__fill--exp {
  background: linear-gradient(90deg, var(--color-primary), #ffa14f);
}

/* 分段格线（10 格游戏感） */
.bar__segments {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0 calc(10% - 2px),
    color-mix(in srgb, var(--color-heading) 18%, transparent) calc(10% - 2px) 10%
  );
  pointer-events: none;
}

/* 微光扫过 */
.bar__fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
  transform: translateX(-100%);
}

.is-on .bar__fill::after {
  animation: bar-shine 1.6s ease-out;
  animation-delay: 0.9s;
}

@keyframes bar-shine {
  to { transform: translateX(100%); }
}

.status-card__note {
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .status-card {
    justify-content: center;
    text-align: center;
  }

  .status-card__bars {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar__fill {
    transition: none;
  }

  .is-on .bar__fill {
    width: var(--bar-w);
  }

  .is-on .bar__fill::after {
    animation: none;
    opacity: 0;
  }

  .status-card:hover .status-card__photo {
    transform: none;
  }
}
</style>
