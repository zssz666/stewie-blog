import { ref } from 'vue'

export function useTilt(maxTilt = 4) {
  const transform = ref('')
  const isActive = ref(false)

  function handleMove(e: MouseEvent) {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(hover: hover)').matches === false ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      return
    }
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 2 * maxTilt
    const rotateX = -(y - 0.5) * 2 * maxTilt
    transform.value = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    isActive.value = true
  }

  function handleLeave() {
    transform.value = ''
    isActive.value = false
  }

  return { transform, isActive, handleMove, handleLeave }
}
