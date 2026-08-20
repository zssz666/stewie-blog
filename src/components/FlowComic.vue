<script setup lang="ts">
import { ref } from 'vue'
import EmotionBall from './EmotionBall.vue'

/**
 * 实验四格漫画 —— 方法论的可视化
 * 假设 → 复现 → 修复 → 沉淀，每格一个表情小球小剧场 + 拟声词贴纸。
 * 四格固定同一形状（blob 圆胖）+ 按剧情锁定的表情与语义色板，不随刷新随机。
 * 点击彩蛋：表情保持剧情锁定不变，触发自旋/撒花动效反馈。
 */
const ballRefs = [
  ref<InstanceType<typeof EmotionBall> | null>(null),
  ref<InstanceType<typeof EmotionBall> | null>(null),
  ref<InstanceType<typeof EmotionBall> | null>(null),
  ref<InstanceType<typeof EmotionBall> | null>(null),
]

function poke(i: number) {
  const ball = ballRefs[i]!.value
  if (!ball) return
  ball.spin(1)
  if (Math.random() < 0.35) ball.burst(8)
}
</script>

<template>
  <div class="comic-strip">
    <!-- CASE 01 · 假设 -->
    <article class="comic" :style="{ '--tilt': '-1deg', '--sfx-deg': '6deg' }">
      <span class="comic__case" aria-hidden="true">CASE 01</span>
      <span class="comic__sfx comic__sfx--sky" aria-hidden="true">嗯…?</span>
      <div class="comic__scene" @click="poke(0)">
        <EmotionBall :ref="ballRefs[0]" emotion="30" shape="blob" tone="fix" :size="100" label="思考中的表情小球（点击有动效）" />
        <svg class="comic__props" viewBox="0 0 70 70" aria-hidden="true">
          <!-- 思考气泡三连 -->
          <circle cx="16" cy="14" r="3" fill="#cfdbe0" />
          <circle cx="24" cy="8" r="4.5" fill="#cfdbe0" />
          <circle cx="34" cy="4" r="6.5" fill="#e8eff2" />
          <text x="30" y="22" font-size="22" font-weight="700" fill="#5aa9d6"
            font-family="'LXGW WenKai', 'Kaiti SC', 'KaiTi', serif">?</text>
        </svg>
      </div>
      <h3 class="comic__step">假设</h3>
      <p class="comic__desc">先猜一猜：问题出在哪一环？</p>
    </article>

    <!-- CASE 02 · 复现 -->
    <article class="comic" :style="{ '--tilt': '1deg', '--sfx-deg': '-5deg' }">
      <span class="comic__case" aria-hidden="true">CASE 02</span>
      <span class="comic__sfx comic__sfx--lemon" aria-hidden="true">BOOM!</span>
      <div class="comic__scene" @click="poke(1)">
        <EmotionBall :ref="ballRefs[1]" emotion="34" shape="blob" tone="hazard" :size="100" label="被实验爆炸吓到的表情小球（点击有动效）" />
        <svg class="comic__props" viewBox="0 0 70 70" aria-hidden="true">
          <!-- 双层爆炸云 -->
          <polygon
            points="58,30 44.5,33.9 54.2,44 40.6,40.6 44,54.2 33.9,44.5 30,58 26.1,44.5 16,54.2 19.4,40.6 5.8,44 15.5,33.9 2,30 15.5,26.1 5.8,16 19.4,19.4 16,5.8 26.1,15.5 30,2 33.9,15.5 44,5.8 40.6,19.4 54.2,16 44.5,26.1"
            fill="#ff8a3d"
          />
          <polygon
            points="47,30 40.7,32 45.6,37 39.3,39.3 41.6,45.6 35.9,41.9 30,47 34.5,44.8 35.5,41.5 32.4,40.5 34.6,35.7 30,31.6 25.4,40.5 27.7,43 23,41 19,35 21,29.7 25,32.6 26.9,27.1 30,19 33.1,27.1 38,24.9 41,27 44.8,28.8 43.3,25.5 45,23 40,25.3 41.3,28.2"
            fill="#ffcf4d"
            transform="translate(0 0) scale(0.78) translate(4 4)"
            opacity="0.95"
          />
          <!-- 冲击短线 -->
          <path d="M4,12 L10,16 M62,58 L56,54 M60,8 L54,12" stroke="#ff8a3d" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </div>
      <h3 class="comic__step">复现</h3>
      <p class="comic__desc">稳定复现的坑才算数，保留现场。</p>
    </article>

    <!-- CASE 03 · 修复 -->
    <article class="comic" :style="{ '--tilt': '-1deg', '--sfx-deg': '5deg' }">
      <span class="comic__case" aria-hidden="true">CASE 03</span>
      <span class="comic__sfx comic__sfx--mint" aria-hidden="true">咔嚓!</span>
      <div class="comic__scene" @click="poke(2)">
        <EmotionBall :ref="ballRefs[2]" emotion="32" shape="blob" tone="draft" :size="100" label="专注修复的表情小球（点击有动效）" />
        <svg class="comic__props" viewBox="0 0 70 70" aria-hidden="true">
          <!-- 扳手（旋转 45°）+ 火花 -->
          <g transform="rotate(45 30 30)">
            <circle cx="12" cy="12" r="10" fill="#8a97a0" stroke="#5e6e76" stroke-width="2" />
            <rect x="3" y="8.5" width="8" height="7" rx="1" fill="#ffffff" transform="rotate(20 12 12)" />
            <rect x="18" y="9" width="28" height="6" rx="3" fill="#8a97a0" stroke="#5e6e76" stroke-width="1.5" />
          </g>
          <path d="M52,14 L58,8 M56,26 L64,24 M46,6 L48,0" stroke="#e0561d" stroke-width="2.5" stroke-linecap="round" />
          <path d="M8,54 L14,50 M4,40 L0,38" stroke="#ffcf4d" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </div>
      <h3 class="comic__step">修复</h3>
      <p class="comic__desc">定位根因动手修，顺手补个测试。</p>
    </article>

    <!-- CASE 04 · 沉淀 -->
    <article class="comic" :style="{ '--tilt': '1deg', '--sfx-deg': '-6deg' }">
      <span class="comic__case" aria-hidden="true">CASE 04</span>
      <span class="comic__sfx comic__sfx--pink" aria-hidden="true">叮!</span>
      <div class="comic__scene" @click="poke(3)">
        <EmotionBall :ref="ballRefs[3]" emotion="33" shape="blob" tone="fix" :size="100" label="实验归档成功的表情小球（带撒花，点击有动效）" />
        <svg class="comic__props" viewBox="0 0 70 70" aria-hidden="true">
          <!-- 登记簿小本 + 对勾 -->
          <rect x="14" y="16" width="34" height="36" rx="3" fill="#ffffff" stroke="#5e6e76" stroke-width="2" />
          <line x1="22" y1="18" x2="22" y2="50" stroke="#cfdbe0" stroke-width="2" />
          <path d="M28,36 l5,6 l11,-13" fill="none" stroke="#22795a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
          <!-- 小星星 -->
          <path d="M52,12 l1.4,3.2 l3.2,1.4 l-3.2,1.4 l-1.4,3.2 l-1.4,-3.2 l-3.2,-1.4 l3.2,-1.4 Z" fill="#ffcf4d" />
          <circle cx="60" cy="30" r="2" fill="#ffcf4d" />
        </svg>
      </div>
      <h3 class="comic__step">沉淀</h3>
      <p class="comic__desc">登记归档成 EXP，下次秒查。</p>
    </article>
  </div>
