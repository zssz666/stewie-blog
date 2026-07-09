import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  twinkleSpeed: number
  twinklePhase: number
}

/**
 * useParticles —— Hero 区域的萤火虫/尘埃粒子效果。
 * 纯 Canvas 2D，仅桌面端运行，prefers-reduced-motion 时跳过。
 *
 * @param canvasRef 画布元素 ref
 * @param options 配置项
 */
export function useParticles(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options?: {
    count?: number       // 粒子数量（默认 40）
    maxRadius?: number   // 最大半径（默认 2.5）
    speedRange?: [number, number] // 速度范围（默认 [0.15, 0.5]）
    color?: string       // 颜色（默认 '255,245,220' 月光暖白）
  },
) {
  const COUNT = options?.count ?? 40
  const MAX_R = options?.maxRadius ?? 2.5
  const SPEED = options?.speedRange ?? [0.15, 0.45]
  const COLOR = options?.color ?? '255, 245, 220'

  let particles: Particle[] = []
  let animId = 0
  let ctx: CanvasRenderingContext2D | null = null
  let W = 0
  let H = 0

  /* 鼠标排斥 */
  let mouseX = -9999
  let mouseY = -9999
  const REPEL_RADIUS = 120
  const REPEL_FORCE = 0.03

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return
    ctx = canvas.getContext('2d')
    if (!ctx) return
    resize()
    particles = Array.from({ length: COUNT }, () => makeParticle())
  }

  function resize() {
    const canvas = canvasRef.value
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = canvas.clientWidth
    H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function makeParticle(): Particle {
    return {
      x: Math.random() * (W || window.innerWidth),
      y: Math.random() * (H || window.innerHeight),
      vx: (Math.random() - 0.5) * (SPEED[1] - SPEED[0]) + SPEED[0],
      vy: (Math.random() - 0.5) * (SPEED[1] - SPEED[0]) * 0.6 + SPEED[0] * 0.3,
      r: Math.random() * MAX_R + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: 0.008 + Math.random() * 0.02,
      twinklePhase: Math.random() * Math.PI * 2,
    }
  }

  function draw(p: Particle, time: number) {
    if (!ctx) return
    const twinkle = Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.3 + 0.7
    const a = p.alpha * twinkle

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${COLOR}, ${a})`
    ctx.fill()

    /* 大粒子带一点光晕 */
    if (p.r > 1.6) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${COLOR}, ${a * 0.08})`
      ctx.fill()
    }
  }

  function update(p: Particle) {
    // 鼠标排斥
    const dx = p.x - mouseX
    const dy = p.y - mouseY
    const distSq = dx * dx + dy * dy
    if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 1) {
      const dist = Math.sqrt(distSq)
      const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE
      p.vx += (dx / dist) * force
      p.vy += (dy / dist) * force
    }

    // 速度阻尼 + 位置更新
    p.vx *= 0.995
    p.vy *= 0.995
    p.x += p.vx
    p.y += p.vy

    // 边界环绕
    if (p.x < -20) p.x = W + 20
    if (p.x > W + 20) p.x = -20
    if (p.y < -20) p.y = H + 20
    if (p.y > H + 20) p.y = -20
  }

  function tick(time: number) {
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    for (const p of particles) {
      update(p)
      draw(p, time)
    }
    animId = requestAnimationFrame(tick)
  }

  function onMouseMove(e: MouseEvent) {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    mouseX = e.clientX - rect.left
    mouseY = e.clientY - rect.top
  }

  function onMouseLeave() {
    mouseX = -9999
    mouseY = -9999
  }

  onMounted(() => {
    // 仅桌面端 + 非 reduced-motion
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(hover: hover)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !canvasRef.value
    ) {
      return
    }

    init()

    if (particles.length > 0) {
      animId = requestAnimationFrame(tick)

      canvasRef.value?.addEventListener('mousemove', onMouseMove, { passive: true })
      canvasRef.value?.addEventListener('mouseleave', onMouseLeave, { passive: true })
      window.addEventListener('resize', resize, { passive: true })
    }
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
    canvasRef.value?.removeEventListener('mousemove', onMouseMove)
    canvasRef.value?.removeEventListener('mouseleave', onMouseLeave)
  })

  return { init }
}
