<script setup lang="ts">
const props = defineProps<{
  categories: string[]
  active: string
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

function select(category: string) {
  emit('select', category)
}
</script>

<template>
  <div class="category-filter">
    <button
      v-for="category in categories"
      :key="category"
      type="button"
      class="category-filter__pill"
      :class="{ 'category-filter__pill--active': active === category }"
      @click="select(category)"
    >
      {{ category }}
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-filter__pill {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  white-space: nowrap;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.category-filter__pill:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.category-filter__pill--active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.category-filter__pill--active:hover {
  color: #fff;
  background: var(--color-primary-hover);
}
</style>
