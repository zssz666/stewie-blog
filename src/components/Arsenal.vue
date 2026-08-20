<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 装备库 ARSENAL —— 技术栈的游戏化陈列
 * 每件装备 = 一门技术：图标 + 稀有度 + 熟练度（进入视口时填充）。
 */
interface Gear {
  name: string
  model: string
  rarity: 'SSR' | 'SR' | 'R'
  mastery: number
}

const gears: Gear[] = [
  { name: 'Vue 3', model: '渐进式框架 · 本命武器', rarity: 'SSR', mastery: 92 },
  { name: 'TypeScript', model: '类型安全结界 · 附魔', rarity: 'SSR', mastery: 88 },
  { name: 'CSS', model: '像素级复原术', rarity: 'SR', mastery: 90 },
  { name: 'Vite', model: '极速构建引擎', rarity: 'SR', mastery: 85 },
  { name: 'Node.js', model: '服务端轻甲', rarity: 'R', mastery: 72 },
  { name: 'Spring Boot', model: '后端重装支援', rarity: 'R', mastery: 68 },
]

/* 进入视口：熟练度条填充 */
const rootEl = ref<HTMLElement | null>(null)
const active = ref(false)
let observer: IntersectionObserver | undefined

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
    { threshold: 0.2 },
  )
  if (rootEl.value) observer.observe(rootEl.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="rootEl" class="arsenal" :class="{ 'is-on': active }">
    <article
      v-for="(gear, i) in gears"
      :key="gear.name"
      class="gear"
      :class="[`gear--${gear.rarity.toLowerCase()}`, { 'is-on': active }]"
      :style="{ '--gear-i': i, '--bar-w': gear.mastery + '%' }"
    >
      <span class="gear__rarity" :class="`gear__rarity--${gear.rarity.toLowerCase()}`">
        {{ gear.rarity }}
      </span>

      <div class="gear__icon" aria-hidden="true">
        <!-- Vue 3：嵌套双三角 -->
        <svg v-if="gear.name === 'Vue 3'" viewBox="0 0 60 60">
          <path d="M30,54 L4,10 L18,10 L30,30 L42,10 L56,10 Z" fill="#35495e" />
          <path d="M30,42 L18,18 L24,18 L30,28 L36,18 L42,18 Z" fill="#42b883" />
        </svg>
        <!-- TypeScript：方盾 + TS -->
        <svg v-else-if="gear.name === 'TypeScript'" viewBox="0 0 60 60">
          <rect x="6" y="6" width="48" height="48" rx="8" fill="#3178c6" />
          <text x="30" y="41" text-anchor="middle" font-size="22" font-weight="700"
            fill="#ffffff" font-family="IBM Plex Mono, Consolas, monospace">TS</text>
        </svg>
        <!-- CSS：画笔 -->
        <svg v-else-if="gear.name === 'CSS'" viewBox="0 0 60 60">
          <g transform="rotate(45 30 30)">
            <rect x="26" y="4" width="8" height="30" rx="3" fill="#8a97a0" stroke="#5e6e76" stroke-width="1.5" />
            <rect x="24" y="32" width="12" height="5" rx="1.5" fill="#5e6e76" />
            <path d="M24,37 L36,37 L30,54 Z" fill="#e0561d" stroke="#c24511" stroke-width="1.5" stroke-linejoin="round" />
          </g>
          <path d="M12,10 L18,16 M50,48 L44,42" stroke="#ffcf4d" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <!-- Vite：闪电 -->
        <svg v-else-if="gear.name === 'Vite'" viewBox="0 0 60 60">
          <path d="M34,4 L12,34 L26,34 L22,56 L48,22 L32,22 Z"
            fill="#ffd62e" stroke="#eab308" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
        <!-- Node.js：六边形 -->
        <svg v-else-if="gear.name === 'Node.js'" viewBox="0 0 60 60">
          <polygon points="30,6 50,17 50,43 30,54 10,43 10,17" fill="#83cd29" />
          <text x="30" y="38" text-anchor="middle" font-size="17" font-weight="700"
            fill="#ffffff" font-family="IBM Plex Mono, Consolas, monospace">JS</text>
        </svg>
        <!-- Spring Boot：叶子 -->
        <svg v-else viewBox="0 0 60 60">
          <path d="M30,54 C12,50 8,30 14,10 C36,14 52,28 48,44 C45,53 36,55 30,54 Z"
            fill="#6db33f" stroke="#4e8a2e" stroke-width="1.5" />
          <path d="M16,12 C24,26 32,38 44,44" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.85" />
        </svg>
      </div>

      <h3 class="gear__name">{{ gear.name }}</h3>
      <p class="gear__model">{{ gear.model }}</p>

      <div class="gear__mastery" aria-hidden="true">
        <div class="gear__mastery-head">
          <span class="gear__mastery-label">熟练度</span>
          <span class="gear__mastery-value">{{ gear.mastery }}%</span>
        </div>
        <div class="gear__bar">
          <span class="gear__bar-fill" />
          <span class="gear__bar-segments" />
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.arsenal {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* ── 装备卡 ── */
.gear {
  position: relative;
  padding: 26px 20px 20px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
  transition:
    transform 0.35s var(--ease-spring),
    box-shadow 0.35s var(--ease),
    border-color 0.35s var(--ease);
}

.gear:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

/* 稀有度边框光 */
.gear--ssr { border-color: color-mix(in srgb, #e8a33d 55%, transparent); }
.gear--ssr:hover { border-color: #e8a33d; }
.gear--sr:hover { border-color: var(--sticker-violet); }
.gear--r:hover { border-color: var(--sticker-sky); }

/* 稀有度角标（挂口沿） */
.gear__rarity {
  position: absolute;
  top: 0;
  right: 16px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 2px 5px rgba(29, 42, 50, 0.2);
}

.gear__rarity--ssr { background: linear-gradient(135deg, #e8a33d, #ffcf4d); }
.gear__rarity--sr { background: linear-gradient(135deg, #8f6fe0, #b79cf0); }
.gear__rarity--r { background: linear-gradient(135deg, #4f8fd0, #7cc4ee); }

/* ── 图标 ── */
.gear__icon {
  width: 58px;
  height: 58px;
  margin-bottom: 14px;
  padding: 9px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: transform 0.4s var(--ease-spring);
}

.gear__icon svg {
  width: 100%;
  height: 100%;
}

.gear:hover .gear__icon {
  transform: rotate(-6deg) scale(1.08);
}

/* SSR 扫光 */
.gear--ssr::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 223, 130, 0.35) 50%, transparent 65%);
  transform: translateX(-110%);
  pointer-events: none;
}

.gear--ssr:hover::after {
  animation: gear-shine 0.9s ease-out;
}

@keyframes gear-shine {
  to { transform: translateX(110%); }
}

/* ── 名称/型号 ── */
.gear__name {
  font-family: var(--font-mono);
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.gear__model {
  margin: 3px 0 14px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

/* ── 熟练度条 ── */
.gear__mastery-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.gear__mastery-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-text-tertiary);
}

.gear__mastery-value {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
}

.gear__bar {
  position: relative;
  height: 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 3px;
  background: var(--color-bg-soft);
  overflow: hidden;
}

.gear__bar-fill {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--color-primary), #ffa14f);
  transition: width 0.9s var(--ease-out);
  transition-delay: calc(0.1s + var(--gear-i) * 0.09s);
}

.is-on .gear__bar-fill {
  width: var(--bar-w);
}

.gear__bar-segments {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0 calc(12.5% - 2px),
    color-mix(in srgb, var(--color-heading) 16%, transparent) calc(12.5% - 2px) 12.5%
  );
  pointer-events: none;
}

@media (max-width: 900px) {
  .arsenal {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .arsenal {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gear,
  .gear:hover,
  .gear:hover .gear__icon {
    transform: none;
  }

  .gear__bar-fill {
    transition: none;
  }

  .is-on .gear__bar-fill {
    width: var(--bar-w);
  }

  .gear--ssr:hover::after {
    animation: none;
  }
}
</style>
