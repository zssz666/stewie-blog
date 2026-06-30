import { onMounted, ref, type Ref } from 'vue'

export function useInView(
  target: Ref<HTMLElement | null>,
  threshold = 0.15,
) {
  const isInView = ref(false)

  onMounted(() => {
    if (!target.value) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isInView.value = true
            observer.disconnect()
          }
        }
      },
      { threshold },
    )
    observer.observe(target.value)
  })

  return { isInView }
}
