<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Oscilloscope —— Stewie 实验室的示波器装置（签名交互元素）。
 *
 * 交互：
 *  - 鼠标在页面上横向移动 → 调节信号频率（像拧 FREQ 旋钮）
 *  - 纵向移动 → 调节信号振幅（像拧 AMPL 旋钮）
 *  - 点击面板 → 循环切换波形：正弦 SIN → 方波 SQR → 叠加噪声 NOISE
 *
 * 无障碍：prefers-reduced-motion 时绘制静态波形，不启动动画循环。
 * 屏幕颜色是仪器物理属性（荧光屏），不随站点主题切换。
 */
const props = withDefaults(
  defineProps<{
    /** 面板铭牌文字 */
    label?: string
  }>(),
  { label: 'OSC-1' },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const modeIndex = ref(0)
const modeNames = ['SIN', 'SQR', 'NOISE'] as const

/* 屏幕物理色（不随主题变） */
const SCREEN_BG = '#0b151b'
const TRACE = '#3ee08f'
const TRACE_GLOW = 'rgba(62, 224, 143, 0.25)'
const GRID = 'rgba(222, 233, 236, 0.07)'
const GRID_CENTER = 'rgba(222, 233, 236, 0.16)'

/* 波形参数（鼠标驱动的目标值 + 平滑插值的当前值） */
let targetFreq = 1
let targetAmp = 0.72
let freq = 1
let amp = 0.72
let phase = 0

/* 鼠标位置（归一化 0~1），rAF 内消费 */
let pointerNX = 0.5
let pointerNY = 0.4

let raf = 0
let running = false

function sample(x: number): number {
  const t = x * freq + phase
  switch (modeIndex.value) {
    case 1: {
      // 方波：占空比 50%
      return Math.sign(Math.sin(t * Math.PI)) * 0.85
    }
    case 2: {
      // 噪声叠加：主频 + 抖动，像接触不良的探头
      return Math.sin(t * Math.PI) * 0.7 + (Math.random() - 0.5) * 0.35
    }
    default:
      return Math.sin(t * Math.PI)
  }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const mid = h / 2

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = SCREEN_BG
  ctx.fillRect(0, 0, w, h)

  /* 屏幕刻度网格：竖 8 格 / 横 4 格 + 中轴线 */
  ctx.strokeStyle = GRID
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < 8; i++) {
    const x = Math.round((w / 8) * i) + 0.5
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
  }
  for (let i = 1; i < 4; i++) {
    const y = Math.round((h / 4) * i) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()
  ctx.strokeStyle = GRID_CENTER
  ctx.beginPath()
  ctx.moveTo(0, mid + 0.5)
  ctx.lineTo(w, mid + 0.5)
  ctx.stroke()

  /* 波形轨迹：辉光层 + 主线层 */
  const drawTrace = (width: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    const steps = 96
    for (let i = 0; i <= steps; i++) {
      const x = (w / steps) * i
      const y = mid - sample(i / steps) * (mid * 0.78) * amp
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  drawTrace(4, TRACE_GLOW)
  drawTrace(1.6, TRACE)
}

function loop() {
  if (!running) return
  /* 鼠标 → 目标参数，参数平滑逼近（模拟旋钮阻尼） */
  targetFreq = 0.6 + pointerNX * 2.6
  targetAmp = 0.28 + (1 - pointerNY) * 0.68
  freq += (targetFreq - freq) * 0.06
  amp += (targetAmp - amp) * 0.06
  phase += 0.045 * freq

  draw()
  raf = requestAnimationFrame(loop)
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  draw()
}

function onPointerMove(e: MouseEvent) {
  pointerNX = Math.min(1, Math.max(0, e.clientX / window.innerWidth))
  pointerNY = Math.min(1, Math.max(0, e.clientY / window.innerHeight))
}

function nextMode() {
  modeIndex.value = (modeIndex.value + 1) % modeNames.length
  if (!running) draw()
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resizeCanvas()
  if (!reduced) {
    running = true
    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('resize', resizeCanvas)
    raf = requestAnimationFrame(loop)
  }
})

onBeforeUnmount(() => {
  running = false
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <figure class="osc" :title="`波形模式：${modeNames[modeIndex]}（点击切换）`">
    <div class="osc__screen">
      <canvas ref="canvasRef" class="osc__canvas" aria-label="示波器波形演示" />
      <span class="osc__readout">{{ modeNames[modeIndex] }} · {{ (0.6 + pointerNX * 2.6).toFixed(1) }}Hz</span>
    </div>
    <figcaption class="osc__panel">
      <span class="osc__label">{{ props.label }}</span>
      <span class="osc__mode-group">
        <button
          v-for="(name, i) in modeNames"
          :key="name"
          class="osc__mode"
          :class="{ 'osc__mode--on': i === modeIndex }"
          type="button"
          :aria-label="`切换到 ${name} 波形`"
          @click="modeIndex = i"
        >
          {{ name }}
        </button>
      </span>
      <span class="osc__led" :class="{ 'osc__led--on': true }" aria-hidden="true" />
    </figcaption>
  </figure>
</template>

<style scoped>
.osc {
  width: min(300px, 100%);
  user-select: none;
  cursor: pointer;
}

.osc__screen {
  position: relative;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-md), inset 0 0 0 1px rgba(222, 233, 236, 0.04);
}

.osc__canvas {
  display: block;
  width: 100%;
  height: 132px;
}

/* 屏幕右上角的读数（等宽，像真机 OSD） */
.osc__readout {
  position: absolute;
  top: 8px;
  right: 10px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: rgba(62, 224, 143, 0.85);
  text-shadow: 0 0 8px rgba(62, 224, 143, 0.5);
  pointer-events: none;
}

/* 仪器面板：铭牌 + 模式键 + 电源灯 */
.osc__panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: var(--color-surface);
}

.osc__label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}

.osc__mode-group {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.osc__mode {
  padding: 2px 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.osc__mode:hover {
  color: var(--color-heading);
  border-color: var(--color-border-strong);
}

.osc__mode--on {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background: var(--color-primary-soft);
}

.osc__led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--fix-green);
  box-shadow: 0 0 6px var(--fix-green);
  flex-shrink: 0;
}

.osc:focus-within {
  outline: none;
}

.osc__mode:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .osc {
    cursor: default;
  }
}
</style>
