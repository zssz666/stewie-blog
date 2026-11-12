<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'LabOscilloscope' })

const props = withDefaults(defineProps<{ label?: string; scanning?: boolean }>(), { label: 'OSC-1', scanning: false })
const canvasRef = ref<HTMLCanvasElement | null>(null)
const modeIndex = ref(0)
const modeNames = ['SIN', 'SQR', 'NOISE'] as const
const frequency = ref(1.9)
const amplitude = ref(72)
const paused = ref(false)
const reduced = ref(false)
let phase = 0
let raf = 0
let lastTime = 0
let inView = true
let observer: IntersectionObserver | undefined
let resizeObserver: ResizeObserver | undefined
let media: MediaQueryList | undefined

function sample(x: number): number {
  const signal = (x * frequency.value + phase) * Math.PI
  if (modeIndex.value === 1) return Math.sign(Math.sin(signal)) * 0.85
  // Deterministic harmonics keep a frozen noise signal stable between redraws.
  if (modeIndex.value === 2) return Math.sin(signal) * .65 + Math.sin(signal * 17.3) * .15 + Math.cos(signal * 31.7) * .1
  return Math.sin(signal)
}

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const w = canvas.width, h = canvas.height
  ctx.fillStyle = '#0b151b'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(222,233,236,.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < 8; i++) { ctx.moveTo(w * i / 8, 0); ctx.lineTo(w * i / 8, h) }
  for (let i = 1; i < 4; i++) { ctx.moveTo(0, h * i / 4); ctx.lineTo(w, h * i / 4) }
  ctx.stroke()
  ctx.strokeStyle = props.scanning ? '#ffcf4d' : '#3ee08f'
  ctx.lineWidth = Math.max(1.6, w / 220)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i <= 180; i++) {
    const x = w * i / 180
    const y = h / 2 - sample(i / 180) * (h * .4) * amplitude.value / 100
    if (!i) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function loop(time: number) {
  const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16
  lastTime = time
  phase += elapsed / 1000 * frequency.value * (props.scanning ? 6 : 1.4)
  draw()
  raf = requestAnimationFrame(loop)
}

function syncAnimation() {
  cancelAnimationFrame(raf)
  raf = 0
  lastTime = 0
  draw()
  if (inView && !document.hidden && !paused.value && !reduced.value) raf = requestAnimationFrame(loop)
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const r = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(r.width * dpr))
  canvas.height = Math.max(1, Math.round(r.height * dpr))
  draw()
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || reduced.value || paused.value) return
  const r = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null
  if (!r) return
  frequency.value = Math.round((.5 + Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)) * 3.5) * 10) / 10
  amplitude.value = Math.round(20 + (1 - Math.min(1, Math.max(0, (event.clientY - r.top) / r.height))) * 70)
}

function nextMode() { modeIndex.value = (modeIndex.value + 1) % modeNames.length }
function onMotionChange() { reduced.value = media?.matches ?? false; syncAnimation() }

