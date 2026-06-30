import { ref } from 'vue'

export function useTilt(maxTilt = 3) {
  const transform = ref('')

  function handleMove(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 2 * maxTilt
    const rotateX = -(y - 0.5) * 2 * maxTilt
    transform.value = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  function handleLeave() {
    transform.value = ''
  }

  return { transform, handleMove, handleLeave }
}
