import { onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

interface CountUpOptions {
  /** 动画时长 ms，默认 1200 */
  duration?: number
  /** 激活信号：true 时才开始（配合 IntersectionObserver 进入视口触发），默认立即 */
  active?: Ref<boolean>
  /** 缓动，默认 easeOutCubic */
  easing?: (p: number) => number
}

const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3)

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 数字滚动动画：target 变化或 active 置真后，display 从当前值缓动到目标值。
 * target 支持 ref 或 getter；prefers-reduced-motion 时直接落定，不做动画。
 */
export function useCountUp(
  target: MaybeRefOrGetter<number>,
  options: CountUpOptions = {},
) {
  const { duration = 1200, active, easing = easeOutCubic } = options

  const display = ref(0)
  let rafId = 0

  function cancel() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function animateTo(from: number, to: number) {
    cancel()
    if (from === to) {
      display.value = to
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      display.value = Math.round(from + (to - from) * easing(p))
      if (p < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = 0
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  function sync() {
    const to = toValue(target)
    if (typeof to !== 'number' || Number.isNaN(to)) {
      display.value = 0
      return
    }
    if (active && !active.value) return // 等待激活信号
    if (prefersReducedMotion()) {
      display.value = to
      return
    }
    animateTo(display.value, to)
  }

  watch(() => toValue(target), sync)
  if (active) {
    watch(active, (on) => {
      if (on) sync()
    })
  }
  sync()

  onBeforeUnmount(cancel)

  return display
}
