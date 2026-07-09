<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pages: number
  total: number
}>()

const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

const canPrev = computed(() => props.page > 1)
const canNext = computed(() => props.page < props.pages)

// 生成要显示的页码（页数较多时用 '...' 折叠中间段）
const pagesList = computed<(number | '...')[]>(() => {
  const totalPages = props.pages
  const current = props.page

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const result: (number | '...')[] = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(totalPages - 1, current + 1)
  if (left > 2) result.push('...')
  for (let i = left; i <= right; i++) result.push(i)
  if (right < totalPages - 1) result.push('...')
  result.push(totalPages)
  return result
})

function go(p: number) {
  if (p < 1 || p > props.pages || p === props.page) return
  emit('change', p)
}
</script>

<template>
  <nav v-if="pages > 1" class="pagination" aria-label="分页导航">
    <button
      type="button"
      class="pagination__btn pagination__btn--nav"
      :disabled="!canPrev"
      aria-label="上一页"
      @click="go(page - 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <template v-for="(p, idx) in pagesList" :key="idx">
      <span v-if="p === '...'" class="pagination__ellipsis">…</span>
      <button
        v-else
        type="button"
        class="pagination__btn"
        :class="{ 'pagination__btn--active': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="pagination__btn pagination__btn--nav"
      :disabled="!canNext"
      aria-label="下一页"
      @click="go(page + 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.pagination__btn {
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.pagination__btn:hover:not(:disabled):not(.pagination__btn--active) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.pagination__btn--active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.pagination__btn--nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__ellipsis {
  color: var(--color-text-tertiary);
  padding: 0 4px;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .pagination__btn {
    transition: none;
  }
}
</style>