watch([frequency, amplitude, modeIndex, () => props.scanning], draw)
watch(paused, syncAnimation)
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = media.matches
  media.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', syncAnimation)
  resizeCanvas()
  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvasRef.value)
  } else window.addEventListener('resize', resizeCanvas)
  if (typeof IntersectionObserver !== 'undefined' && canvasRef.value) {
    observer = new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); syncAnimation() })
    observer.observe(canvasRef.value)
  }
  syncAnimation()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  resizeObserver?.disconnect()
  media?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', syncAnimation)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <figure class="osc" :class="{ 'osc--scanning': scanning }" aria-label="可操作的示波器">
    <button class="osc__screen" type="button" aria-label="点击切换下一种波形" @click="nextMode" @pointermove="onPointerMove">
      <canvas ref="canvasRef" class="osc__canvas" aria-hidden="true" />
      <span class="osc__readout">{{ modeNames[modeIndex] }} · {{ Number(frequency).toFixed(1) }} Hz</span>
      <span class="osc__status">{{ scanning ? '正在寻找下一次实验' : reduced ? '静态信号' : paused ? '信号已冻结' : '移动鼠标或调节滑杆' }}</span>
    </button>
    <figcaption class="osc__panel">
      <span class="osc__label">{{ props.label }}</span>
      <div class="osc__mode-group" aria-label="信号波形">
        <button v-for="(name, i) in modeNames" :key="name" class="osc__mode" :class="{ 'osc__mode--on': i === modeIndex }" type="button" :aria-label="`切换到 ${name} 波形`" :aria-pressed="i === modeIndex" @click="modeIndex = i">{{ name }}</button>
      </div>
      <button class="osc__pause" type="button" :aria-label="paused ? '继续波形' : '冻结波形'" :aria-pressed="paused" @click="paused = !paused">
        <span class="osc__switch" aria-hidden="true" />
        <span aria-hidden="true">{{ paused ? '继续' : '冻结' }}</span>
      </button>
    </figcaption>
    <div class="osc__controls">
      <label class="osc__control"><span>频率 <output>{{ Number(frequency).toFixed(1) }} Hz</output></span><input v-model.number="frequency" type="range" min="0.5" max="4" step="0.1" aria-label="信号频率" /></label>
      <label class="osc__control"><span>振幅 <output>{{ amplitude }}%</output></span><input v-model.number="amplitude" type="range" min="20" max="90" step="1" aria-label="信号振幅" /></label>
    </div>
  </figure>
</template>

<style scoped>
.osc { width: 100%; margin: 0; background: var(--color-surface); border-radius: var(--radius-md); overflow: clip; }
.osc__screen { position: relative; display: block; width: 100%; padding: 0; text-align: left; background: #0b151b; cursor: crosshair; }
.osc__canvas { display: block; width: 100%; height: 140px; }
.osc__readout, .osc__status { position: absolute; pointer-events: none; color: #8bf0ba; font-family: var(--font-sans); font-size: 13px; }
.osc__readout { top: 10px; right: 12px; font-variant-numeric: tabular-nums; }
.osc__status { left: 12px; bottom: 8px; color: #b8c9d0; font-size: 13px; }
.osc__panel { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 8px 12px 0; }
.osc__label { font-family: var(--font-sans); font-size: 13px; color: var(--color-text-secondary); margin-right: auto; }
.osc__mode-group { display: flex; gap: 2px; }
.osc__mode, .osc__pause { min-width: 40px; min-height: 44px; padding: 7px; background: var(--color-bg-soft); color: var(--color-text-secondary); border-radius: var(--radius-sm); font-family: var(--font-sans); font-size: 13px; transition: background-color 180ms ease, color 180ms ease, transform 140ms var(--ease-out); }
.osc__mode--on { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 700; }
.osc__pause { display: inline-flex; align-items: center; gap: 6px; margin-left: 4px; }
.osc__switch {
  display: grid;
  place-items: center;
  width: 17px;
  height: 21px;
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
}
.osc__switch::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  transform: translateY(-3px);
  transition: transform 140ms var(--ease-out);
}
.osc__pause[aria-pressed='true'] .osc__switch::before { transform: translateY(3px); background: var(--color-primary); }
.osc__mode:active, .osc__pause:active { transform: scale(.96); }
.osc button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -3px; }
.osc__controls { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 12px 16px; }
.osc__control { min-width: 0; color: var(--color-text-secondary); font-size: 13px; }
.osc__control > span { display: flex; justify-content: space-between; gap: 8px; }
.osc__control output { color: var(--color-heading); font-variant-numeric: tabular-nums; }
.osc__control input { display: block; width: 100%; height: 32px; padding: 0; cursor: ew-resize; accent-color: var(--color-primary); }
.osc__control input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) { .osc__mode:hover, .osc__pause:hover { color: var(--color-primary); background: var(--color-primary-soft); } }
@media (prefers-reduced-motion: reduce) { .osc__mode, .osc__pause, .osc__switch::before { transition: none; } .osc__mode:active, .osc__pause:active { transform: none; } }
</style>
