<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { EmotionBallEngine } from '@/types/emotion-ball'

/**
 * 表情小球 —— emotion-ball 库的 Vue 封装
 *
 * - emotion / shape 不传时随机抽取（每次页面加载刷新随机结果）
 * - 体色取主题色板（tone → CSS 变量），深浅主题切换自动跟色
 * - gaze 开启后小球注视跟随鼠标（含蓄小幅，引擎内部指数平滑）
 * - 父组件可通过 ref 调 setEmotion / spin / burst 做联动交互
 * - shape prop 变化 → 销毁并重建引擎实例（形状在 create 时定死，无运行时换形 API）
 */
interface Props {
  /** 表情 ID（'00'~'41'，如 '30' 思考中 / '34' 出错 / '33' 任务完成）；不传则随机 */
  emotion?: string
  /** 身体形状；不传则随机 */
  shape?: 'blob' | 'wedge' | 'gem'
  /** 渲染尺寸（正方形边长 px） */
  size?: number
  /** 主题色板：hazard 安全橙 / draft 制图蓝 / fix 实验绿 */
  tone?: 'hazard' | 'draft' | 'fix'
  /** 鼠标注视跟随 */
  gaze?: boolean
  /** 无障碍名称 */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  emotion: undefined,
  shape: undefined,
  size: 120,
  tone: 'draft',
  gaze: false,
  label: '表情小球',
})

/* 随机池：剔除睡眠/休眠等低活力态，保留情绪 + 代理状态的代表作 */
const RANDOM_EMOTIONS = [
  '02', '03', '10', '11', '13', '14', '16', '19',
  '30', '32', '33', '35', '37', '40',
] as const
const RANDOM_SHAPES = ['blob', 'wedge', 'gem'] as const

/* 随机结果在 setup 阶段定死，组件生命周期内保持稳定 */
const initialEmotion = props.emotion ?? RANDOM_EMOTIONS[(Math.random() * RANDOM_EMOTIONS.length) | 0]!
const initialShape = props.shape ?? RANDOM_SHAPES[(Math.random() * RANDOM_SHAPES.length) | 0]!

/* 当前表情/形状跟踪：引擎无 getter，shape 重建时用它恢复显示状态 */
let currentEmotion = initialEmotion
let currentShape = initialShape

/* tone → 主题 CSS 变量 */
const TONE_VAR: Record<NonNullable<Props['tone']>, string> = {
  hazard: '--hazard',
  draft: '--draft-blue',
  fix: '--fix-green',
}

const rootEl = ref<HTMLElement | null>(null)
const themeStore = useThemeStore()
let engine: EmotionBallEngine | null = null

/** 从根元素读取当前主题下的色板值 */
function toneColor(): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(TONE_VAR[props.tone])
    .trim()
  return v || '#33687f'
}

onMounted(() => {
  const EB = window.EmotionBall
  if (!EB || !rootEl.value) return
  engine = EB.create(rootEl.value, {
    emotion: currentEmotion,
    shape: currentShape,
    color: toneColor(),
    label: props.label,
  })
})

onBeforeUnmount(() => {
  engine?.destroy()
  engine = null
  document.removeEventListener('mousemove', onMouseMove)
})

/* 主题切换：CSS 变量已换值，直接改实例主题色（免重建，不闪不丢状态） */
watch(
  () => themeStore.isDark,
  () => {
    if (engine) engine._theme = { body: toneColor(), eyes: '#FFFFFF' }
  },
)

/* 表情切换统一入口：同步跟踪当前值（供 shape 重建时恢复） */
function applyEmotion(id: string) {
  currentEmotion = id
  engine?.setEmotion(id)
}

/* 表情 prop 变化 → 切换表情（父组件也可走 ref.setEmotion） */
watch(
  () => props.emotion,
  (id) => {
    if (id) applyEmotion(id)
  },
)

/* 形状 prop 变化 → 销毁重建引擎（destroy 会移除 SVG，容器可复用）
   重建时用 currentEmotion 恢复表情，gaze 由持续的 mousemove 自动接管 */
watch(
  () => props.shape,
  (s) => {
    if (!s || s === currentShape) return
    const EB = window.EmotionBall
    if (!EB || !rootEl.value) return
    currentShape = s
    engine?.destroy()
    engine = EB.create(rootEl.value, {
      emotion: currentEmotion,
      shape: s,
      color: toneColor(),
      label: props.label,
    })
  },
)

/* ── 鼠标注视：document 级监听，坐标归一化到 ±1（球心为原点） ── */
function onMouseMove(e: MouseEvent) {
  if (!engine || !rootEl.value) return
  const r = rootEl.value.getBoundingClientRect()
  const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
  const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
  engine.setGaze(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny)))
}
watch(
  () => props.gaze,
  (on) => {
    if (on) document.addEventListener('mousemove', onMouseMove, { passive: true })
    else {
      document.removeEventListener('mousemove', onMouseMove)
      engine?.clearGaze()
    }
  },
  { immediate: true },
)

/* 对外暴露：切表情 / 自旋甩彩带 / 撒花 */
defineExpose({
  setEmotion: applyEmotion,
  spin: (turns?: number) => engine?.spin(turns),
  burst: (count?: number) => engine?.burst(count),
})
</script>

<template>
  <div
    ref="rootEl"
    class="emotion-ball"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="label"
  />
</template>

<style scoped>
.emotion-ball {
  display: inline-block;
  flex: none;
}
</style>
