import type { Directive, DirectiveBinding } from 'vue'

export interface RevealOptions {
  /** 入场延迟（毫秒），用于列表错峰 */
  delay?: number
  /** 触发阈值，0~1 */
  threshold?: number
  /** 元素离场后是否重新触发（默认 true，即只触发一次） */
  once?: boolean
  /** IntersectionObserver 的 rootMargin，默认略微提前触发 */
  rootMargin?: string
}

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const observerMap = new WeakMap<HTMLElement, IntersectionObserver>()

/**
 * v-reveal 指令：元素进入视口时播放入场动画。
 *
 * 用法：
 *   v-reveal                      从下方淡入（默认）
 *   v-reveal.up / .down / .left / .right / .zoom / .fade   指定方向
 *   v-reveal="120"                延迟 120ms（错峰）
 *   v-reveal="{ delay: 120, threshold: 0.3, once: false }"
 *
 * 性能：仅使用 transform / opacity，配合 IntersectionObserver（被动、GPU 合成）。
 * 无障碍：prefers-reduced-motion 或不支持 IO 时直接显示，不做动画。
 */
export const reveal: Directive<HTMLElement, RevealOptions | number | undefined> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<RevealOptions | number | undefined>) {
    const opts: RevealOptions =
      typeof binding.value === 'number'
        ? { delay: binding.value }
        : (binding.value as RevealOptions) ?? {}

    const variant = (Object.keys(binding.modifiers)[0] as RevealVariant | undefined) ?? 'up'

    el.classList.add('reveal', `reveal--${variant}`)
    if (opts.delay) {
      el.style.setProperty('--reveal-delay', `${opts.delay}ms`)
    }

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            if (opts.once !== false) observer.unobserve(el)
          } else if (opts.once === false) {
            el.classList.remove('is-visible')
          }
        }
      },
      {
        threshold: opts.threshold ?? 0.15,
        rootMargin: opts.rootMargin ?? '0px 0px -10% 0px',
      },
    )

    observer.observe(el)
    observerMap.set(el, observer)
  },

  unmounted(el: HTMLElement) {
    observerMap.get(el)?.disconnect()
    observerMap.delete(el)
  },
}