</template>

<style scoped>
.comic-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

/* ── 漫画格：白底粗框，微倾贴放 ── */
.comic {
  position: relative;
  padding: 22px 18px 18px;
  background: var(--color-surface);
  border: 2px solid color-mix(in srgb, var(--color-heading) 75%, transparent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transform: rotate(var(--tilt));
  transition:
    transform 0.35s var(--ease-spring),
    box-shadow 0.35s var(--ease);
}

.comic:hover {
  transform: rotate(0deg) translateY(-6px);
  box-shadow: var(--shadow-lg);
}

/* CASE 编号：mono 角标 */
.comic__case {
  position: absolute;
  top: 10px;
  left: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--color-text-tertiary);
}

/* 拟声词贴纸：糖果色胶囊 + 内白描边 */
.comic__sfx {
  position: absolute;
  top: 12px;
  right: 10px;
  padding: 3px 11px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  line-height: 1.5;
  color: #fff;
  border-radius: var(--radius-full);
  transform: rotate(var(--sfx-deg));
  box-shadow:
    0 2px 8px rgba(29, 42, 50, 0.18),
    inset 0 0 0 2px #fff;
  z-index: 2;
}

.comic__sfx--sky { background: var(--sticker-sky); }
.comic__sfx--lemon { background: #ff9a3b; }
.comic__sfx--mint { background: var(--sticker-mint); }
.comic__sfx--pink { background: var(--sticker-pink); }

.comic:hover .comic__sfx {
  animation: sfx-wiggle 0.5s var(--ease);
}

@keyframes sfx-wiggle {
  0%, 100% { transform: rotate(var(--sfx-deg)); }
  30% { transform: rotate(calc(var(--sfx-deg) + 8deg)) scale(1.08); }
  60% { transform: rotate(calc(var(--sfx-deg) - 4deg)); }
}

/* 场景：吉祥物 + 道具（点击有彩蛋动效） */
.comic__scene {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 128px;
  margin: 14px 0 10px;
  padding-top: 6px;
  cursor: pointer;
}

.comic__scene .emotion-ball {
  transition: transform 0.35s var(--ease-spring);
}

.comic:hover .emotion-ball {
  transform: translateY(-4px);
}

.comic__props {
  position: absolute;
  top: 0;
  right: 0;
  width: 66px;
  height: 66px;
}

/* 步骤名 + 说明 */
.comic__step {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
}

.comic__step::after {
  content: '';
  display: block;
  width: 26px;
  height: 3px;
  margin: 6px auto 8px;
  border-radius: 2px;
  background: var(--color-primary);
}

.comic__desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 1024px) {
  .comic-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
}

@media (max-width: 560px) {
  .comic-strip {
    grid-template-columns: 1fr;
  }

  .comic {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .comic,
  .comic:hover {
    transform: none;
  }

  .comic:hover .comic__sfx {
    animation: none;
  }

  .comic:hover .emotion-ball {
    transform: none;
  }
}
</style>
