import { onBeforeUnmount, ref } from 'vue'

/**
 * useMagnetic —— 鼠标靠近元素时产生微弱磁吸效果。
 * 元素会向鼠标方向轻微偏移，离开时平滑回弹。
 *
 * @param strength 吸引强度（px），默认 12
 * @param radius 触发半径倍数（相对元素尺寸），默认 1.5
 * @param ease 缓动系数 (0~1)，越大回弹越快，默认 0.12
 */
export function useMagnetic(strength = 12, radius = 1.5, ease = 0.12) {
  const x = ref(0)
  const y = ref(0)
  let raf = 0
  let currentX = 0
  let currentY = 0

  function onMouseMove(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement
    if (!el) return

    // 跳过触屏和非悬停设备
    if (!window.matchMedia('(hover: hover)').matches) return

    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = Math.max(rect.width, rect.height) * radius

    if (dist < maxDist) {
      const power = (1 - dist / maxDist)
      const targetX = (dx / maxDist) * strength * power
      const targetY = (dy / maxDist) * strength * power
      animateTo(targetX, targetY)
    } else {
      animateTo(0, 0)
    }
  }

  function onMouseLeave() {
    animateTo(0, 0)
  }

  function animateTo(tx: number, ty: number) {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      currentX += (tx - currentX) * ease
      currentY += (ty - currentY) * ease
      x.value = currentX
      y.value = currentY
      // 如果距离目标足够近就停止
      if (Math.abs(tx - currentX) > 0.1 || Math.abs(ty - currentY) > 0.1) {
        animateTo(tx, ty)
      }
    })
  }

  onBeforeUnmount(() => cancelAnimationFrame(raf))

  return { x, y, onMouseMove, onMouseLeave }
}
